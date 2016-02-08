'use strict';


var path = require('path');
var fs = require('fs');
var extend = require('extend');
var yamlParser = require('js-yaml');
var util = require('util');

var config = require('../config/config');
var helper = require('./linter-utils');
var parser = require('./parser');

//TODO move to utils
function printObject(obj) {
    return JSON.stringify(obj, null, 2)
}

function finish(result) {
    return result;
}

var commandValidators = {
    'LABEL': helper.validateLabels
};

//TODO TestMe
function getRules(rulefile) {
    //TODO throw exceptions if invalid file!
    try {
        //First get the base rules
        var baseRuleLocation = fs.readFileSync(config.BASE_RULES, 'UTF-8');
        var baseRules = yamlParser.safeLoad(baseRuleLocation);
        ////console.log(JSON.stringify(baseRules,null,2));
    } catch (e) {
        //console.log("Error reading base rules " + e);
        return null;
    }
    if (!rulefile) {
        return baseRules;
    } else {
        try {
            var rules = yamlParser.safeLoad(rulefile);
            var combinedRules = extend(true, baseRules, rules);
            return combinedRules;
        } catch (e) {
            //console.log(e);
            return null;
        }
    }
}

function validateCommand(command, context, result) {
    if (command.error) {
        helper.addError(result, command.lineno, command.raw, command.error);
    }
    var rules = context.rules;
    //Check if command is a valid Dockerfile command
    var instruction = context.validInstructionsRegex.exec(command.raw);
    if (!instruction) {
        helper.addError(result, command.lineno, command.raw,
            'Invalid instruction');
        return false;
    }
    instruction = instruction[0].trim()
        .toUpperCase();
    // Update existence hash for later check
    if (instruction in context.requiredInstructions) {
        context.requiredInstructions[instruction].exists = true;
    }
    helper.checkLineRules(rules, instruction, command.raw, command.lineno,
        result);
    if (rules.line_rules[instruction] && rules.line_rules[
            instruction].paramSyntaxRegex) {
        var validParams = rules.line_rules[instruction].paramSyntaxRegex
            .test(command.args);
        if (!validParams) {
            helper.addError(result, command.lineno, command.raw,
                'Bad Parameters');
            return false;
        }
    }
    var commandValidatorFn = commandValidators[command.name];
    if (commandValidatorFn) {
        commandValidatorFn(command, context, result);
    }
}

function Validator(rulefile) {
    if (!rulefile) {
        throw 'Null rule file';
    };
    var rules = getRules(rulefile);
    var context = {
        rules: rules,
        validInstructionsRegex: helper.createValidCommandRegex(rules.general
            .valid_instructions),
        requiredInstructions: helper.createReqInstructionHash(rules),
        requiredLabels: helper.createRequiredLabelsHash(rules)
    }
    helper.initLineRulesRegexes(rules);

    function getProfile() {
        return ruleObject.profile;
    };

    function validate(dockerfile) {
        if (typeof dockerfile !== 'string') {
            return finish([{
                message: 'Invalid type'
            }]);
        }
        var options = {
            includeComments: false
        };
        var result = helper.newResult();
        var commands = parser.parse(dockerfile, options);
        if (commands.length < 1) {
            helper.addError(result, 0, null,
                "Invalid Dockerfile. No commands found!");
            return finish(result);
        };
        if (commands[0].name !== 'FROM') {
            helper.addError(result, commands[0].lineno, commands[0].raw,
                'Missing or misplaced FROM');
        }
        for (var i = 0; i < commands.length; i++) {
            validateCommand(commands[i], context, result);
        }
        helper.checkRequiredInstructions(context.requiredInstructions, result);
        helper.checkRequiredLabels(context.requiredLabels, result);
        return finish(result);
    };

    return {
        getProfile: getProfile,
        validate: validate
    }
}

module.exports = Validator;
