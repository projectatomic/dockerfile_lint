'use strict';


var path = require('path');
var fs = require('fs');
var extend = require('extend');
var yamlParser = require('js-yaml');
var util = require('util');

var config = require('../config/config');
var helper = require('./linter-utils');


function isDirValid(dir) {
  return path.normalize(dir).indexOf('..') !== 0;
}

//TODO move to utils
function printObject(obj){
  return JSON.stringify(obj,null,2)
}

var paramValidators = {
  add: function(params) {
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
      ////console.log(doc);
      ////console.log(JSON.stringify(combinedRules,null,2));
      return combinedRules;
    } catch (e) {
      //console.log(e);
      return null;
    }
  }
}

function Validator(rulefile) {
  if (!rulefile) {
    //TODO Fix me!

  };
  var ruleObject = getRules(rulefile);
  var validInstructionsRegex = helper.createValidCommandRegex(ruleObject.general.valid_instructions);
  var continuationRegex = eval(ruleObject.general.multiline_regex);
  var ignoreRegex = eval(ruleObject.general.ignore_regex);
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
    dockerfile = dockerfile.trim();

    var requiredInstructions = helper.createReqInstructionHash(ruleObject);
    ////console.log("Creating required labels hash1");
    var requiredLabels = helper.createRequiredLabelsHash(ruleObject);
    ////console.log("Creating required labels hash2");
    var fromCheck = false;
    var currentLine = 0;
    //TODO to top level object
    var result = {
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
    var linesArr = dockerfile.split(/\r?\n/);


    function isPartialLine(line) {
      return (continuationRegex.test(line));
    };

    function validateLine(line) {
      currentLine++;
      var lineOffSet = 0;
      if (!line || line[0] === '#') {
        return;
      }
      while (isPartialLine(line)) {
        line = line.replace(continuationRegex, " ");
        // we can comment inside commands
        if (linesArr[currentLine + lineOffSet][0] === '#') {
          linesArr[currentLine + lineOffSet] = undefined;
          // very hacky and bad
          line = line + "\\";
        } else {
          line = line + linesArr[currentLine + lineOffSet];
          linesArr[currentLine + lineOffSet] = undefined;
        }
        lineOffSet++;
      }
      // First instruction must be FROM
      if (!fromCheck) {
        fromCheck = true;
        if (line.toUpperCase().indexOf('FROM') !== 0) {
          helper.addError(result, currentLine, linesArr, 'Missing or misplaced FROM');
        }
      }
      var instruction = validInstructionsRegex.exec(line);
      if (!instruction) {
        helper.addError(result, currentLine, linesArr, 'Invalid instruction');
        return false;
      }
      instruction = instruction[0].trim().toUpperCase();
      if (instruction in requiredInstructions) {
        requiredInstructions[instruction].exists = true;
      }
      helper.checkLineRules(ruleObject, instruction, line, currentLine, result);
      var params = line.replace(validInstructionsRegex, '');
      if (ruleObject.line_rules[instruction] && ruleObject.line_rules[instruction].paramSyntaxRegex) {
        var validParams = ruleObject.line_rules[instruction].paramSyntaxRegex.test(params);
        if (!validParams) {
          helper.addError(result, currentLine, linesArr, 'Bad Parameters');
          return false;
        }
      }
      //For now add special handling for labels.
      //TODO handle all name/value parameters generically
      if (instruction === "LABEL") {
         helper.validateLabels(instruction,params,ruleObject,requiredLabels, result, currentLine, linesArr)
      }
    }
    linesArr.forEach(validateLine);
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
