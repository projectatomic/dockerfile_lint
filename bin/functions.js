/**
 * Created by lphiri on 3/29/16.
 */
'use strict';
var util = require('util');

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

function isRedirect(statusCode) {
    return (statusCode === 300 || statusCode === 301 || statusCode === 302);
}

function downloadDockerfile(url, cb) {
    var proto, dockerfile = '';
    if (url.match('^https://')) {
        proto = require('https');
    } else {
        proto = require('http');
    }
    proto.get(url, function (res) {
        res.on('data', function (data) {
            dockerfile += data;
        }).on('end', function () {
            if (isRedirect(res.statusCode) && res.headers.location) {
                return downloadDockerfile(res.headers.location, cb);
            }
            cb(dockerfile);
        });
    });
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

module.exports.printResults = printResults;
module.exports.printJsonResults = printJsonResults;
module.exports.downloadDockerfile = downloadDockerfile;
