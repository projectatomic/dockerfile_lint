
#dockerfile-lint

A rule based 'linter' for [Dockerfiles](https://docs.docker.com/reference/builder/). The linter rules can be used  to check file syntax as well as arbitrary semantic and best practice attributes determined by the rule file writer.


#Rule Files
Rule files are written in [yaml](http://www.yaml.org/). See the example rule file **sample_rules.yaml** in the root folder of the project.
The rules are implememented using regular expressions, run on one instruction of the dockerfile at a time.
The rule file has 4 sections, a profile section, a general section, a line rule section and a required instruction section.

##Profile Section
The profile section gives information about the rule file
The information here is meant to help a user select a rule file that is appropriate for a given dockerfile.

##General Section
This section contains general syntax rules.

##Line Rule Section
This section contains rules that must be run on a given instruction in the dockerfile. There is a rule to check the syntax of each instruction and a zero or more rules for semantic checks. 

##Required Instruction Section
This section includes a list of instructions that must exist in the dockerfile in order for it to be considered valid.

#Library Usage

##Node.js application use

Install from github from your application root directory:
```
npm install git+https://github.com/redhataccess/dockerfile_lint
```

Import and use the validator:
```js
var fs = require('fs');
var rulefile = fs.readFileSync('/path/to/rulefile', 'utf8');
var DockerFileValidator = require('dockerfile_lint');
var validator = new DockeFileValidator(rulefile);
var result = validator.validate(dockerfile);
```

## Command Line use
You can install the linter globally on your pc:
```
sudo npm install git+https://github.com/redhataccess/dockerfile_lint

```
Run the tool:
```
dockerfile_lint  /path/to/dockerfile  [/path/to/rule/file]
```
A default rule file is used if no rule file is given.

You can also run the tool without installing it - just clone the source repository and run the tool from the bin directory :
```
git clone git@github.com:redhataccess/dockerfile_lint.git
cd dockerfile_lint/bin
chmod 555 dockerfile_lint
dockerfile_lint  /path/to/dockerfile  [/path/to/rule/file]
```

#Credits
The linter is based on https://github.com/Runnable/validate-dockerfile and https://github.com/goern/dockerfile_checker

# license
MIT