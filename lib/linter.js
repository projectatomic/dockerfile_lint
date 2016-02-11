'use strict';


//var path = require('path');
//var fs = require('fs');
//var extend = require('extend');
//var yamlParser = require('js-yaml');
//var util = require('util');

// config = require('../config/config');
var helper = require('./linter-utils'),
    parser = require('./parser'),
    loadRules = require('./rulefile-loader');

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

/**
 * Create an instance of a linter object using the given rule file
 * @param ruleFilePath - the location of a rule file
 * @constructor
 */
function Linter(ruleFilePath) {
    if (!ruleFilePath) console.log("No rule file provided, using default rules");
    this.rules = loadRules(ruleFilePath);
    this.context = {
        rules: this.rules,
        validInstructionsRegex: helper.createValidCommandRegex(this.rules.general.valid_instructions),
        requiredInstructions: helper.createReqInstructionHash(this.rules),
        requiredLabels: helper.createRequiredLabelsHash(this.rules)
    };
    helper.initLineRulesRegexes(this.rules);
}

/**
 *
 * @returns {string}
 */
Linter.prototype.getProfile = function () {
    return this.rules.profile;
};

/**
 * Validate  dockerfile contents string and returns the array of commands.
 *
 * @param contents {String}  The dockerfile file content.
 * @returns        {Array}
 */
Linter.prototype.validate = function (contents) {
    if (typeof contents !== 'string') {
        return finish([{
            message: 'Invalid type'
        }]);
    }
    var result = helper.newResult();
    var options = {includeComments: false};
    var commands = parser.parse(contents, options);
    // @see  parser.parse for format of commands
    if (commands.length < 1) {
        helper.addError(result, 0, null,
            "Invalid Dockerfile. No commands found!");
        return finish(result);
    }
    if (commands[0].name !== 'FROM') {
        helper.addError(result, commands[0].lineno, commands[0].raw,
            'Missing or misplaced FROM');
    }
    for (var i = 0; i < commands.length; i++) {
        validateCommand(commands[i], this.context, result);
    }
    helper.checkRequiredInstructions(this.context.requiredInstructions, result);
    helper.checkRequiredLabels(this.context.requiredLabels, result);
    return finish(result);
};


module.exports = Linter;
