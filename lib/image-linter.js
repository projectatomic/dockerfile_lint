'use strict';

var helper = require('./linter-utils'),
    parser = require('./parser'),
    loadRules = require('./rulefile-loader').load,
    commandsFromInspect = require('./inspect-to-dockerfile').commandsFromInspect,
    logger = require('./logger');

//TODO move to utils
function printObject(obj) {
    return JSON.stringify(obj, null, 2)
}

function finish(result) {
    return result;
}

var commandValidators = {
    //For now we just check labels
    'LABEL': helper.validateNameVals

};


function validateCommand(command, context, result) {
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
function ImageLinter(ruleFilePath) {
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
ImageLinter.prototype.getProfile = function () {
    return this.rules.profile;
};


/**
 * Validate  docker inspect output string and returns the array of analysis
 * results.
 *
 * @param contents {String}  The  docker inspect output.
 * @returns        {Array}
 */
ImageLinter.prototype.validate = function (contents) {
    if (typeof contents !== 'string') {
        return finish([{
            message: 'Invalid type'
        }]);
    }
    var result = helper.newResult();
    var commands = commandsFromInspect(contents);
    for (var i = 0; i < commands.length; i++) {
        validateCommand(commands[i], this.context, result);
    }
    helper.checkRequiredInstructions(this.context.requiredInstructions, result);
    helper.checkRequiredNameVals(this.context.requiredNameVals, result);
    return finish(result);
};


module.exports = ImageLinter;
