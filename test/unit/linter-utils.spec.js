'use strict';

require('should');

var utils = require('../../lib/linter-utils');


//
// describe('createReqInstructionHash function', function() {
//   it('should parse a multiple label string', function() {
//     var labels = "vendor=devif";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should parse a single label string', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should throw an exception when the label string is invalid', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     console.log(obj);
//   });
// });
//
// describe('createRequiredLabelsHash function', function() {
//   it('should parse a multiple label string', function() {
//     var labels = "vendor=devif";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should parse a single label string', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should throw an exception when the label string is invalid', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     console.log(obj);
//   });
// });
//
// describe('initLineRulesRegexes function', function() {
//   it('should parse a multiple label string', function() {
//     var labels = "vendor=devif";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should parse a single label string', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should throw an exception when the label string is invalid', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     console.log(obj);
//   });
// });
//
// describe('checkRequiredInstructions function', function() {
//   it('should parse a multiple label string', function() {
//     var labels = "vendor=devif";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should parse a single label string', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should throw an exception when the label string is invalid', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     console.log(obj);
//   });
// });
//
//
// describe('checkRequiredNameVals function', function() {
//   it('should parse a multiple label string', function() {
//     var labels = "vendor=devif";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should parse a single label string', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should throw an exception when the label string is invalid', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     console.log(obj);
//   });
// });
//
//
// describe('checkLineRules function', function() {
//   it('should parse a multiple label string', function() {
//     var labels = "vendor=devif";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should parse a single label string', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should throw an exception when the label string is invalid', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     console.log(obj);
//   });
// });
//
//
// describe('createValidCommandRegex function', function() {
//   it('should parse a multiple label string', function() {
//     var labels = "vendor=devif";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should parse a single label string', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should throw an exception when the label string is invalid', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     console.log(obj);
//   });
// });
//
// describe('findKeyValRule function', function() {
//   it('should parse a multiple label string', function() {
//     var labels = "vendor=devif";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should parse a single label string', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should throw an exception when the label string is invalid', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     console.log(obj);
//   });
// });
//
// describe('addResult function', function() {
//   it('should parse a multiple label string', function() {
//     var labels = "vendor=devif";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should parse a single label string', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should throw an exception when the label string is invalid', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     console.log(obj);
//   });
// });
//
// describe('addError function', function() {
//   it('should parse a multiple label string', function() {
//     var labels = "vendor=devif";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should parse a single label string', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should throw an exception when the label string is invalid', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     console.log(obj);
//   });
// });
//
// describe('validateNameValRule function', function() {
//   it('should parse a multiple label string', function() {
//     var labels = "vendor=devif";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should parse a single label string', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should throw an exception when the label string is invalid', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     console.log(obj);
//   });
// });
//
// describe('validateLabels function', function() {
//   it('should parse a multiple label string', function() {
//     var labels = "vendor=devif";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should parse a single label string', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     obj.should.be.an.Object;
//     console.log(obj);
//   });
//   it('should throw an exception when the label string is invalid', function() {
//     var labels = "vendor=lindani phiri  vendor2=lindai zulu";
//     var obj = utils.parseLabels(labels);
//     console.log(obj);
//   });
// });
