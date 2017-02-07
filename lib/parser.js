// parser.js
/*
 * Implemenations is largely based on https://github.com/joyent/node-docker-file-parser/blob/master/parser.js
 * Slightly modified to handle comments within multiline  commands and also always return command.raw
 * The parser is not yet available in npm - will switch to npm dependency when it does
 */


var TOKEN_WHITESPACE = RegExp(/[\t\v\f\r ]+/);
var TOKEN_LINE_CONTINUATION = RegExp(/\\[ \t]*$/);
var TOKEN_COMMENT = RegExp(/^#.*$/);
var errDockerfileNotStringArray = new Error('When using JSON array syntax, ' + 'arrays must be comprised of strings only.');


function isSpace(s) {
    return s.match(/^\s$/);
}

/**
 * Parsers are dispatch calls that parse a single unit of text into a cmd.args
 * object which contains the statement details. Dockerfiles have varied (but not
 * usually unique, see ONBUILD for a unique example) parsing rules per-command,
 * and these unify the processing in a way that makes it manageable.
 */

// Parse onbuild, could potentially be used for anything that represents a
// statement with sub-statements.
//
// ONBUILD RUN foo bar -> (onbuild (run foo bar))
//
function parseSubCommand(cmd) {
    var parseDetails = parseLine(cmd.rest, cmd.lineno);
    if (parseDetails.command) {
        cmd.args = parseDetails.command;
        return true;
    }
    cmd.error = 'Unhandled onbuild command: ' + cmd.rest;
    return false;
}

// Helper to parse words (i.e space delimited or quoted strings) in a statement.
// The quotes are preserved as part of this function and they are stripped later
// as part of processWords().
function parseWords(rest) {
    var S_inSpaces = 1;
    var S_inWord = 2;
    var S_inQuote = 3;

    var words = [];
    var phase = S_inSpaces;
    var word = '';
    var quote = '';
    var blankOK = false;
    var ch;
    var pos;

    for (pos = 0; pos <= rest.length; pos++) {
        if (pos != rest.length) {
            ch = rest[pos];
        }

        if (phase == S_inSpaces) { // Looking for start of word
            if (pos == rest.length) { // end of input
                break;
            }
            if (isSpace(ch)) { // skip spaces
                continue;
            }
            phase = S_inWord; // found it, fall thru
        }
        if ((phase == S_inWord || phase == S_inQuote) && (pos == rest.length)) {
            if (blankOK || word.length > 0) {
                words.push(word);
            }
            break;
        }
        if (phase == S_inWord) {
            if (isSpace(ch)) {
                phase = S_inSpaces;
                if (blankOK || word.length > 0) {
                    words.push(word);
                }
                word = '';
                blankOK = false;
                continue;
            }
            if (ch == '\'' || ch == '"') {
                quote = ch;
                blankOK = true;
                phase = S_inQuote;
            }
            if (ch == '\\') {
                if (pos + 1 == rest.length) {
                    continue; // just skip \ at end
                }
                // If we're not quoted and we see a \, then always just
                // add \ plus the char to the word, even if the char
                // is a quote.
                word += ch;
                pos++;
                ch = rest[pos];
            }
            word += ch;
            continue;
        }
        if (phase == S_inQuote) {
            if (ch == quote) {
                phase = S_inWord;
            }
            // \ is special except for ' quotes - can't escape anything for '
            if (ch == '\\' && quote != '\'') {
                if (pos + 1 == rest.length) {
                    phase = S_inWord;
                    continue; // just skip \ at end
                }
                word += ch;
                pos++;
                ch = rest[pos];
            }
            word += ch;
        }
    }

    return words;
}

// Parse the HEALTHCHECK command.
// https://docs.docker.com/engine/reference/builder/#/healthcheck
function parseHealthcheck(cmd) {
    var words = parseWords(cmd.rest),
        cmdDirectiveIndex = words.indexOf("CMD"),        
        noneDirectiveIndex = words.indexOf("NONE");

    if (cmdDirectiveIndex === -1 && noneDirectiveIndex === -1) {
        cmd.error = 'A HEALTHCHECK instruction must specify either NONE, or a valid CMD and options';
        return false;
    } else if (cmdDirectiveIndex !== -1) {
        // Reject a CMD directive that doesn't preceed an actual command.
        if (cmdDirectiveIndex === words.length - 1) {
            cmd.error = 'A CMD directive must specify a command for the healthcheck to run';
            return false;
        }
        
        cmd.args = { command: words.slice(cmdDirectiveIndex + 1).join(" ") };

        if (cmdDirectiveIndex > 0) {
            // There are options specified, so let's verify they're valid.
            var cmdDirectiveOptions = words.slice(0, cmdDirectiveIndex),
                validCmdOptions = ["interval", "retries", "timeout"];

            for (var i = 0; i < cmdDirectiveOptions.length; i++) {
                var match = /--(\w+)=(\d+)/.exec(cmdDirectiveOptions[i]);
                if (!match) {
                    cmd.error = '"' + cmdDirectiveOptions[i] + '" isn\'t a syntactically valid CMD option';
                    return false;
                } else if (validCmdOptions.indexOf(match[1]) === -1) {
                    cmd.error = '"' + match[1] + '" isn\'t a valid CMD option';
                    return false;
                }

                cmd.args[match[1]] = match[2];
            }
        }
    } else if (noneDirectiveIndex !== -1) {
        if (words.length > 1) {
            cmd.error = 'The NONE directive doesn\'t support additional options';
            return false;
        }

        cmd.args = { isNone: true };
    }

    return true;
}

// Parse environment like statements. Note that this does *not* handle
// variable interpolation, which will be handled in the evaluator.
function parseNameVal(cmd) {
    // This is kind of tricky because we need to support the old
    // variant:   KEY name value
    // as well as the new one:    KEY name=value ...
    // The trigger to know which one is being used will be whether we hit
    // a space or = first.  space ==> old, "=" ==> new
    var word;
    var words = parseWords(cmd.rest);

    cmd.args = {};

    if (words.length === 0) {
        cmd.error = 'No KEY name value, or KEY name=value arguments found';
        return false;
    }

    if (words[0].indexOf('=') == -1) {
        // Old format (KEY name value)
        var strs = cmd.rest.split(TOKEN_WHITESPACE);
        if (strs.length < 2) {
            cmd.error = cmd.name + ' must have two arguments, got ' + cmd.rest;
            return false;
        }

        // Convert to new style key:value map.
        cmd.args[strs[0]] = strs.slice(1).join(' ');

    } else {
        // New format (KEY name=value ...)
        var i;
        for (i = 0; i < words.length; i++) {
            word = words[i];
            if (word.indexOf('=') == -1) {
                cmd.error = 'Syntax error - can\'t find = in ' + word + '. Must be of the form: name=value';
                return false;
            }
            var parts = word.split('=');
            cmd.args[parts[0]] = parts.slice(1).join('=');
        }
    }

    return true;
}

function parseEnv(cmd) {
    return parseNameVal(cmd);
}

function parseLabel(cmd) {
    return parseNameVal(cmd);
}

//LDMOD
function splitArgs(args) {
    var obj = {};
    args.forEach(function(arg) {
        var split = arg.split('=');
        obj[split[0].trim()] = (split.length > 1 ) ? split[1].trim() : null;
    });
    return obj;
}
// Parses a statement containing one or more keyword definition(s) and/or
// value assignments, like `name1 name2= name3="" name4=value`.
// Note that this is a stricter format than the old format of assignment,
// allowed by parseNameVal(), in a way that this only allows assignment of the
// form `keyword=[<value>]` like  `name2=`, `name3=""`, and `name4=value` above.
// In addition, a keyword definition alone is of the form `keyword` like `name1`
// above. And the assignments `name2=` and `name3=""` are equivalent and
// assign an empty value to the respective keywords.
function parseNameOrNameVal(cmd) {
    cmd.args = parseWords(cmd.rest);
    cmd.args = splitArgs(cmd.args);
    return true;
}

// Parses a whitespace-delimited set of arguments. The result is a
// list of string arguments.
function parseStringsWhitespaceDelimited(cmd) {
    cmd.args = cmd.rest.split(TOKEN_WHITESPACE);
    return true;
}

// Just stores the raw string.
function parseString(cmd) {
    cmd.args = cmd.rest;
    return true;
}

// Converts to JSON array, returns true on success, false otherwise.
function parseJSON(cmd) {
    try {
        var json = JSON.parse(cmd.rest);
    } catch (e) {
        return false;
    }

    // Ensure it's an array.
    if (!Array.isArray(json)) {
        return false;
    }

    // Ensure every entry in the array is a string.
    if (!json.every(function (entry) {
            return typeof(entry) === 'string';
        })) {
        return false;
    }

    cmd.args = json;
    return true;
}

// Determines if the argument appears to be a JSON array. If so, passes to
// parseJSON; if not, quotes the result and returns a single string.
function parseJsonOrString(cmd) {
    if (parseJSON(cmd)) {
        return true;
    }
    return parseString(cmd);
}

// Determines if the argument appears to be a JSON array. If so, parses as JSON;
// if not, attempts to parse it as a whitespace delimited string.
function parseJsonOrList(cmd) {
    if (parseJSON(cmd)) {
        return true;
    }
    return parseStringsWhitespaceDelimited(cmd);
}

// Dispatch Table. see line_parsers.go for the parse functions.
// The command is parsed and mapped to the line parser. The line parser
// recieves the arguments but not the command, and returns an AST after
// reformulating the arguments according to the rules in the parser
// functions. Errors are propagated up by Parse() and the resulting AST can
// be incorporated directly into the existing AST as a next.
var commandParsers = {
    'ADD': parseJsonOrList,
    'ARG': parseNameOrNameVal,
    'CMD': parseJsonOrString,
    'COPY': parseJsonOrList,
    'ENTRYPOINT': parseJsonOrString,
    'ENV': parseEnv,
    'EXPOSE': parseStringsWhitespaceDelimited,
    'FROM': parseString,
    'HEALTHCHECK': parseHealthcheck,
    'LABEL': parseLabel,
    'MAINTAINER': parseString,
    'ONBUILD': parseSubCommand,
    'RUN': parseJsonOrString,
    'SHELL': parseJsonOrString,
    'STOPSIGNAL': parseString,
    'USER': parseString,
    'VOLUME': parseJsonOrList,
    'WORKDIR': parseString
};

function isComment(line) {
    return line.match(TOKEN_COMMENT);
}

// Takes a single line of text and parses out the cmd and rest,
// which are used for dispatching to more exact parsing functions.
function splitCommand(line) {
    // Make sure we get the same results irrespective of leading/trailing spaces
    var match = line.match(TOKEN_WHITESPACE);
    if (!match) {
        return {
            name: line.toUpperCase(),
            rest: ''
        };
    }
    var name = line.substr(0, match.index).toUpperCase();
    var rest = line.substr(match.index + match[0].length);

    return {
        name: name,
        rest: rest
    };
}

// parse a line and return the partialLine.
function parseLine(line, lineno) {
    var command = null;

    line = line.trim();

    if (!line) {
        // Ignore empty lines
        return {
            command: null,
            partialLine: ''
        };
    }

    if (isComment(line)) {
        // Handle comment lines.
        command = {
            name: 'COMMENT',
            args: line,
            lineno: lineno
        };
        return {
            command: command,
            partialLine: ''
        };
    }

    if (line.match(TOKEN_LINE_CONTINUATION)) {
        // Line continues on next line.
        var partialLine = line.replace(TOKEN_LINE_CONTINUATION, '', 'g');
        return {
            command: null,
            partialLine: partialLine
        };
    }

    command = splitCommand(line);
    command.lineno = lineno;

    var commandParserFn = commandParsers[command.name];
    if (!commandParserFn) {
        // Invalid Dockerfile instruction, but allow it and move on.
        //console.log('Invalid Dockerfile command:', command.name);
        command.error = 'Invalid Command';
        commandParserFn = parseString;
    }
    //LDMOD
    command.raw = line;
    if (commandParserFn(command)) {
        // Successfully converted the arguments.
        delete command.rest;
    }

    return {
        command: command,
        partialLine: ''
    };
}

/**
 * Parse dockerfile contents string and returns the array of commands.
 *
 * Supported options:
 * {
 *    includeComments: false,     // Whether to include comment commands.
 * }
 *
 * Each commands is an object with these possible properties:
 * {
 *   name: 'ADD',                 // The name of the command
 *   args: [ '.', '/srv/app' ],   // Arguments (can be array, string or map)
 *   lineno: 5,                   // Line number in the contents string.
 *   error: null                  // Only if there was an error parsing command
 * }
 *
 * @param contents {String}  The dockerfile file content.
 * @param options  {Object}  Configurable parameters.
 * @returns        {Array}   Array of command entries - one for each line.
 */
function parse(contents, options) {
    var commands = [];
    var i;
    var line;
    var lineno;
    var lines = contents.split(/[\r\n]/);
    var parseResult;
    var partialLine = '';
    var includeComments = options && options['includeComments'];

    for (i = 0; i < lines.length; i++) {
        //LDMOD
        if (partialLine && (isComment(lines[i].trim()) || !lines[i].trim())) {
            //In this situation, we want to keep skipping forward until
            //we find the first line that is not a comment
            // we also skip empty lines
            while ((isComment(lines[i].trim()) || !lines[i].trim())  && (i < lines.length)) {
                if (isComment(lines[i].trim()) && includeComments) {
                    commands.push({
                        name: 'COMMENT',
                        args: lines[i],
                        lineno: i + 1
                    })
                }
                i++;
            }
            line = partialLine + lines[i];
        } else if (partialLine && !isComment(lines[i].trim())) {
            line = partialLine + lines[i];
            lineno = i + 1;
        } else {
            line = lines[i];
            lineno = i + 1;
        }
        parseResult = parseLine(line, lineno);
        if (parseResult.command) {
            if (parseResult.command.name !== 'COMMENT' || includeComments) {
                commands.push(parseResult.command);
            }
        }
        partialLine = parseResult.partialLine;
    }
    // Fix order in case of comments embedded in continuation lines
    commands.sort(function (c1, c2) {
        return c1.lineno - c2.lineno;
    })
    return commands;
}


module.exports = {
    parse: parse
};
