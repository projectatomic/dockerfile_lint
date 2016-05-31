'use strict';
require('should');

var parser = require('../../lib/parser');


describe('parse function', function () {
    it('should correctly parse comments', function () {
        var options = {
            includeComments: true
        };
        var contents = 'FROM ubuntu:latest\n'
            + '#Comment1\n'
            + 'RUN echo done\n'
            + ' \n' //should ignore spaces
            + 'LABEL RUN docker run -it --rm --privileged -v `pwd`:/root/\\ \n'
            + '\n' //ignore empty space inside continuation line
            + '#Comment2\n'
            + ' --name NAME -e NAME=NAME -e IMAGE=IMAGE IMAGE dockerfile_lint -f Dockerfile \n'
            + '#Comment3 \n'
            + "LABEL two=3 'one two'=4";

        var commands = parser.parse(contents, options);
        commands.length.should.eql(7); //one less because of continuation line
        commands[1].name.should.eql('COMMENT');
        commands[1].args.should.eql('#Comment1');
        commands[3].name.should.eql('LABEL');
        commands[3].args.should.eql({
            RUN: 'docker run -it --rm --privileged -v `pwd`:/root/ --name NAME -e NAME=NAME -e IMAGE=IMAGE IMAGE dockerfile_lint -f Dockerfile'
        }); //handle comments inside continuation line
        commands[4].name.should.eql('COMMENT');
        commands[4].args.should.eql('#Comment2');
        commands[5].name.should.eql('COMMENT');
        commands[5].args.should.eql('#Comment3');

    });

    it('should correctly strip out comments when asked to', function () {
        var options = {
            includeComments: false
        };
        var contents = 'FROM ubuntu:latest\n'
            + '#Comment1\n'
            + 'RUN echo done\n'
            + "LABEL two=3 'one two'=4 three="
            + '#Comment2\n'
            + '#Comment3 \n';
        var commands = parser.parse(contents, options);
        commands.length.should.eql(3);

    });

    it('should correctly report errors', function () {
        var options = {
            includeComments: false
        };
        var contents = 'FROM ubuntu:latest\n'
            + '#Comment1\n'
            + 'RUN echo done\n'
            + "LABEL two4";  //Invalid label
        var commands = parser.parse(contents, options);
        commands[2].should.have.property('error');
        commands[2].error.should.equal('LABEL must have two arguments, got two4');
        contents = 'FROM ubuntu:latest\n'
            + '#Comment1\n'
            + 'RUN echo done\n'
            + "LABEL two4\n" //Invalid label
            + "LABEL two=2";  //Valid label
        commands = parser.parse(contents, options);
        commands[2].should.have.property('error');
        commands[3].should.not.have.property('error');
    });


});
