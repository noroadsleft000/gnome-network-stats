'use strict';
import { kExtensionId } from "./Constants.js";

/*
* Utility class for logging.
*/

export class Logger {
    static instance() {
        return this._instance || (this._instance = new this());
    }

    static releaseInstance() {
        this._instance = undefined;
    }

    static log(...args) {
        this.instance()._printLog("LOG", ...args);
    }

    static debug(...args) {
        this.instance()._printLog("DEBUG", ...args);
    }

    static info(...args) {
        this.instance()._printLog("INFO", ...args);
    }

    static error(...args) {
        this.instance()._printLog("ERROR", ...args);
    }

    static critical(...args) {
        this.instance()._printLog("**CRITICAL", ...args);
    }

    _callerInfo(level = 3) {
        let stack = (new Error()).stack;
        let caller = stack.split("\n")[level];
        const index = caller.indexOf("@");
        const func = caller.substring(0, index);
        const filePath = caller.substring(index + 1);
        const [, relfilePath = "unknown"] = filePath.split(kExtensionId + "/") || [];
        let [file = "unknown", line = 0, col = 0] = relfilePath.split(":") || [];

        return {
            col,
            line,
            func,
            file
        }
    }

    _printLog(tag, ...args) {
        const { line, func, file } = this._callerInfo();
        console.log(`[network-stats] ${tag} ${file}::${func}(${line}) ${args}`);
    }

    log(...args) {
        this._printLog("LOG", ...args);
    }

    debug(...args) {
        this._printLog("DEBUG", ...args);
    }

    info(...args) {
        this._printLog("INFO", ...args);
    }

    error(...args) {
        this._printLog("ERROR", ...args);
    }

    critical(...args) {
        this._printLog("**CRITICAL", ...args);
    }
};
