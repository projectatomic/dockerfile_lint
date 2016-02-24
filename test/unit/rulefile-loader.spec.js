'use strict';

var should =require('should'),
    fs = require('fs'),
    loadRules = require('../../lib/rulefile-loader').load;


function loadJsonObject(filename){
    var obj = JSON.parse(fs.readFileSync(filename,'utf8'));
    return obj;
}


describe('rule file loader function', function () {

    it.skip('should throw an error when and incorrect rule specification is provided', function () {
        //Not implemented yet
    });

    it('should throw an error when there is a cyclic dependency', function () {
        loadRules.bind(null,'./test/data/rules/loader_test_include_cyclic.yaml').should.throw();
    });

    it('should throw an error when a non-existent rule file is provided', function () {
        loadRules.bind(null,'./test/data/rules/yoda.yaml').should.throw();

    });

    it('should throw an error when an included file is not found', function () {
        loadRules.bind(null,'./test/data/rules/loader_test_include_non_exist.yaml').should.throw();
    });

    it('should correctly parse a rule file with multiple includes', function () {
        var rules = loadRules('./test/data/rules/loader_test_combine_main.yaml');
        var expected = loadJsonObject('./test/data/rules/loader_test_combine_main.expected.json');
        should.deepEqual(rules, expected);
    });

    it('should correctly load a rule file with an include chain', function () {
        //
        // We need to verify this : file B includes file A, file C includes file B, then loading
        // file C should load rules in the order A -> B -> C, with B overriding in values in A
        // and C overriding values in both A and B
        //
        var rules = loadRules('./test/data/rules/loader_test_include_chain.yaml');
        var expected = loadJsonObject('./test/data/rules/loader_test_include_chain.expected.json');
        should.deepEqual(rules, expected);
    });

});
