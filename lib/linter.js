'use strict';

var helper = require('./linter-utils'),
    parser = require('./parser'),
    loadRules = require('./rulefile-loader').load,
    logger = require('./logger');

//TODO move to utils
function printObject(obj) {
    return JSON.stringify(obj, null, 2)
}

function finish(result) {
    return result;
}

var commandValidators = {
    'LABEL': helper.validateNameVals
};


function validateCommand(command, context, result) {
    if (command.error) {
        helper. or(result, command.lineno, command.raw, command.error,null);
    }
    var rules = context.rules;
    //Check if command is a valid Dockerfile command
    logger.debug("Checking command : " + command.name);
    var isValid = context.validInstructionsRegex.test(command.raw);
    if (!isValid) {
        helper.addError(result, command.lineno, command.raw, 'Invalid instruction',null);
        return false;
    }
    var instruction = command.name.trim().toUpperCase();
    // Update existence hash for later check
    if (instruction in context.requiredInstructions) {
        context.requiredInstructions[instruction].exists = true;
    }
    helper.checkLineRules(rules, instruction, command.raw, command.lineno, result);
    if (rules.line_rules[instruction] && rules.line_rules[instruction].paramSyntaxRegex) {
        var stringParams = command.raw.replace(instruction, '').trim();
        var validParams = rules.line_rules[instruction].paramSyntaxRegex.test(stringParams);
        if (!validParams) {
            helper.addError(result, command.lineno, command.raw, 'Invalid parameters for command.',null);
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
    if (!ruleFilePath) logger.info("No rule file provided, using default rules");
    this.rules = loadRules(ruleFilePath);
    this.context = {
        rules: this.rules,
        validInstructionsRegex: helper.createValidCommandRegex(this.rules.general.valid_instructions),
        requiredInstructions: helper.createReqInstructionHash(this.rules),
        requiredNameVals: helper.createRequiredNameValDict(this.rules)
    };
    helper.initLineRulesRegexes(this.rules);
}

/**
 * Return the profile section of the current rule file
 * @returns {}
 */
Linter.prototype.getProfile = function () {
    return this.rules.profile;
};

/**
 * Validate  dockerfile contents string and returns the array of analysis
 * results.
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
            "Invalid Dockerfile. No commands found!",null);
        return finish(result);
    }
    if (commands[0].name !== 'FROM') {
        helper.addError(result, commands[0].lineno, commands[0].raw,
            'Missing or misplaced FROM',null);
    }
    for (var i = 0; i < commands.length; i++) {
        validateCommand(commands[i], this.context, result);
    }
    helper.checkRequiredInstructions(this.context.requiredInstructions, result);
    helper.checkRequiredNameVals(this.context.requiredNameVals, result);
    return finish(result);
};


module.exports = Linter;
