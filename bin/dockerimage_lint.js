#!/usr/bin/env node
'use strict';

var fs = require('fs'),

    path = require('path'),
    cmdLine = require('commander'),
    logger = require("../lib/logger"),
    config = require('../config/config'),
    DockerIO = require('dockerode'),
    Linter = require('../lib/image-linter'),
    rulefileLocation = null,
    imageid = null,
    rulefile = null,
    printResults = require('./functions').printResults,
    printJsonResults = require('./functions').printJsonResults;

cmdLine.option('-j, --json', 'Show results in JSON format')
    .option('-r, --rulefile [rulefile] (optional)', 'Rule file', rulefile)
    .option('-i, --imageid [image id] (required)', 'Image to lint. Accepts an image id', imageid)
    .option('-v, --verbose', 'Show debugging logs')
    .parse(process.argv);

if (cmdLine.verbose) {
    if (logger.transports.console) logger.transports.console.level = 'debug';
    if (logger.transports.file) logger.transports.file.level = 'debug';
}

if (!cmdLine.imageid) {
    cmdLine.help();
}

if (cmdLine.rulefile) {
    rulefileLocation = cmdLine.rulefile;
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
    if (cmdLine.json) {
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
logger.debug("Image id is " + cmdLine.imageid);
var image = docker.getImage(cmdLine.imageid);
image.inspect(function (err, data) {
    if (err) {
        logger.error("Unable to inspect image : " + cmdLine.imageid);
        process.exit(1);
    } else {
        runValidation(JSON.stringify(data), rulefileLocation);
    }
});

