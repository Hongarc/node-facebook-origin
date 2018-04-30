'use strict';
const fs = require('fs');
const cslCtr = require('console-control-strings');
const util = require('util');
const timer = require('./timer');

const LOG_FILE_PATH = './public/log.txt';
const LOG_THREAD_ID = process.env.LOG_THREAD_ID;
const LOG_TIMEOUT = process.env.LOG_TIMEOUT;
const log = {
    VERBOSE: 0,
    INFO: 2,
    WARN: 3,
    ERROR: 4
};
let level = log.INFO;
const STREAM = process.stderr;
let colorEnabled = STREAM.isTTY;
const COLOR_NORMAL = cslCtr.color('magenta');
const COLOR_RESET = cslCtr.color('reset');
const NEXT_PREFIX = '││││';
const END_PREFIX = '└┴┴┘';
const SPACE = ' ';
let logToFile = fs.createWriteStream(LOG_FILE_PATH);

const createLevel = (lvl, fb, bg, disp) => (...args) => {
    if (lvl < level) {
        return;
    }
    const COLOR = cslCtr.color(fb, bg, 'bold');

    const logLine = (prefix, msg) => {
        const output = [prefix];
        if (colorEnabled) {
            output.unshift(COLOR);
            output.push(COLOR_NORMAL);
        }
        output.push(SPACE);
        output.push(msg);

        STREAM.write(`${output.join('')}\n`);
        logToFile.write(`${prefix + SPACE + msg}\n`);
    };
    const lines = util.format(...args).split('\n');
    logToFile.cork();
    logLine(disp, lines.shift());
    let endLine;
    if (lines.length) {
        endLine = lines.pop();
    }
    for (const line of lines) {
        logLine(NEXT_PREFIX, line);
    }
    endLine && logLine(END_PREFIX, endLine);
    logToFile.uncork();
    if (colorEnabled) {
        STREAM.write(COLOR_RESET);
    }
};

log.enableColor = () => {
    colorEnabled = true;
};
log.disableColor = () => {
    colorEnabled = false;
};
log.verbose = createLevel(log.VERBOSE, 'blue', 'bgBlack', 'VERB');
log.info = createLevel(log.INFO, 'green', 'bgBlack', 'INFO');
log.warn = createLevel(log.WARN, 'yellow', 'bgBlack', 'WARN');
log.error = createLevel(log.ERROR, 'red', 'bgBlack', 'ERR!');

log.setLevel = lvl => {
    if (typeof lvl === 'number') {
        level = lvl;
    }
};
log.setApi = api => {
    let logName;
    if (!LOG_TIMEOUT) {
        log.error('Please init LOG_TIMEOUT');
        return;
    }
    setInterval(() => {
        logName = LOG_FILE_PATH.replace(/(\.\w+|null)$/, `_${timer.getCurrentTime().toISOString()}`);

        // File name can't contain :
        logName = logName.replace(/:/g, '_');
        fs.renameSync(LOG_FILE_PATH, logName);
        logToFile.close();
        logToFile = fs.createWriteStream(LOG_FILE_PATH);
        const msg = {
            attachments: [fs.createReadStream(logName)]
        };
        api.sendMessage(msg, LOG_THREAD_ID)
            .then(() => {
                fs.unlinkSync(logName);
            });
    }, LOG_TIMEOUT);
};
module.exports = log;
