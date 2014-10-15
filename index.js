'use strict';

var path = require('path');

var yamlParser = require('js-yaml');



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
    var doc = yamlParser.safeLoad(rulefile);
    //console.log(doc);
    return doc;
  } catch (e) {
    console.log(e);
    return null;
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
  if (!lineRules){
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
  var rules = ruleObject.line_rules[instruction].rules;
  for (var index in rules) {
    if (rules.hasOwnProperty(index)) {
      var rule = rules[index];
      if (rule.regex && rule.regex.test(line)) {
        result[rule.level].count++;
        var ruleCopy = JSON.parse(JSON.stringify(rule));
        ruleCopy.line = lineNumber;
        result[rule.level].data.push(ruleCopy);
      }
    }
  }
}



function validator(rulefile) {
  /**
   * Static rules /Regex can be reused
   */
  var ruleObject = getRules(rulefile);
  var validInstructionsRegex = eval(ruleObject.general.valid_instruction_regex);
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
    var hasCmd = false;
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
        level: 'error'
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
        line = line + linesArr[currentLine + lineOffSet];
        linesArr[currentLine + lineOffSet] = undefined;
        lineOffSet++;
      }
      // First instruction must be FROM
      if (!fromCheck) {
        fromCheck = true;
        if (line.toUpperCase().indexOf('FROM') !== 0) {
          addError(currentLine,'Missing or misplaced FROM' );
        }
      }
      var instruction = validInstructionsRegex.exec(line);
      if (!instruction) {
        addError(currentLine,'Invalid instruction');
        return false;
      }
      instruction = instruction[0].trim().toUpperCase();
      if (instruction in requiredInstructions) {
        requiredInstructions[instruction].exists = true;
      }
      checkLineRules(ruleObject, instruction, line, currentLine, result);
      var params = line.replace(validInstructionsRegex, '');
      var validParams = ruleObject.line_rules[instruction].paramSyntaxRegex.test(params);
      //&& (paramValidators[instruction] ? paramValidators[instruction](params) : true);
      if (!validParams) {
        addError(currentLine,'Bad Parameters');
        return false;
      }
      return true;
    }
    linesArr.forEach(validateLine);
    checkRequiredInstructions(requiredInstructions, result);
    return finish(result);
  };

  return {
     getProfile:  getProfile,
     validate : validate
  }

}

module.exports = validator;