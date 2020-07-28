'use strict';
process.env.NODE_ENV = 'test';

var should = require('should');

var exec = require('child_process').exec,
    path = require('path')
var binScript = path.join('bin', 'dockerfile_lint')
var parser = require('fast-xml-parser');

describe('The dockerfile_lint command', function () {

    it('should allow a valid Dockerfile', function (done) {

        exec('node ' + binScript + ' -f ./test/data/dockerfiles/TestLabels',
            function (err, stdout, stderr) {
                if (err) {
                    return done(err);
                }
                stdout.trim().should.eql('# Analyzing ./test/data/dockerfiles/TestLabels\n\nCheck passed!');
                stderr.should.eql('');
                done();
            });
    });

    it('should validate remote (https) Dockerfile', function (done) {

        exec('node ' + binScript + ' -r config/base_rules.yaml -f https://raw.githubusercontent.com/projectatomic/dockerfile_lint/master/test/data/dockerfiles/TestLabels',
            function (err, stdout, stderr) {
                if (err) {
                    return done(err);
                }
                stdout.trim().should.eql('# Analyzing https://raw.githubusercontent.com/projectatomic/dockerfile_lint/master/test/data/dockerfiles/TestLabels\n\nCheck passed!');
                stderr.should.eql('');
                done();
            });
    });



    it('should exit with a non-zero error code on an empty file', function (done) {
        var p = exec('node ' + binScript + ' -f test/data/dockerfiles/EmptyFile -r test/data/rules/basic.yaml',
            function (err, stdout, stderr) {
            });
        p.on('exit', function (code) {
            code.should.equal(5); // 4 errors + 1 warning
            done();
        });

    });

    it('should exit with code 0 on warning when in strict mode ', function (done) {
        var p = exec('node ' + binScript + ' -p -f test/data/dockerfiles/TestLabels -r test/data/rules/basic.yaml',
            function (err, stdout, stderr) {
            });
        p.on('exit', function (code) {
            code.should.equal(0);
            done();
        });

    });

    it('should exit with code 0 on warning when in permissive mode (long form)', function (done) {
        var p = exec('node ' + binScript + ' --permissive -f test/data/dockerfiles/TestLabels -r test/data/rules/basic.yaml',
            function (err, stdout, stderr) {
            });
        p.on('exit', function (code) {
            code.should.equal(0);
            done();
        });

    });

    it('should exit with code 1 on warning when not in permissive mode ', function (done) {
        var p = exec('node ' + binScript + ' -f test/data/dockerfiles/TestLabels -r test/data/rules/basic.yaml',
            function (err, stdout, stderr) {
            });
        p.on('exit', function (code) {
            code.should.eql(1);
            done();
        });
    });


    it('should output valid JSON when in --json mode with multiple Dockerfiles', function (done) {
        var p = exec('node ' + binScript + ' --json -f test/data/dockerfiles/TestLabels -f test/data/dockerfiles/TestLabels -p -r test/data/rules/basic.yaml',
            function (err, stdout, stderr) {
                should(JSON.parse(stdout)).be.ok.and.have.lengthOf(2);
            });
        p.on('exit', function (code) {
            code.should.eql(0);
            done();
        });
    });

    it('should exit with code 1 and error message when using both --json and --junit options ', function (done) {
        var p = exec('node ' + binScript + ' --junit --json -f test/data/dockerfiles/TestLabels',
            function (err, stdout, stderr) {
                should(stderr).be.equal("ERROR: result format options (\"--json and --junit\") cannot be used together, please choose one only\n")
            });
        p.on('exit', function (code) {
            code.should.eql(1);
            done();
        });
    });

    it('should output valid XML when in --junit mode', function (done) {
        var p = exec('node ' + binScript + ' --junit -f test/data/dockerfiles/TestLabels -p -r test/data/rules/basic.yaml',
            function (err, stdout, stderr) {
                should(parser.validate(stdout)).be.ok;
            });
        p.on('exit', function (code) {
            code.should.eql(0);
            done();
        });
    });


});
