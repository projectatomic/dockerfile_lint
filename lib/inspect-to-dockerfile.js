/**
 * Created by lphiri on 3/20/16.
 */
'use strict';


var commandHandlerMap = Object.freeze({
    User: {command: 'USER', parser: parseUser},
    Entrypoint: {command: 'ENTRYPOINT', parser: parseEntryPoint},
    Env: {command: 'ENV', parser: parseEnv},
    Cmd: {command: 'CMD', parser: parseCmd},
    WorkingDir: {command: 'WORKDIR', parser: parseWorkDir},
    OnBuild: {command: 'ONBUILD', parser: parseOnBuild},
    Labels: {command: 'LABEL', parser: parseLabels},
    ExposedPorts: {command: 'EXPOSE', parser: parseExposedPorts},
});


function commandsFromInspect(inspectOutPut) {

    inspectOutPut = JSON.parse(inspectOutPut);
    var commands = [],
        config = inspectOutPut.Config,
        keys,
        args,
        commandHandler;
    if (parseMaintainer(inspectOutPut)){
        commands.push(parseMaintainer(inspectOutPut))
    }
    if (config) {
        keys = Object.keys(config);
        for (var key in keys) {
            key = keys[key];
            commandHandler = commandHandlerMap[key];
            if (commandHandler) {
                args = commandHandler.parser(config[key]);
                if (args) {
                    commands.push({
                        name: commandHandler.command,
                        args: args,
                        raw: config[key]
                    })
                }
            }
        }
    }
    return commands;
}


function parseUser(args) {
    return args;
}

function parseEntryPoint(args) {

}

function parseEnv(args) {

}

function parseCmd(args) {

}

function parseWorkDir(args) {

}

function parseOnBuild(args) {

}

function parseLabels(args) {
    return args;
}

function parseExposedPorts(args) {

}

function parseMaintainer(inspectOutPut) {
    var author = inspectOutPut['Author']
    if (!author) return null;
    return {
        name: 'MAINTAINER',
        args: author,
        raw: null
    }
}

module.exports.commandsFromInspect = commandsFromInspect;

