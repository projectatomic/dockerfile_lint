'use strict';
process.env.NODE_ENV = 'test';

var should = require('should');

var EOL = require('os').EOL,
    exec = require('child_process').exec,
    spawn = require('child_process').spawn;

it('should allow a valid Dockerfile', function (done) {

    exec('./bin/dockerfile_lint -f ./test/data/dockerfiles/TestLabels',
        function (err, stdout, stderr) {
            if (err) {
                return done(err);
            }
            ;
            stdout.should.eql('Check passed!' + EOL);
            stderr.should.eql('');
            done();
        });
});

it('should exit with code 1 on warning when in strict mode ', function (done) {
    var p = exec('./bin/dockerfile_lint  -s -f test/data/dockerfiles/TestLabels -r sample_rules/basic_rules.yaml',
        function (err, stdout, stderr) {
        });
    p.on('exit', function (code) {
        code.should.equal(1);
        done();
    });

});

it('should exit with code 1 on warning when in strict mode (long form)', function (done) {
    var p = exec('./bin/dockerfile_lint  --strict -f test/data/dockerfiles/TestLabels -r sample_rules/basic_rules.yaml',
        function (err, stdout, stderr) {
        });
    p.on('exit', function (code) {
        code.should.equal(1);
        done();
    });

});


it('should exit with code 0 on warning when not strict mode ', function (done) {
    var p = exec('./bin/dockerfile_lint -f test/data/dockerfiles/TestLabels -r sample_rules/basic_rules.yaml',
        function (err, stdout, stderr) {
        });
    p.on('exit', function (code) {
        code.should.eql(0);
        done();
    });
});





