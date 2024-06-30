import GLib from "gi://GLib";

export class NetworkMonitor {

    constructor(logger) {
        this._logger = logger;
        this._textDecoder = new TextDecoder;
    }

    getStats() {
        const fileContent = GLib.file_get_contents('/proc/net/dev');
        const lines = this._textDecoder.decode(fileContent[1]).split("\n");

        const deviceLogs = {};
        for (let index = 2; index < lines.length - 1; ++index) {
            const line = lines[index].trim();
            //this._logger.debug(`${index} - ${line}`);
            const fields = line.split(/[^A-Za-z0-9_-]+/);
            const deviceName = fields[0];

            if (deviceName == "lo")
                continue;

            const sent = parseInt(fields[9]);
            const received = parseInt(fields[1]);
            deviceLogs[deviceName] = {
                name: deviceName,
                upload: sent,
                download: received
            };
            //this._logger.debug(`deviceName: ${deviceName} up: ${sent} down: ${received}`);
        }

        return {
            error: "",
            deviceLogs: deviceLogs
        };
    }
}
