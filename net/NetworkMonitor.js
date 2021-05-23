
const { Clutter, St } = imports.gi;
const { Gio, GLib } = imports.gi;
const Main = imports.ui.main;
const ByteArray = imports.byteArray;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { logger } = Me.imports.utils.Logger;
const { deviceResetMessageBroadcaster } = Me.imports.utils.EventBroadcaster;

class NetworkMonitor {

    constructor() {
        this._deviceLogs = {};
        this.init();
    }

    init() {
        // load from preferences
        deviceResetMessageBroadcaster.subscribe(this.resetDeviceLogs.bind(this));
    }

    resetDeviceLogs({name}) {
        logger.info(`Reset the logs for device ${name}`);
        this._deviceLogs[name] = {...this._deviceLogs[name], reset: true };
    }

    resetAll() {
        logger.info(`Restting all devices at ${new Date().toString()}`);
        for (const name in  this._deviceLogs) {
            this._deviceLogs[name].reset = true;
        }
    }

    getStats() {
        const fileContent = GLib.file_get_contents('/proc/net/dev');
        const lines = ByteArray.toString(fileContent[1]).split("\n");

        const deviceLogs = {};
        for (let index = 2; index < lines.length - 1; ++index) {
            const line = lines[index].trim();
            //logger.debug(`${index} - ${line}`);
            const fields = line.split(/\W+/);
            const deviceName = fields[0];

            if (deviceName == "lo")
                continue;

            const sent = parseInt(fields[9]);
            const received = parseInt(fields[1]);
            if (!this._deviceLogs[deviceName] || this._deviceLogs[deviceName].reset) {
                logger.debug("reset");
                deviceLogs[deviceName] = {
                    name: deviceName,
                    sent,
                    received,
                    upDelta: 0,
                    downDelta: 0,
                    totalDelta: 0,
                    totalData: 0,
                    initialReading: sent + received,
                    initailReadingTime: new Date(),
                    reset: false
                };
            } else {
                const {
                    ["sent"]: oldSent,
                    ["received"]: oldReceived,
                    initialReading,
                } = this._deviceLogs[deviceName]; 

                const upDelta = sent - oldSent;
                const downDelta = received - oldReceived;
                deviceLogs[deviceName] = {
                    ...this._deviceLogs[deviceName],
                    name: deviceName,
                    sent,
                    received,
                    upDelta,
                    downDelta,
                    totalDelta: upDelta + downDelta,
                    totalData: sent + received - initialReading
                };
            }
            //logger.debug(`up: ${sent} down: ${received}`);
        }

        this._deviceLogs = deviceLogs;
        return {
            error: "",
            deviceLogs: deviceLogs
        };
    }
}

var networkMonitor = new NetworkMonitor;