'use strict';

var path = require('path');
var fs = require('fs');

var yamlParser = require('js-yaml');

var util = require('util');

var config = require('./config/config');

var extend = require('extend');



function isDirValid(dir) {
  return path.normalize(dir).indexOf('..') !== 0;
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

function getRules(rulefile) {
  //TODO throw exceptions if invalid file!
  try {
    //First get the base rules
    var baseRuleLocation = fs.readFileSync(config.BASE_RULES, 'UTF-8');
    var baseRules = yamlParser.safeLoad(baseRuleLocation);
    //console.log(JSON.stringify(baseRules,null,2));
  } catch (e) {
    console.log("Error reading base rules " + e);
    return null;
  }
  if (!rulefile) {
    return baseRules;
  } else {
    try {
      var rules = yamlParser.safeLoad(rulefile);
      var combinedRules = extend(true, baseRules, rules);
      //console.log(doc);
      //console.log(JSON.stringify(combinedRules,null,2));
      return combinedRules;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}

function createReqInstructionHash(ruleObj) {
  var hash = {};
  var arr = ruleObj.required_instructions;
  for (var i = 0, len = arr.length; i < len; i++) {
    hash[arr[i].instruction] = arr[i];
    arr[i].exists = false;
  }
  return hash;
}

function initLineRulesRegexes(ruleObj) {

  var lineRules = ruleObj.line_rules;
  if (!lineRules) {
    return;
  }
  for (var rule in lineRules) {
    if (lineRules.hasOwnProperty(rule)) {
      lineRules[rule].paramSyntaxRegex = eval(lineRules[rule].paramSyntaxRegex);
      for (var semanticRule in lineRules[rule].rules) {
        lineRules[rule].rules[semanticRule].regex = eval(lineRules[rule].rules[semanticRule].regex);
      }
    }
  }
}

function checkRequiredInstructions(instructions, result) {
  for (var instruction in instructions) {
    if (instructions.hasOwnProperty(instruction)) {
      if (!instructions[instruction].exists) {
        result[instructions[instruction].level].count++;
        result[instructions[instruction].level].data.push(instructions[instruction]);
      }
    }
  }
}

function checkLineRules(ruleObject, instruction, line, lineNumber, result) {
  if (!ruleObject.line_rules[instruction]) {
    console.log("No Line Rules for instruction :" + instruction);
    return;
  }
  var rules = ruleObject.line_rules[instruction].rules;
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
}

function createValidCommandRegex(commandList) {
  if (util.isArray(commandList)) {
    var regexStr = '\^\(';
    var commands = commandList.join('\|');
    regexStr = regexStr + commands;
    regexStr = regexStr + '\)\(\\\s\)\+';
    return new RegExp(regexStr, 'i');
  } else {
    console.log("Invalid Paremeter for command regex");
    return null;
  }
}


/**
 *  Constructor Function for the validator.
 */
function Validator(rulefile) {
  if (!rulefile) {
    //TODO Fix me!

  };
  var ruleObject = getRules(rulefile);
  //var validInstructionsRegex = eval(ruleObject.general.valid_instruction_regex);
  var validInstructionsRegex = createValidCommandRegex(ruleObject.general.valid_instructions);
  var continuationRegex = eval(ruleObject.general.multiline_regex);
  var ignoreRegex = eval(ruleObject.general.ignore_regex);
  initLineRulesRegexes(ruleObject);

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

    var requiredInstructions = createReqInstructionHash(ruleObject);

    var fromCheck = false;
    var currentLine = 0;
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
    
    function addError(lineNumber, msg) {
      result.error.data.push({
        message: msg,
        line: lineNumber,
        level: 'error',
        lineContent : linesArr[lineNumber-1]
      });
      result.error.count++;
    };

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
        if (linesArr[currentLine + lineOffSet][0] === '#'){
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
          addError(currentLine, 'Missing or misplaced FROM');
        }
      }
      var instruction = validInstructionsRegex.exec(line);
      if (!instruction) {
        addError(currentLine, 'Invalid instruction');
        return false;
      }
      instruction = instruction[0].trim().toUpperCase();
      if (instruction in requiredInstructions) {
        requiredInstructions[instruction].exists = true;
      }
      checkLineRules(ruleObject, instruction, line, currentLine, result);
      var params = line.replace(validInstructionsRegex, '');
      if (ruleObject.line_rules[instruction] && ruleObject.line_rules[instruction].paramSyntaxRegex) {
        var validParams = ruleObject.line_rules[instruction].paramSyntaxRegex.test(params);
        //&& (paramValidators[instruction] ? paramValidators[instruction](params) : true);
        if (!validParams) {
          addError(currentLine, 'Bad Parameters');
          return false;
        }
      }
      return true;
    }
    linesArr.forEach(validateLine);
    checkRequiredInstructions(requiredInstructions, result);
    return finish(result);
  };

  return {
    getProfile: getProfile,
    validate: validate
  }

}

module.exports = Validator;