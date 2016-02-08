'use strict';


var path = require('path');
var fs = require('fs');
var extend = require('extend');
var yamlParser = require('js-yaml');
var util = require('util');

var config = require('../config/config');
var helper = require('./linter-utils');
var parser = require('./parser');


function isDirValid(dir) {
    return path.normalize(dir)
        .indexOf('..') !== 0;
}

//TODO move to utils
function printObject(obj) {
    return JSON.stringify(obj, null, 2)
}

var paramValidators = {
    add: function (params) {
        if (params.indexOf('http') === 0) {
            // No need to normalize a url
            return true;
        }
        return isDirValid(params.split(' ')[0]);
    }
}

function finish(result) {
    return result;
}

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

function validateLine(command){

}

function Validator(rulefile) {
    if (!rulefile) {
        //TODO Fix me!

    };
    var ruleObject = getRules(rulefile);
    var validInstructionsRegex = helper.createValidCommandRegex(ruleObject.general
        .valid_instructions);
    var continuationRegex = eval(ruleObject.general.multiline_regex);
    var ignoreRegex = eval(ruleObject.general.ignore_regex);
    var requiredInstructions = helper.createReqInstructionHash(ruleObject);
    var requiredLabels = helper.createRequiredLabelsHash(ruleObject);
    helper.initLineRulesRegexes(ruleObject);

    function getProfile() {
        return ruleObject.profile;
    };

    function validate(dockerfile) {
        if (typeof dockerfile !== 'string') {
            //TODO clean this up
            return finish([{
                message: 'Invalid type'
            }]);
        }
        var options = {
            includeComments: false
        };
        var fromCheck = false;
        var currentLine = 0;
        //TODO to top level object
        var result = helper.newResult();
        var commands = parser.parse(dockerfile, options);
        if (commands.length < 1) {
            helper.addError(result, 0, null,
                "Invalid Dockerfile. No commands found!");
            return finish(result);
        };
        var linesArr = dockerfile.split(/\r?\n/);
        if (commands[0].name !== 'FROM') {
            helper.addError(result, commands[0].lineno, commands[0].raw,
                'Missing or misplaced FROM');
        }
        function validateLine(command) {
            //console.log(printObject(command.name));
            //method
            if (command.error){
               helper.addError(result, command.lineno, command.raw,command.error);
            }

            //method
            var instruction = validInstructionsRegex.exec(command.raw);
            if (!instruction) {
                helper.addError(result, command.lineno, command.raw,
                    'Invalid instruction');
                return false;
            }
            instruction = instruction[0].trim().toUpperCase();

            //method
            if (instruction in requiredInstructions) {
                 requiredInstructions[instruction].exists = true;
            }


            helper.checkLineRules(ruleObject, instruction, command.raw, command.lineno,
                  result);

            //method
            if (ruleObject.line_rules[instruction] && ruleObject.line_rules[
                    instruction].paramSyntaxRegex) {
                var validParams = ruleObject.line_rules[instruction].paramSyntaxRegex
                    .test(command.args);
                if (!validParams) {
                    helper.addError(result, command.lineno,  command.raw,
                        'Bad Parameters');
                    return false;
                }
            }
            // //For now add special handling for labels.
            // //TODO handle all name/value parameters generically
            if (instruction === "LABEL") {
                helper.validateLabels(instruction,command.args , ruleObject,
                    requiredLabels, result, command.lineno, command.raw)
            }
        }
        commands.forEach(validateLine);
        helper.checkRequiredInstructions(requiredInstructions, result);
        helper.checkRequiredLabels(requiredLabels, result);
        return finish(result);
    };

    return {
        getProfile: getProfile,
        validate: validate
    }
}

module.exports = Validator;
