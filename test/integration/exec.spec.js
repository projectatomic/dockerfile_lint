'use strict';
var EOL = require('os').EOL;
require('should');
var exec = require('child_process').exec;

it.skip('should allow a valid Dockerfile', function (done) {
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


var spawn = require('child_process').spawn;


it('Test Parser', function (done) {
//   console.log( process.env.PATH );
//   var child = spawn('./bin/dockerfile_lint', ['-f', './test/data/dockerfiles/TestLabels']);
//
//   // Listen for stdout data
//   child.stdout.on('data', function (data) {
//       console.log("Got data from child: " + data);
//   });
//
//   // Listen for an exit event:
//   child.on('exit', function (exitCode) {
//       console.log("Child exited with code: " + exitCode);
//   })
//   done();
    var parser = require('../../lib/parser');
    var options = {includeComments: true};
    var contents = 'FROM ubuntu:latest\n'
        + '#I am a comment\n'
        + 'ADD . /root\n'
        + 'RUN echo done\n'
        + 'LABEL RUN docker run -it --rm --privileged -v `pwd`:/root/ \\ \n'
        + '# this is a comment inside a line\n'
        + '# Another comment inside a line\n'
        + ' --name NAME -e NAME=NAME -e IMAGE=IMAGE IMAGE dockerfile_lint -f Dockerfile \n'
        + '# some comment here \n'
        + "one=1 two=3 'one two'=4";

    var commands = parser.parse(contents, options);
//console.log(commands[3])

    commands.forEach(function (cmd) {
        console.log(cmd);
    });
// done();
    done();

});
