'use strict';
process.env.NODE_ENV = 'test';

require('should');

var exec = require('child_process').exec,
    path = require('path')
var binScript = path.join('bin', 'dockerfile_lint')

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





