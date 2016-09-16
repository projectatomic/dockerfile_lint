'use strict';

var yamlParser = require('js-yaml'),
    extend = require('./extendify')({arrays: 'concat'}),
    path = require('path'),
    fs = require('fs'),
    config = require('../config/config'),
    logger = require('./logger'),
    validateProfile = require('./rulefile-validator').validateRuleSyntax;

function convertRequiredInstructions(array) {
    var obj = {};
    array.forEach(function (o) {
        obj[o.instruction] = o;
    })
    return obj;
}

function alreadyIncluded(fileName, profileArray) {
    var i;
    for (i = 0; i < profileArray.length; i++) {
        if (profileArray[i].sourceFilename === fileName) {
            return true;
        }
    }
    return false;
}

function loadRuleFile(file, directory, includedRuleProfiles) {
    if (alreadyIncluded(file, includedRuleProfiles)) {
        throw new Error("Cyclic include found of file " + file);
    }
    var location = path.join(directory, file);
    var ruleContents = fs.readFileSync(location, 'UTF-8');
    var ruleProfile = yamlParser.safeLoad(ruleContents);
    //validateProfile(ruleProfile);
    logger.debug("loading rule profile " + file);
    ruleProfile.sourceFilename = file; //hack to check cyclic dependencies
    if (ruleProfile.required_instructions && ruleProfile.required_instructions.length > 0) {
        ruleProfile.required_instructions = convertRequiredInstructions(ruleProfile.required_instructions);
    }
    includedRuleProfiles.push(ruleProfile);
    if (ruleProfile.profile && ruleProfile.profile.includes) {
        logger.debug("rule file has " + ruleProfile.profile.includes.length + " includes");
        ruleProfile.profile.includes.forEach(function (profile) {
            loadRuleFile(profile, directory, includedRuleProfiles);
        });
    } else {
        logger.debug("rule file " + file + " has no includes");
    }
}


/**
 * Loads a profile rule file, resolving all its includes
 * All the included rule files are expected to be in the directory
 * as the rule file.
 * Cyclic includes (e.g. file A includes file B which includes file C which includes file A) are not supported.
 *
 * @param ruleFilePath
 * @returns a merged rule profile object of the profile and all its includes
 */
function load(ruleFilePath) {
    //First get the base rules
    var baseRuleLocation = fs.readFileSync(config.BASE_RULES, 'UTF-8');
    var rules = yamlParser.safeLoad(baseRuleLocation);
    if (!ruleFilePath) {
        ruleFilePath = config.DEFAULT_RULES;
    }
	var includedRuleProfiles = [];
        var ruleDirectory = path.dirname(ruleFilePath); //require all rules to be in same dir
        var ruleFileName = path.basename(ruleFilePath);
        logger.debug("Rule directory is " + ruleDirectory);
        loadRuleFile(ruleFileName, ruleDirectory, includedRuleProfiles);
	logger.debug("Number of rule files found for " + ruleFileName + " " + includedRuleProfiles.length);
        includedRuleProfiles.reverse();
        includedRuleProfiles.forEach(function (profile) {
            delete profile.sourceFilename; // no longer needed part of hack!
            extend(rules, profile);
        });
        logger.debug("Effective rule set is :\n" + yamlParser.dump(rules));
        return rules;
}

module.exports.load = load
