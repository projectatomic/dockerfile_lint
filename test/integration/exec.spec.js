'use strict';
process.env.NODE_ENV = 'test';

require('should');

var EOL = require('os').EOL,
    exec = require('child_process').exec

it('should allow a valid Dockerfile', function (done) {

    exec('./bin/dockerfile_lint -f ./test/data/dockerfiles/TestLabels',
        function (err, stdout, stderr) {
            if (err) {
                return done(err);
            }
            stdout.should.eql('Check passed!' + EOL);
            stderr.should.eql('');
            done();
        });
});

it('should validate remote (https) Dockerfile', function (done) {

    exec('./bin/dockerfile_lint -f -r config/base_rules.yaml https://raw.githubusercontent.com/projectatomic/dockerfile_lint/master/test/data/dockerfiles/TestLabels',
        function (err, stdout, stderr) {
            if (err) {
                return done(err);
            }
            stdout.should.eql('Check passed!' + EOL);
            stderr.should.eql('');
            done();
        });
});


it('should exit with code 0 on warning when in strict mode ', function (done) {
    var p = exec('./bin/dockerfile_lint  -p -f test/data/dockerfiles/TestLabels -r test/data/rules/basic.yaml',
        function (err, stdout, stderr) {
        });
    p.on('exit', function (code) {
        code.should.equal(0);
        done();
    });

});

it('should exit with code 0 on warning when in permissive mode (long form)', function (done) {
    var p = exec('./bin/dockerfile_lint  --permissive -f test/data/dockerfiles/TestLabels -r test/data/rules/basic.yaml',
        function (err, stdout, stderr) {
        });
    p.on('exit', function (code) {
        code.should.equal(0);
        done();
    });

});


it('should exit with code 1 on warning when not in permissive mode ', function (done) {
    var p = exec('./bin/dockerfile_lint -f test/data/dockerfiles/TestLabels -r test/data/rules/basic.yaml',
        function (err, stdout, stderr) {
        });
    p.on('exit', function (code) {
        code.should.eql(1);
        done();
    });
});





