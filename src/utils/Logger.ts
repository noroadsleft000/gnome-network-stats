import { kExtensionId } from "./Constants.js";

/*
* Utility class for logging.
*/

export class Logger {
    private static _instance: Logger | undefined;

    static instance(): Logger {
        return this._instance || (this._instance = new this());
    }

    static releaseInstance(): void {
        this._instance = undefined;
    }

    static log(...args: any[]): void {
        this.instance()._printLog("LOG", ...args);
    }

    static debug(...args: any[]): void {
        this.instance()._printLog("DEBUG", ...args);
    }

    static info(...args: any[]): void {
        this.instance()._printLog("INFO", ...args);
    }

    static error(...args: any[]): void {
        this.instance()._printLog("ERROR", ...args);
    }

    static critical(...args: any[]): void {
        this.instance()._printLog("**CRITICAL", ...args);
    }

    private _callerInfo(level: number = 3): { col: string; line: string; func: string; file: string } {
        let stack = (new Error()).stack;
        let caller = stack?.split("\n")[level] || "";
        const index = caller.indexOf("@");
        const func = caller.substring(0, index);
        const filePath = caller.substring(index + 1);
        const [, relfilePath = "unknown"] = filePath.split(kExtensionId + "/") || [];
        let [file = "unknown", line = "0", col = "0"] = relfilePath.split(":") || [];

        return {
            col,
            line,
            func,
            file
        }
    }

    private _printLog(tag: string, ...args: any[]): void {
        const { line, func, file } = this._callerInfo();
        console.log(`[network-stats] ${tag} ${file}::${func}(${line}) ${args}`);
    }

    log(...args: any[]): void {
        this._printLog("LOG", ...args);
    }

    debug(...args: any[]): void {
        this._printLog("DEBUG", ...args);
    }

    info(...args: any[]): void {
        this._printLog("INFO", ...args);
    }

    error(...args: any[]): void {
        this._printLog("ERROR", ...args);
    }

    critical(...args: any[]): void {
        this._printLog("**CRITICAL", ...args);
    }
};
