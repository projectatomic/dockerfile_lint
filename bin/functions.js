/**
 * Created by lphiri on 3/29/16.
 */
'use strict';
var builder = require('junit-report-builder');
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

function getContent(url) {
    return new Promise(function (resolve, reject) {
        var lib = url.startsWith('https') ? require('https') : require('http');
        var request = lib.get(url, function (response) {
            if (isRedirect(response.statusCode) && response.headers.location) {
                getContent(res.headers.location).then(resolve).catch(reject);
            }
            if (response.statusCode < 200 || response.statusCode > 299) {
                reject(new Error('Failed to load page, status code: ' + response.statusCode));
            }
            var body = [];
            response.on('data', function (chunk) { body.push(chunk); });
            response.on('end', function () { resolve(body.join('')); });
        });
        request.on('error', reject);
    })
};

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

function makeJunitTestCase(suite, type, entry) {
    var lineContent = "";
    if (entry.lineContent) {
        var line = entry.line ? ("Line " + entry.line + ":") : "Line 0:";
        lineContent = line + " -> " + entry.lineContent + ". ";
    }
    var message = entry.message ? entry.message : " ";
    var ref_url = getRefUrl(entry.reference_url);
    var description = entry.description ? entry.description + " | " : "";
    description = lineContent + message + ". " + description + "Reference -> " + ref_url;

    suite.testCase()
        .className(type)
        .name(message)
        .failure(description);
}

function printJunitResults(results) {
    // Create a test suite
    var suite = builder.testSuite().name('dockerfile_lint');

    // Get test results
    var errors = results.error;
    var warn = results.warn;
    var info = results.info;

    // Convert test results to JUnit test cases
    if (errors && errors.data && errors.data.length > 0) {
        errors.data.forEach(function (entry) {
            makeJunitTestCase(suite, "ERROR", entry);
        });
    }
    if (warn && warn.data && warn.data.length > 0) {
        warn.data.forEach(function (entry) {
            makeJunitTestCase(suite, "INFO", entry);
        });
    }
    if (info && info.data && info.data.length > 0) {
        info.data.forEach(function (entry) {
            makeJunitTestCase(suite, "WARNING", entry);
        });
    }

    console.log(builder.build());
}

module.exports.printResults = printResults;
module.exports.printJsonResults = printJsonResults;
module.exports.printJunitResults = printJunitResults;
module.exports.getContent = getContent;
