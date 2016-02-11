var yamlParser = require('js-yaml');
var extend = require('extend');
var path = require('path');
var fs = require('fs');
var config = require('../config/config');


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
        throw "Cyclic include found of file " + file;
    }
    var location = path.join(directory, file);
    var ruleContents = fs.readFileSync(location, 'UTF-8');
    var ruleProfile = yamlParser.safeLoad(ruleContents);
    //validateProfile(rules); TODO
    console.log("loading rule profile " + file);
    ruleProfile.sourceFilename = file; //hack to check cyclic dependencies
    includedRuleProfiles.push(ruleProfile);
    if (ruleProfile.profile && ruleProfile.profile.includes) {
        console.log("rule file has " + ruleProfile.profile.includes.length + " includes");
        ruleProfile.profile.includes.forEach(function (profile) {
            loadRuleFile(profile, directory, includedRuleProfiles);
        });
    } else {
        console.log("rule file " + file + " has no includes.: ");
    }
}


/**
 * Loads a profile rule file, resolving all its includes
 * and returns a combined rule profile object
 * All the included rule files are expected to be in the directory
 * as the rule file.
 * Cyclic includes (e.g. file A includes file B which includes file C which includes file A) are not supported.
 *
 * @param ruleFilePath
 * @returns a rule file object
 */
function load(ruleFilePath) {
    //First get the base rules
    var baseRuleLocation = fs.readFileSync(config.BASE_RULES, 'UTF-8');
    var baseRules = yamlParser.safeLoad(baseRuleLocation);

    if (!ruleFilePath) {
        return baseRules;
    } else {
        var includedRuleProfiles = [];
        var combinedRules = baseRules;
        var ruleDirectory = path.dirname(ruleFilePath); //require all rules to be in same dir
        var ruleFileName = path.basename(ruleFilePath);
        //console.log("Rule directory is " + ruleDirectory);
        loadRuleFile(ruleFileName, ruleDirectory, includedRuleProfiles);
        //console.log("Number of rule files found " + includes.length);
        includedRuleProfiles.reverse();
        includedRuleProfiles.forEach(function (profile) {
            delete profile.sourceFilename; // no longer needed part of hack!
            combinedRules = extend(true, combinedRules, profile);
        })
        return combinedRules;
    }
}

module.exports = load