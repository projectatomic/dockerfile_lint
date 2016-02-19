'use strict';

var util = require('util'),
    logger = require('./logger');

//TODO move to utils
function printObject(obj) {
    return JSON.stringify(obj, null, 2)
}

function stripQuotes(value) {
    value = value.replace(/(^")|("$)/g, '');
    value = value.replace(/(^')|('$)/g, '');
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

function addResult(result, lineNumber, line, msg, level) {
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
        lineContent: line ? line : ''
    });
    target.count++;
}
module.exports.addResult = addResult;


function addError(result, lineNumber, line, msg) {
    addResult(result, lineNumber, line, msg, 'error');
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


function findNameValRule(key, rules) {
    if (!rules || !key) {
        return null;
    }
    if (typeof key !== 'string') {
        //console.log("Invalid label key: " + key);
        return null;
    }
    for (var i = 0; i < rules.length; i++) {
        var keys = Object.keys(rules);
        for (var j = 0; j < keys.length; j++) {
            if (rules[i].hasOwnProperty(stripQuotes(key))) {
                return rules[i];
            }
        }
    }
    return null;
}

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
            level);
        valid = false;
    }
    if (rule.valueRegex && !eval(rule.valueRegex).exec(value)) {
        addResult(result,
            lineno,
            line,
            rule.value_error_message ? rule.value_error_message + " ->'" +
            nameVal + "'" : 'Value for ' + command.name + ' ' + nameVal +
            ' is not in required format',
            level);
        valid = false;
    }
    return valid;
}

function isNameValCompatible(cmd) {

    if (cmd === 'LABEL' ||
        cmd === 'ENV' ||
        cmd === 'ARG') {
        return true;
    }
    return false;
}


//TODO TestMe
module.exports.createRequiredNameValDict = function (ruleObj) {
    var hash = {};
    var nameValCmds = Object.keys(ruleObj.line_rules).filter(isNameValCompatible);
    nameValCmds.forEach(function (cmd) {
        var lineRule = ruleObj.line_rules[cmd];
        if (lineRule && lineRule.defined_namevals) {
            var arr = lineRule.defined_namevals;
            for (var i = 0, len = arr.length; i < len; i++) {
                if (!arr[i]) continue;
                var nameValRule = arr[i][Object.keys(arr[i])[0]]; //TODO we assume a single propert
                if (nameValRule.required) { //optional or required
                    hash[cmd + Object.keys(arr[i])[0]] = arr[i];//Change key to 'INSTRUCTION-key' when we make generic
                    arr[i].exists = false;
                    arr[i].command = cmd;
                }
            }
        }
    });
    return hash;
};


module.exports.checkRequiredNameVals = function (requiredNameVals, result) {
    //TODO add reference URL
    for (var nameVal in requiredNameVals) {
        if (requiredNameVals.hasOwnProperty(nameVal)) {
            if (!requiredNameVals[nameVal].exists) {
                var command = requiredNameVals[nameVal].command;
                var nameValProp = Object.keys(requiredNameVals[nameVal])[0];
                var keyRule = requiredNameVals[nameVal][nameValProp];
                if (keyRule.required === 'recommended') {
                    addResult(result, -1, null, "Recommended " + command + " name/key '" + nameValProp +
                        "' is not defined", 'warn');
                } else {
                    addError(result, -1, null, "Required " + command + " name/key '" + nameValProp +
                        "' is not defined") //TODO print instruction too
                }
            }
        }
    }
}; //TODO TestMe


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
    if (definedRules && definedRules.length > 0) {
        for (var i = 0; i < names.length; i++) {
            var name = stripQuotes(names[i]);
            var ruleMatch = findNameValRule(name, definedRules);
            if (ruleMatch) {
                var rule = ruleMatch[name];
                if (rule.required || rule.required === "recommended") {
                    requiredNameVals[instruction + name].exists = true;
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
                        level);
                }
            } else if (defaultRules) {
                validateNameValRule(command, result, lineno, line, names[i],
                    nameVals[names[i]], defaultRules);
            }
        }
    } else if (defaultRules) {
        validateNameValRule(command, result, lineno, line, names[i], nameVals[names[i]], defaultRules);
    }
};

