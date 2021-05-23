'use strict';

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


/*
* Utility class for logging.
*/

class Logger {
    constructor() {
        this.test = "Hello";
    }

    _callerInfo(level=3) {
        let stack = (new Error()).stack;
        let caller = stack.split("\n")[level];

        caller = caller.replace(Me.path + "/", "");

        let [code, line, _] = caller.split(":");
        let [func, file] = code.split(/\W*@/);

        return {
            line,
            func,
            file
        }
    }

    _printLog(tag, ...args) {
        const { line, func, file } = this._callerInfo();
        log(`${tag} ${file}::${func}(${line}) ${args}`);
    }

    debug(...args) {
        this._printLog("DEBUG", args);
    }

    info(...args) {
        this._printLog("INFO", args);
    }

    error(...args) {
        this._printLog("ERROR", args);
    }

    critical(...args) {
        this._printLog("**CRITICAL", args);
    }
};

var logger = new Logger;