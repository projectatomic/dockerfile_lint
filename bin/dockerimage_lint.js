#!/usr/bin/env node
'use strict';



var fs = require('fs'),
    util = require('util'),
    path = require('path'),
    commandline = require('commander'),
    logger = require("../lib/logger"),
    config = require('../config/config'),
    DockerIO = require('dockerode'),
    Linter = require('../lib/image-linter');



function printEntry(entry, level) {
    var ref_url = getRefUrl(entry.reference_url);
    var line = entry.line ? ("Line " + entry.line + ":") : "Line 0:";
    if (entry.lineContent) {
        console.log(line + " -> " + entry.lineContent);
    }
    var message = entry.message ? entry.message : " ";
    var description = entry.description ? (". " + entry.description + ". ") : ". ";
    console.log(level + ": " + message + description +
        "\nReference -> " + ref_url);
    console.log("\n");

}


function getRefUrl(url) {
    var ref_url = "";
    if (util.isArray(url)) {
        var base_url = url ? url[0] : "";
        ref_url = url && url[1] ? base_url +
        url[1] : base_url;
    } else {
        ref_url = (url) ? url : "None";
    }
    return ref_url;

}

function printResults(results) {
    var errors = results.error;
    var warn = results.warn;
    var info = results.info;
    if (errors && errors.data && errors.data.length > 0) {
        console.log("\n--------ERRORS---------\n");
        errors.data.forEach(function (entry) {
            printEntry(entry, "ERROR");
        });
    }
    if (warn && warn.data && warn.data.length > 0) {
        console.log("\n-------WARNINGS--------\n");
        warn.data.forEach(function (entry) {
            printEntry(entry, "WARNING");
        });
    }
    if (info && info.data && info.data.length > 0) {
        console.log("\n--------INFO---------\n");
        info.data.forEach(function (entry) {
            printEntry(entry, "INFO");
        });
    }

    if ((errors.count + warn.count + info.count) === 0) {
        console.log("Check passed!");
    }

}

function printJsonResults(results) {
    var json = JSON.stringify(results, undefined, 2);
    console.log(json);
}


var rulefileLocation = null;
var imageid = null;
var rulefile = null;
var printJson = false;


commandline.option('-j, --json', 'Show results in JSON format')
    .option('-r, --rulefile [rulefile] (optional)', 'Rule file', rulefile)
    .option('-i, --imageid [image id] (required)', 'Image to lint. Accepts an image id', imageid)
    .option('-v, --verbose', 'Show debugging logs')
    .parse(process.argv);

if (commandline.verbose) {
    if (logger.transports.console) logger.transports.console.level = 'debug';
    if (logger.transports.file) logger.transports.file.level = 'debug';
}

if (commandline.json) {
    printJson = true;
}

if (!commandline.imageid) {
    commandline.help();
}else {
    imageid = commandline.imageid;
}

if (commandline.rulefile) {
    rulefileLocation = commandline.rulefile;
}

if (rulefileLocation !== null) {
    if (!fs.existsSync(rulefileLocation)) {
        console.error('ERROR: Rule file not found -> ' + rulefileLocation);
        process.exit(1);
    }
}

function runValidation(inspectOutPut, rulefileLocation) {
    var linter = new Linter(rulefileLocation);
    var results = linter.validate(inspectOutPut);
    if (printJson) {
        printJsonResults(results);
    } else {
        printResults(results);
    }
    if (results.error.count > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

var docker = new DockerIO();
logger.debug("Image id is " + imageid);
var image = docker.getImage(imageid);
image.inspect(function (err, data) {
    if (err) {
        logger.error("Unable to inspect image : " + imageid);
        process.exit(1);
    } else {
        runValidation(JSON.stringify(data), rulefileLocation);
    }
});

