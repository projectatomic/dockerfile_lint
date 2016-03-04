'use strict';
require('should');
var DockerIO = require('dockerode'),
    Linter = require('../../lib/image-linter');

var EOL = require('os').EOL,
    exec = require('child_process').exec;

//it('should allow a valid Dockerfile', function (done) {
//    exec('./bin/dockerfile_lint -f ./test/data/dockerfiles/TestLabels',
//        function (err, stdout, stderr) {
//            if (err) {
//                return done(err);
//            }
//            ;
//            stdout.should.eql('Check passed!' + EOL);
//            stderr.should.eql('');
//            done();
//        });
//});


it('inspect dockerfile', function (done) {
    var docker = new DockerIO();
    var image = docker.getImage('d1633f8ae162');
    console.log(image);
    image.inspect(function (err, data) {
        //console.log(err);
        //console.log("DATA is " + JSON.stringify(data.Config, null, 2));
        var linter = new Linter('./sample_rules/label_rules.yaml');
        var results = linter.validate(JSON.stringify(data));
        console.log(JSON.stringify(results, undefined, 2));
        done();
    });
    //done();
    //;
});