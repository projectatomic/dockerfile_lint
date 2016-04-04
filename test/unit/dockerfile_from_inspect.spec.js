'use strict';

var should = require('should'),
    commandsFromInspect = require('../../lib/inspect-to-dockerfile').commandsFromInspect;

describe('Commands from Inspect function', function () {

    it('correctly parses labels', function () {
        var inspect = {
            Config: {
                "Labels": {
                    "Authoritative_Registry": "registry.redhat.com",
                    "BZComponent": "22222",
                    "VendorID": "12345"
                }
            }
        };
        var config = JSON.stringify(inspect);
        var commands = commandsFromInspect(config);
        commands.length.should.eql(1);
        commands[0].name.should.eql('LABEL');
        commands[0].args.should.eql(inspect.Config.Labels);
    });
    it('correctly parses user', function () {
        var inspect ={Config: {"User": "root"}};
        var config = JSON.stringify(inspect);
        var commands = commandsFromInspect(config);
        commands.length.should.eql(1);
        commands[0].name.should.eql('USER');
        commands[0].args.should.eql('root');
    });

    it('correctly parses maintainer', function () {
        var inspect ={Author:"test@example.com"};
        var config = JSON.stringify(inspect);
        var commands = commandsFromInspect(config);
        commands.length.should.eql(1);
        commands[0].name.should.eql('MAINTAINER');
        commands[0].args.should.eql('test@example.com');
    });

});
