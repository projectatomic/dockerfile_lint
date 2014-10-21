
#dockerfile-lint

A rule based 'linter' for [Dockerfiles](https://docs.docker.com/reference/builder/). The linter rules can be used  to check file syntax as well as arbitrary semantic and best practice attributes determined by the rule file writer.


#Rule Files
Rule files are written in [yaml](http://www.yaml.org/). See sample_rules.yaml in the root folder of the project for an example.
The rules are implememented using regular expressions, run on one instruction of the dockerfile at a time.
The rule file has 4 sections, a profile section, a general section, a line rule section and a required instruction section.

##Profile Section
The profile section is gives information about the rule file, for example:
```yaml
profile:
    name: "Default"
    description: "Default Profile. Checks basic syntax."
```
The information here is meant to help a user select a rule file that is appropriate for a given dockerfile.

##General Section

##Line Rule Section


##Required Instruction Section


#Library Usage Example

Installation:

```js
var fs = require('fs');
var rulefile = fs.readFileSync('/path/to/rulefile', 'utf8');
var DockerFileValidator = require('dockerfile_lint');
var validator = new DockeFileValidator(rulefile);
var result = validator.validate(dockerfile);
```

#Command Line Use

The validator can also be used as a command line tool.

Install:
```
npm install
```

#Credits
The linter is based on https://github.com/Runnable/validate-dockerfile and https://github.com/goern/dockerfile_checker

# license
MIT