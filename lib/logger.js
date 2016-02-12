'use strict';

var winston = require('winston'),
    fs = require('fs'),
    level = process.env.log_level || 'warn',
    logger;

winston.setLevels(winston.config.npm.levels);
winston.addColors(winston.config.npm.colors);


var transports;


transports = [
    new winston.transports.Console({
        level: level,
        colorize: true
    }),
    new winston.transports.File({
        level: level,
        filename: 'out.log'
    })
]


logger = new ( winston.Logger )({
    transports: transports,
    exceptionHandlers: [
        new winston.transports.File({
            filename: 'exceptions.log'
        })
    ]
});

module.exports = logger;
