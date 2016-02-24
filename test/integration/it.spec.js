'use strict';
require('should');

var EOL = require('os').EOL,
    exec = require('child_process').exec;

it('should allow a valid Dockerfile', function (done) {
    exec('./bin/dockerfile_lint -f ./test/data/dockerfiles/TestLabels',
        function (err, stdout, stderr) {
            if (err) {
                return done(err);
            };
            stdout.should.eql('Check passed!' + EOL);
            stderr.should.eql('');
            done();
        });
});
