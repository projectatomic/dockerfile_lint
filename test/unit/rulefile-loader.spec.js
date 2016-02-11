'use strict';

require('should');

var loadRule = require('../../lib/rulefile-loader');


describe('rule file loader function', function () {

    it('should throw an error when and incorrect rule specification is provided', function () {

    });

    it('should throw an error when when there is cyclic dependency', function () {

    });

    it('should throw an error when a non-existent rule file is provided', function () {


    });

    it('should return the profile name of the main file when includes are used', function () {


    });

    it('should throw an error when an included file is not found', function () {


    });

    it('should correctly parse a rule file with multiple includes', function () {

    });

    it('should correctly parse a rule file with an include chain', function () {
         //
         // We need to verify this : file B includes file A, file C includes file B, then loading
         // file C should load rules in the order A -> B -> C, with B overriding in values in A
         // and C overriding values in both A and B
         //
        var rules = loadRule('../data/rules/loader_test_include_c.yaml');
        console.log("RULE OBJECT is : \n" + JSON.stringify(rules, null, 2));

    });


});
