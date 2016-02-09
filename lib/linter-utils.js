'use strict';

var util = require('util');

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
    var hash = {};
    var arr = ruleObj.required_instructions;
    for (var i = 0, len = arr.length; i < len; i++) {
        hash[arr[i].instruction] = arr[i];
        arr[i].exists = false;
    }
    return hash;
};

//TODO TestMe
module.exports.createRequiredLabelsHash = function (ruleObj) {
    var hash = {};
    var label_rules = ruleObj.line_rules["LABEL"] || ruleObj.line_rules[
            "Label"];
    if (label_rules && label_rules.defined_label_rules) {
        var arr = label_rules.defined_label_rules;
        for (var i = 0, len = arr.length; i < len; i++) {
            var labelRule = arr[i][Object.keys(arr[i])[0]]; //TODO we assume a single property - need to validate rule file
            if (labelRule.required && labelRule.required !== 'no') { //optional or required
                hash[Object.keys(arr[i])[0]] = arr[i];
                arr[i].exists = false;
            }
        }
    }
    return hash;
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

module.exports.checkRequiredLabels = function (requiredLabels, result) {
    for (var label in requiredLabels) {
        if (requiredLabels.hasOwnProperty(label)) {
            if (!requiredLabels[label].exists) {
                var labelRule = requiredLabels[label][label];
                if (labelRule.required === 'recommended') {
                    addResult(result, -1, null, "recommended label '" +
                        label + "' missing", 'warn');
                } else {
                    addError(result, -1, null, "Required label '" +
                        label + "' missing")
                }
            }
        }
    }
}; //TODO TestMe

module.exports.checkLineRules = function (rules, instruction, line, lineNumber,
                                          result) {
    if (!rules.line_rules[instruction]) {
        //console.log("No Line Rules for instruction :" + instruction);
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

module.exports.createValidCommandRegex = function (commandList) {
    if (util.isArray(commandList)) {
        var regexStr = '\^\(';
        var commands = commandList.join('\|');
        regexStr = regexStr + commands;
        regexStr = regexStr + '\)\(\\\s\)\+';
        return new RegExp(regexStr, 'i');
    } else {
        //console.log("Invalid Paremeter for command regex");
        return null;
    }
};


function findLabelRule(key, rules) {
    if (!rules || !key) {
        return null;
    }
    if (typeof key !== 'string') {
        console.log("Invalid label key: " + key);
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
module.exports.findLabelRule = findLabelRule;


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
    //console.log("Pushing result to " + printObject(target));
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


function validateDefaultLabelRule(result, lineno, line, key, value, rule) {

    var level = rule.level ? rule.level : 'error';
    var valid = true;
    var label = key + "=" + value;
    key = stripQuotes(key);
    value = stripQuotes(value);
    if (rule.keyRegex && !eval(rule.keyRegex).exec(key)) {
        addResult(result,
            lineno,
            line,
            rule.key_error_message ? rules.key_error_message + " ->'" +
            label + "'" : 'Key for label ' + label +
            ' is not in required format',
            level);
        valid = false;
    }
    if (rule.valueRegex && !eval(rule.valueRegex).exec(value)) {
        addResult(result,
            lineno,
            line,
            rule.value_error_message ? rule.value_error_message + " ->'" +
            label + "'" : 'Value for label ' + label +
            ' is not in required format',
            level);
        valid = false;
    }
    //console.log("validation default rule for " + label + " valid ->" + valid );
    return valid;
}
module.exports.validateDefaultLabelRule = validateDefaultLabelRule;


module.exports.validateLabels = function (command, context, result) {
    //console.log("validating labels");
    var lineno = command.lineno,
        rules = context.rules,
        line = command.raw,
        requiredLabels = context.requiredLabels,
        labels = command.args;
    var instruction = 'LABEL';
    if (!labels) {
        addError(result, lineno, line, 'Invalid label syntax parameters');
        return false;
    }
    var labelKeys = Object.keys(labels);
    var defined_label_rules = rules.line_rules[instruction].defined_label_rules ?
        rules.line_rules[instruction].defined_label_rules : null;
    var default_rules = rules.line_rules[instruction].default_label_rules ?
        rules.line_rules[instruction].default_label_rules : null;
    if (defined_label_rules && defined_label_rules.length > 0) {
        for (var i = 0; i < labelKeys.length; i++) {
            var labelName = stripQuotes(labelKeys[i]);
            var labelRuleMatch = findLabelRule(labelName,
                defined_label_rules);
            if (labelRuleMatch) {
                var label_rule = labelRuleMatch[labelName];
                if (label_rule.required || label_rule.required === "recommended") {
                    requiredLabels[labelName].exists = true;
                }
                if (label_rule.valueRegex && !eval(label_rule.valueRegex)
                        .exec(stripQuotes(labels[labelName]))) {
                    var level = label_rule.level ? label_rule.level :
                        'error';
                    var label = labelKeys[i] + "=" + labels[labelName];
                    addResult(result,
                        lineno,
                        line,
                        label_rule.message ? label_rule.message +
                        " ->'" + label + "'" : 'Value for label ' +
                        label + ' is not in required format',
                        level);
                }
            } else if (default_rules) {
                validateDefaultLabelRule(result, lineno, line, labelKeys[i],
                    labels[labelKeys[i]], default_rules);
            }
        }
    } else if (default_rules) {
        validateDefaultLabelRule(result, lineno, line, labelKeys[i], labels[
            labelKeys[i]], default_rules);
    }
};
