[![NPM](https://nodei.co/npm/dockerfile_lint.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/dockerfile_lint/)
[![Build Status](https://travis-ci.org/projectatomic/dockerfile_lint.svg?branch=master)](https://travis-ci.org/projectatomic/dockerfile_lint)

# dockerfile-lint
A rule based 'linter' for [Dockerfiles](https://docs.docker.com/engine/reference/builder/). The linter rules can be used  to check file syntax as well as arbitrary semantic and best practice attributes determined by the rule file writer.
The linter can also be used to check LABEL rules against docker images.

# Table of Contents

- [Quickstart](#quickstart)
- [Extending and Customizing: Rule Files](#extending-and-customizing-rule-files)
  - [Profile Section](#profile-section)
  - [General Section](#general-section)
  - [Rule Attributes](#rule-attributes)
  - [Line Rule Section](#line-rule-section)
  - [Required Instruction Section](#required-instruction-section)
- [Library Usage](#library-usage)
  - [Node.js application use](#nodejs-application-use)
  - [Command Line use](#command-line-use)
- [Credits](#credits)
- [License](#license)

# Quickstart
1. Change to directory where you have a Dockerfile
2. run
  * Atomic CLI

            atomic run projectatomic/dockerfile-lint

            atomic run projectatomic/dockerfile-lint image <imageid>

  * Docker CLI

            docker run -it --rm -v $PWD:/root/ \
                   projectatomic/dockerfile-lint \
                   dockerfile_lint [-f Dockerfile]

            docker run -it --rm -v $PWD:/root/  \
                   -v /var/run/docker.sock:/var/run/docker.sock \
                   projectatomic/dockerfile-lint \
                   dockerfile_lint  image <imageid>



By default, the linter runs in strict mode (errors and/or warnings result in non-zero return code). Run the command with `-p`  or `--permissive` to
run in permissive mode:

            atomic run projectatomic/dockerfile-lint -p

            docker run -it --rm -v $PWD:/root/ \
                               projectatomic/dockerfile-lint \
                               dockerfile_lint -p -f Dockerfile

# Extending and Customizing: Rule Files
Rule files are written in [yaml](http://www.yaml.org/). See the example rule file **sample_rules.yaml** in the root folder of the project.
The rules are implememented using regular expressions, run on one instruction of the dockerfile at a time.
The rule file has 4 sections, a profile section, a general section, a line rule section and a required instruction section.

## Profile Section
The profile section gives information about the rule file
The information here is meant to help a user select a rule file that is appropriate for a given dockerfile. Example:
```yaml
profile:
  name: "Default"
  description: "Default Profile. Checks basic syntax."
```

## General Section
This section contains general syntax rules.

## Rule Attributes

Here is an example of a line rule expressed in yaml:
```yaml
    label: "is_latest_tag"
    regex: /latest/
    level: "info"
    inverse_rule: true
    message: "base image uses 'latest' tag"
    description: "using the 'latest' tag may cause unpredictable builds. It is recommended that a specific tag is used in the FROM line."
    reference_url:
```

## Line Rule Section
This section contains rules that must be run on a given instruction in the dockerfile. There is a rule to check the syntax of each instruction and zero or more rules for semantic checks. The example below shows rules to run against the `FROM` instruction:
```yaml
line_rules:
    FROM:
      paramSyntaxRegex: /.+/
      rules:
        -
          label: "is_latest_tag"
          regex: /latest/
          level: "info"
          message: "base image uses 'latest' tag"
          description: "using the 'latest' tag may cause unpredictable builds. It is recommended that a specific tag is used in the FROM line."
          reference_url:
            - "https://docs.docker.com/engine/reference/builder/"
            - "#from"
        -
          label: "no_tag"
          regex: /[:]/
          level: "warn"
          inverse_rule: true
          message: "No tag is used"
          description: "No tag is used"
          reference_url:
            - "https://docs.docker.com/engine/reference/builder/"
            - "#from"
        -
          label: "from_not_redhat"
          regex: /rhel|redhat*/
          inverse_rule: true
          level: "error"
          message: "Base Image is not from Red Hat"
          description: "Base Image must be from Red Hat"
          reference_url:
```
Note the (optional) `inverse_rule` attribute - this is just a convinient way to negate a regex rule - by default a rule is considered violated if it matches the regex pattern, but when 'inverse_rule' is set to 'true' the rule is violated if the line does not match the regex.

## Required Instruction Section
This section includes a list of instructions that must exist in the dockerfile in order for it to be considered valid.

## Inline Ignore Instructions
The user can tell dockerfile_lint to ignore a specific comand line inside a Dockerfile by placing a comment containing the word "dockerfile_lint" followed by the word "ignore", separated by a space, or a space and a dash/equals sign, above the command in the Dockerfile to be ignored. 
```
# Add is required <for some previously approved reason documented here>
# dockerfile_lint - ignore
ADD http://example.com/big.tar.xz /usr/src/things/
```
The above inline ignore would cause dockerfile_lint to skip processing the ADD command that follows it.  This allows the writing of strict rules in order to catch when best practices are not followed, while still being able to explicitly override the check on a case by case basis if a valid reason exists.  

# Library Usage

## Node.js application use
Install from github from your application root directory:
```
npm install git+https://github.com/projectatomic/dockerfile_lint
```

Import and use the validator:
```js
var fs = require('fs');
var rulefile = '/path/to/rulefile';
var DockerFileValidator = require('dockerfile_lint');
var validator = new DockerFileValidator(rulefile);
var result = validator.validate(dockerfile);
```

## Command Line use
You can install the linter globally on your pc:
```
sudo npm install -g dockerfile_lint
```

Run the tool:
```
dockerfile_lint  -f /path/to/dockerfile  [-f /path/to/second/dockerfile]  [-r /path/to/rule/file]
```
A default rule file is used if no rule file is given.

You can also run the tool without installing it - just clone the source repository and run the tool from the bin directory :
```
git clone git@github.com:projectatomic/dockerfile_lint.git
cd dockerfile_lint/bin
chmod 555 dockerfile_lint
dockerfile_lint  -f /path/to/dockerfile  [ -r /path/to/rule/file]
```

To display results as JSON use the `-j` option:
```
dockerfile_lint  -j -f /path/to/dockerfile  [ -r /path/to/rule/file]
```

To display results as JUnit XML file use the `-u` option:
```
dockerfile_lint  -u -f /path/to/dockerfile  [ -r /path/to/rule/file]
```

Command Help:
```
dockerfile_lint  -h
```

# Credits
The linter is based on https://github.com/aweiteka/dockerfile_checker

# License
MIT
