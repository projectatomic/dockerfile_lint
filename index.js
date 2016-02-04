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

//TODO TestMe
function parseLabels(labels) {
  var re = /(\S+)=((?:\S|[ ](?!\S+=))+)/mg
  if (!labels || (typeof labels !== 'string')) {
    return null;
  }
  labels = labels.replace(/"/g, '');
  labels = labels.replace(/'/g, '');
  var x = labels.match(re);
  ////console.log("labels are " +x)
  var obj = {};
  for (var i = 0; i < x.length; i++) {
    var split = x[i].split('=');
    ////console.log("label key is " + split[0] )
    obj[split[0].trim()] = split[1].trim();
  }
  //console.log("Parsed labels are " + printObject(obj))
  return obj;
}

//TODO TestMe
function createReqInstructionHash(ruleObj) {
  var hash = {};
  var arr = ruleObj.required_instructions;
  for (var i = 0, len = arr.length; i < len; i++) {
    hash[arr[i].instruction] = arr[i];
    arr[i].exists = false;
  }
  return hash;
}

//TODO TestMe
function createRequiredLabelsHash(ruleObj) {
  var hash = {};
  ////console.log('Creating required labels hash')
  var label_rules = ruleObj.line_rules["LABEL"] || ruleObj.line_rules["Label"]
  if (label_rules && label_rules.defined_label_rules) {
    var arr = label_rules.defined_label_rules;
    ////console.log('looking for required labels')
    for (var i = 0, len = arr.length; i < len; i++) {
      ////console.log('Checking required label ' + JSON.stringify(Object.keys(arr[i])[0], null, 4));
      if (arr[i][Object.keys(arr[i])[0]].required) { //TODO we assume a single property - need to validate rule file
        ////console.log('Found required label ' + printObject(arr[i]))
        hash[Object.keys(arr[i])[0]] = arr[i];
        arr[i].exists = false;
        ////console.log('Found required label ' + printObject(arr[i]))
      }
    }
  }
  return hash;
}

//TODO TestMe
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

//TODO TestMe
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

function checkRequiredLabels(requiredLabels, result) {
  for (var requiredLabel in requiredLabels) {
    if (requiredLabels.hasOwnProperty(requiredLabel)) {
      ////console.log("Required label "+ requiredLabels[requiredLabel])
      if (!requiredLabels[requiredLabel].exists) {
        addError(result, -1, null,"Required label '" + requiredLabel + "' missing")
      }
    }
  }
}

//TODO TestMe
function checkLineRules(ruleObject, instruction, line, lineNumber, result) {
  if (!ruleObject.line_rules[instruction]) {
    //console.log("No Line Rules for instruction :" + instruction);
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
    //console.log("Invalid Paremeter for command regex");
    return null;
  }
}


//TODO make generic
function findLabelRule(key, rules) {
  if (!rules) {
    return null;
  }
  for (var i = 0; i < rules.length; i++) {
    var keys = Object.keys(rules);
    ////console.log("keys to match")
    //console.log("Looking for match of " + key)
    for (var j = 0; j < keys.length; j++) {
      if (rules[i].hasOwnProperty(key)) {
        //console.log("Found match :" +   printObject(rules[i]))
        return rules[i];
      }
    }
  }
  return null;
}

function addResult(result, lineNumber, linesArr, msg, level) {
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
  //console.log("Pushing result to "+ printObject(target));
  target.data.push({
    message: msg,
    line: lineNumber,
    level: level,
    lineContent: linesArr ? linesArr[lineNumber - 1] : ''
  });
  target.count++;
}


function addError(result, lineNumber, linesArr, msg) {
   addResult(result, lineNumber, linesArr, msg, 'error');
}

function validateDefaultLabelRule(result, currentLine, linesArr, key, value, rule) {
  var level = rule.level ? rule.level : 'error'
  var valid = true;
  var label = key + "=" + value
  if (rule.keyRegex && !eval(rule.keyRegex).exec(key)) {
    addResult(result,
      currentLine,
      linesArr,
      rule.key_error_message ? rules.key_error_message+ " ->'" + label + "'"  : 'Key for label ' + label + ' is not in required format',
      level);
    valid = false;
  }
  if (rule.valueRegex && !eval(rule.valueRegex).exec(value)) {
    addResult(result,
      currentLine,
      linesArr,
      rule.value_error_message ?  rule.value_error_message + " ->'" + label + "'" : 'Value for label ' + label + ' is not in required format',
      level);
    valid = false;
  }
  //console.log("validation default rule for " + label + " valid ->" + valid );
  return valid;
}

//TODO test me
function validateLabels(instruction,params,ruleObject,requiredLabels,result, currentLine, linesArr ) {
  var labels = parseLabels(params);
  if (!labels) {
    addError(result, currentLine, linesArr, 'Invalid label syntax parameters');
    return false;
  }
  var labelKeys = Object.keys(labels);
  var defined_label_rules = ruleObject.line_rules[instruction].defined_label_rules ? ruleObject.line_rules[instruction].defined_label_rules : null
  var default_rules = ruleObject.line_rules[instruction].default_label_rules ? ruleObject.line_rules[instruction].default_label_rules: null
  if (defined_label_rules.length > 0) {
    //console.log("len of defined label rules "+ defined_label_rules.length)
    for (var i = 0; i < labelKeys.length; i++) {
      //console.log("looking to find match for "+ labelKeys[i])
      var labelRuleMatch = findLabelRule(labelKeys[i],defined_label_rules);
      if (labelRuleMatch) {
        var label_rule = labelRuleMatch[labelKeys[i]]
        if (label_rule.required) {
          requiredLabels[labelKeys[i]].exists = true;
        }
        if (label_rule.valueRegex && !eval(label_rule.valueRegex).exec(labels[labelKeys[i]])) {
          var level = label_rule.level ? label_rule.level : 'error';
          var label = labelKeys[i]+ "=" + labels[labelKeys[i]];
          addResult(result,
             currentLine,
             linesArr,
             label_rule.message ? label_rule.message+ " ->'" + label + "'"  : 'Value for label ' + label + ' is not in required format',
             level);
        }
      }else if (default_rules) {
        validateDefaultLabelRule(result, currentLine, linesArr, labelKeys[i], labels[labelKeys[i]], default_rules);
      }
    }
  }else if (default_rules) {
    validateDefaultLabelRule(result, currentLine, linesArr, labelKeys[i], labels[labelKeys[i]], default_rules);
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
    ////console.log("Creating required labels hash1");
    var requiredLabels = createRequiredLabelsHash(ruleObject);
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
          addError(result, currentLine, linesArr, 'Missing or misplaced FROM');
        }
      }
      var instruction = validInstructionsRegex.exec(line);
      if (!instruction) {
        addError(result, currentLine, linesArr, 'Invalid instruction');
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
        if (!validParams) {
          addError(result, currentLine, linesArr, 'Bad Parameters');
          return false;
        }
      }
      //For now add special handling for labels.
      //TODO handle all name/value parameters generically
      if (instruction === "LABEL") {
         validateLabels(instruction,params,ruleObject,requiredLabels, result, currentLine, linesArr)
      }
    }
    linesArr.forEach(validateLine);
    checkRequiredInstructions(requiredInstructions, result);
    checkRequiredLabels(requiredLabels, result);
    return finish(result);
  };

  return {
    getProfile: getProfile,
    validate: validate
  }

}

module.exports = Validator;
