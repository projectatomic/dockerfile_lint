'use strict';

var util = require('util');

//TODO move to utils
function printObject(obj) {
    return JSON.stringify(obj, null, 2)
}

function stripQuotes(value){
  value = value.replace (/(^")|("$)/g, '');
  value = value.replace (/(^')|('$)/g, '');
  return value;
}



// function parseLabels(labels) {
//   var re = /(\S+)=((?:\S|[ ](?!\S+=))+)/mg
//   if (!labels || (typeof labels !== 'string')) {
//     return null;
//   }
//   labels = labels.replace(/"/g, '');
//   labels = labels.replace(/'/g, '');
//   var x = labels.match(re);
//   var obj = {};
//   for (var i = 0; i < x.length; i++) {
//     var split = x[i].split('=');
//     obj[split[0].trim()] = split[1].trim();
//   }
//   return obj;
//
// }
//module.exports.parseLabels = parseLabels;

//TODO TestMe
module.exports.createReqInstructionHash = function(ruleObj) {
  var hash = {};
  var arr = ruleObj.required_instructions;
  for (var i = 0, len = arr.length; i < len; i++) {
    hash[arr[i].instruction] = arr[i];
    arr[i].exists = false;
  }
  return hash;
}

//TODO TestMe
module.exports.createRequiredLabelsHash = function(ruleObj) {
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
module.exports.initLineRulesRegexes = function(ruleObj) {

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
module.exports.checkRequiredInstructions = function(instructions, result) {
  for (var instruction in instructions) {
    if (instructions.hasOwnProperty(instruction)) {
      if (!instructions[instruction].exists) {
        result[instructions[instruction].level].count++;
        result[instructions[instruction].level].data.push(instructions[instruction]);
      }
    }
  }
}

module.exports.checkRequiredLabels = function(requiredLabels, result) {
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
module.exports.checkLineRules = function(ruleObject, instruction, line, lineNumber, result) {
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

module.exports.createValidCommandRegex = function(commandList) {
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


function findLabelRule(key, rules) {
  if (!rules || !key) {
    return null;
  }
  if (typeof key !== 'string'){
    console.log("Invalid label key: " + key);
    return null;
  }
  //console.log("key ")
  for (var i = 0; i < rules.length; i++) {
    var keys = Object.keys(rules);
    //console.log("Looking in "+  printObject(rules[i]));
    //console.log("Looking for match of " + key)
    for (var j = 0; j < keys.length; j++) {
      if (rules[i].hasOwnProperty(stripQuotes(key))) {
        //console.log("Found match :" +   printObject(rules[i]))
        return rules[i];
      }
    }
  }
  return null;
}
module.exports.findLabelRule = findLabelRule;


function newResult(){
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
  //console.log("Pushing result to "+ printObject(target));
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


function validateDefaultLabelRule(result, currentLine, linesArr, key, value, rule) {
  var level = rule.level ? rule.level : 'error'
  var valid = true;
  var label = key + "=" + value
  key = stripQuotes(key);
  value = stripQuotes(value);
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
module.exports.validateDefaultLabelRule = validateDefaultLabelRule;



module.exports.validateLabels = function(instruction,labels,ruleObject,requiredLabels,result, currentLine, linesArr ) {
  //console.log("validating labels");
  if (!labels) {
    addError(result, currentLine, linesArr, 'Invalid label syntax parameters');
    return false;
  }
  var labelKeys = Object.keys(labels);
  var defined_label_rules = ruleObject.line_rules[instruction].defined_label_rules ? ruleObject.line_rules[instruction].defined_label_rules : null
  var default_rules = ruleObject.line_rules[instruction].default_label_rules ? ruleObject.line_rules[instruction].default_label_rules: null
  if (defined_label_rules && defined_label_rules.length > 0) {
    //console.log("len of defined label rules "+ defined_label_rules.length)
    for (var i = 0; i < labelKeys.length; i++) {
      var labelName = stripQuotes(labelKeys[i]);
      //console.log("looking to find match for "+ labelName)
      var labelRuleMatch = findLabelRule(labelName,defined_label_rules);
      //console.log("Found "+ labelRuleMatch);
      if (labelRuleMatch) {
        var label_rule = labelRuleMatch[labelName];
        //console.log("Matched label rule is "+ printObject(label_rule));
        if (label_rule.required) {
          requiredLabels[labelName].exists = true;
        }
        if (label_rule.valueRegex && !eval(label_rule.valueRegex).exec(stripQuotes(labels[labelName]))) {
          var level = label_rule.level ? label_rule.level : 'error';
          var label = labelKeys[i]+ "=" + labels[labelName];
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
