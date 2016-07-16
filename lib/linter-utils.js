'use strict';

var util = require('util'),
    logger = require('./logger'),
    _ = require('lodash')

//TODO move to utils
function printObject(obj) {
    return JSON.stringify(obj, null, 2);
}

function stripQuotes(value) {
    if (value) {
        value = value.replace(/(^")|("$)/g, '');
        value = value.replace(/(^')|('$)/g, '');
    }


    return value;

}


//TODO TestMe
module.exports.createReqInstructionHash = function (ruleObj) {
    return ruleObj.required_instructions;
};


//TODO TestMe
module.exports.initLineRulesRegexes = function (ruleObj) {

    var lineRules = ruleObj.line_rules;
    if (!lineRules) {
        return;
    }
    for (var rule in lineRules) {
        if (lineRules.hasOwnProperty(rule)) {
            lineRules[rule].paramSyntaxRegex = eval(lineRules[rule].paramSyntaxRegex);
            for (var semanticRule in lineRules[rule].rules) {
                lineRules[rule].rules[semanticRule].regex = eval(lineRules[
                    rule].rules[semanticRule].regex);
            }
        }
    }
};

//TODO TestMe
module.exports.checkRequiredInstructions = function (instructions, result) {
    for (var instruction in instructions) {
        if (instructions.hasOwnProperty(instruction)) {
            if (!instructions[instruction].exists) {
                result[instructions[instruction].level].count++;
                result[instructions[instruction].level].data.push(
                    instructions[instruction]);
            }
        }
    }
};


module.exports.createValidCommandRegex = function (commandList) {
    if (util.isArray(commandList)) {
        var regexStr = '\^\(';
        var commands = commandList.join('\|');
        regexStr = regexStr + commands;
        regexStr = regexStr + '\)\(\\\s\)\+';
        return new RegExp(regexStr, 'i');
    } else {
        logger.warn("Invalid Paremeter for command regex");
        return null;
    }
};


function newResult() {
    return {
        error: {
            count: 0,
            data: []
        },
        warn: {
            count: 0,
            data: []
        },
        info: {
            count: 0,
            data: []
        },
        summary: []
    }
}
module.exports.newResult = newResult;

function addResult(result, lineNumber, line, msg, level, ref_url) {
    var target = null;
    switch (level) {
        case 'error':
            target = result.error;
            break;
        case 'warn':
            target = result.warn;
            break;
        case 'info':
            target = result.info;
            break;
        default:
            target = result.error;
    }
    target.data.push({
        message: msg,
        line: lineNumber,
        level: level,
        lineContent: line ? line : '',
        reference_url: ref_url
    });
    target.count++;
}
module.exports.addResult = addResult;


function addError(result, lineNumber, line, msg, ref_url) {
    if (!ref_url) ref_url = "https://docs.docker.com/reference/builder/";
    addResult(result, lineNumber, line, msg, 'error', ref_url);
}
module.exports.addError = addError;

module.exports.checkLineRules = function (rules, instruction, line, lineNumber, result) {
    if (!rules.line_rules[instruction]) {
        logger.debug("No Line Rules for instruction :" + instruction);
        return;
    }
    var rules = rules.line_rules[instruction].rules;
    for (var index in rules) {
        if (rules.hasOwnProperty(index)) {
            var rule = rules[index];
            if (rule.regex && rule.regex.test(line) && !rule.inverse_rule) {
                result[rule.level].count++;
                var ruleCopy = JSON.parse(JSON.stringify(rule));
                ruleCopy.lineContent = line;
                ruleCopy.line = lineNumber;
                result[rule.level].data.push(ruleCopy);
            } else if (rule.regex && !rule.regex.test(line) && rule.inverse_rule) {
                result[rule.level].count++;
                var ruleCopy = JSON.parse(JSON.stringify(rule));
                ruleCopy.lineContent = line;
                ruleCopy.line = lineNumber;
                result[rule.level].data.push(ruleCopy);
            }
        }
    }
};


function validateNameValRule(command, result, lineno, line, key, value, rule) {

    var level = rule.level ? rule.level : 'error';
    var valid = true;
    var nameVal = key + "=" + value;
    key = stripQuotes(key);
    value = stripQuotes(value);
    if (rule.keyRegex && !eval(rule.keyRegex).exec(key)) {
        addResult(result,
            lineno,
            line,
            rule.name_error_message ? rule.name_error_message + " ->'" +
            nameVal + "'" : 'Name for ' + command.name + ' ' + nameVal +
            ' is not in required format',
            level,
            rule.reference_url);
        valid = false;
    }
    if (rule.valueRegex && !eval(rule.valueRegex).exec(value)) {
        addResult(result,
            lineno,
            line,
            rule.value_error_message ? rule.value_error_message + " ->'" +
            nameVal + "'" : 'Value for ' + command.name + ' ' + nameVal +
            ' is not in required format',
            level,
            rule.reference_url);
        valid = false;
    }
    return valid;
}

function isNameValCompatible(cmd) {
    return _.contains(['ARG', 'ENV', 'LABEL'], cmd);
}


//TODO TestMe
module.exports.createRequiredNameValDict = function (ruleObj) {
    var hash = {};
    var nameValCmds = Object.keys(ruleObj.line_rules).filter(isNameValCompatible);
    nameValCmds.forEach(function (cmd) {
        var lineRule = ruleObj.line_rules[cmd];
        var nameValRules = (lineRule && lineRule.defined_namevals) ? lineRule.defined_namevals : null;
        if (nameValRules) {
            var requiredNameVals = {};
            for (var key in nameValRules) {
                if (nameValRules.hasOwnProperty(key)) {
                    if (!nameValRules[key]) continue;
                    var nameValRule = nameValRules[key];
                    if (nameValRule.required) {
                        requiredNameVals[key] = nameValRule;
                        hash[cmd] = requiredNameVals; //we put the name vals for each command under one key
                    }
                }
            }
        }
    });
    return hash;
};


module.exports.checkRequiredNameVals = function (requiredNameVals, result) {

    for (var command in requiredNameVals) {
        if (requiredNameVals.hasOwnProperty(command)) {
            for (var nameVal in requiredNameVals[command]) {
                if (!requiredNameVals[command][nameVal].exists) {
                    var keyRule = requiredNameVals[command][nameVal];
                    if (keyRule.required === 'recommended') {
                        addResult(result, -1, null, "Recommended " + command + " name/key '" + nameVal +
                            "' is not defined", 'warn', keyRule.reference_url);
                    } else {
                        addError(result, -1, null, "Required " + command + " name/key '" + nameVal +
                            "' is not defined", keyRule.reference_url)
                    }
                }
            }
        }
    }
}; //TODO TestMe


/**
 * Find a name val with name mathcing lookup key.
 * @param definedNameVals
 * @param lookupKey
 * @returns the matched matched name val and the key used to find it {matchedWith: key, match : nameVal} or null if no match.
 */
function nameValMatch(definedNameVals, lookupKey) {
    var keys = _.keys(definedNameVals),
        key,
        index;
    for (index in keys) {
        key = keys[index];
        if (key === lookupKey) {
            return {
                matchedWith: lookupKey,
                match: definedNameVals[key]
            };
        } else if (!definedNameVals[key].matchKeyCase && (key.toUpperCase() === (lookupKey.toUpperCase()))) {
            return {
                matchedWith: key,
                match: definedNameVals[key]
            };
        }
    }
    return null;
}


module.exports.validateNameVals = function (command, context, result) {
    logger.debug("validating name values for command " + command.name);
    var lineno = command.lineno,
        rules = context.rules,
        line = command.raw,
        requiredNameVals = context.requiredNameVals,
        nameVals = command.args;
    var instruction = command.name;
    if (!nameVals) {
        addError(result, lineno, line, 'Invalid  name values for instruction ' + instruction);
        return false;
    }
    var names = Object.keys(nameVals);
    var definedRules = rules.line_rules[instruction].defined_namevals ?
        rules.line_rules[instruction].defined_namevals : null;
    var defaultRules = rules.line_rules[instruction].nameval_defaults ?
        rules.line_rules[instruction].nameval_defaults : null;
    for (var i = 0; i < names.length; i++) {
        if (definedRules && Object.keys(definedRules).length > 0) {
            var name = stripQuotes(names[i]);
            var ruleMatch = nameValMatch(definedRules, name);
            if (ruleMatch) {
                var rule = ruleMatch.match;
                if (rule.required || rule.required === "recommended") {
                    requiredNameVals[instruction][ruleMatch.matchedWith].exists = true;
                }
                if (rule.valueRegex && !eval(rule.valueRegex)
                        .exec(stripQuotes(nameVals[name]))) {
                    var level = rule.level ? rule.level :
                        'error';
                    var nameVal = names[i] + "=" + nameVals[name];
                    addResult(result,
                        lineno,
                        line,
                        rule.message ? rule.message +
                        " ->'" + nameVal + "'" : 'Value for  ' +
                        nameVal + ' is not in required format',
                        level,
                        rule.reference_url);
                }
            } else if (defaultRules) {
                validateNameValRule(command, result, lineno, line, names[i],
                    nameVals[names[i]], defaultRules);
            }
        }
        else if (defaultRules) {
            validateNameValRule(command, result, lineno, line, names[i], nameVals[names[i]], defaultRules);
        }
    }
};


