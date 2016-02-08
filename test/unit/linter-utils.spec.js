'use strict';

require('should');

var utils = require('../../lib/linter-utils');

//TODO Check message when none is provided for a rule
//TODO Check message when one is provided for rule
describe('parseLabels function', function() {
  it('should parse a multiple label string', function() {
    var labels = "LABEL RUN docker run -it --rm --privileged -v `pwd`:/root/ --name NAME -e NAME=NAME -e IMAGE=IMAGE IMAGE dockerfile_lint -f Dockerfile";
    var obj = utils.parseLabels(labels);
    obj.should.be.an.Object;
    console.log(obj);
  });
  it('should parse a single label string', function() {
    var labels = "vendor=lindani phiri  vendor2=lindai zulu";
    var obj = utils.parseLabels(labels);
    obj.should.be.an.Object;
    console.log(obj);
  });
  it('should throw an exception when the label is an invalid label string', function() {
    var labels = "vendor=lindani phiri  vendor2=lindai zulu";
    var obj = utils.parseLabels(labels);
    console.log(obj);
  });
  it('should throw an exception when the parameter is not a string', function() {
    var labels = {};
    var obj = utils.parseLabels(labels);
    console.log(obj);
  });
});
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
// describe('checkRequiredLabels function', function() {
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
// describe('findLabelRule function', function() {
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
// describe('validateDefaultLabelRule function', function() {
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
