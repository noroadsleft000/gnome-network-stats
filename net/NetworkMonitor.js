
const { Clutter, St } = imports.gi;
const { Gio, GLib } = imports.gi;
const Main = imports.ui.main;
const ByteArray = imports.byteArray;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { getDeviceResetMessageBroadcaster } = Me.imports.utils.Broadcasters;

class NetworkMonitorClass {

    constructor(logger, appSettingsModel) {
        this._logger = logger;
        this._appSettingsModel = appSettingsModel;
        this._deviceLogs = {};
        this.init();
    }

    init() {
        // load from preferences
        const now = new Date();
        this._appSettingsModel.load();
        const {devicesInfoMap} = this._appSettingsModel;
        for (const name in devicesInfoMap) {
            const { resetedAt, initialReading } = devicesInfoMap[name];
            this._logger.info(`init - ${name} - ${resetedAt} - ${initialReading}`);
            if (resetedAt) {
                this._deviceLogs[name] = {
                    resetedAt: new Date(resetedAt) || now,
                    initialReading,
                    reset: false
                };
            }
        }
        getDeviceResetMessageBroadcaster().subscribe(this.resetDeviceLogs.bind(this));
    }

    resetDeviceLogs({name}) {
        this._logger.info(`Reset the logs for device ${name}`);
        this._deviceLogs[name] = {...this._deviceLogs[name], reset: true };
        this._appSettingsModel.replaceDeviceInfo(name, { resetedAt: new Date().toString() });
    }

    resetAll() {
        this._logger.info(`Restting all devices at ${new Date().toString()}`);
        const infoMap = {};
        const currTime = new Date().toString();
        for (const name in this._deviceLogs) {
            this._deviceLogs[name].reset = true;
            infoMap[name] = { resetedAt: currTime };
        }
        this._appSettingsModel.devicesInfoMap = infoMap;
    }

    _needReset(deviceName) {
        if (!this._deviceLogs[deviceName] ||
            this._deviceLogs[deviceName].reset ||
            this._deviceLogs[deviceName].initialReading == undefined ||
            !this._deviceLogs[deviceName].resetedAt)
        {
            return true;
        }
        return false;
    }

    getStats() {
        const fileContent = GLib.file_get_contents('/proc/net/dev');
        const lines = ByteArray.toString(fileContent[1]).split("\n");

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
            if (this._needReset(deviceName)) {
                this._logger.debug(`reset - ${deviceName}`);
                deviceLogs[deviceName] = {
                    name: deviceName,
                    sent,
                    received,
                    upDelta: 0,
                    downDelta: 0,
                    totalDelta: 0,
                    totalData: 0,
                    initialReading: sent + received,
                    resetedAt: new Date(),
                    reset: false
                };
                // write to app settings/prefs
                this._appSettingsModel.updateDeviceInfo(deviceName, {
                    initialReading: deviceLogs[deviceName].initialReading,
                    resetedAt: deviceLogs[deviceName].resetedAt.toString(),
                });
            } else {
                const {
                    ["sent"]: oldSent = sent,
                    ["received"]: oldReceived = received,
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

                if (deviceLogs[deviceName].totalData < 0) {
                    this._logger.info("Reset due to -ve reading, may be a wrap around.");
                    deviceLogs[deviceName].reset = true;
                }
            }
            //this._logger.debug(`up: ${sent} down: ${received}`);
        }

        this._deviceLogs = deviceLogs;
        return {
            error: "",
            deviceLogs: deviceLogs
        };
    }
}

var NetworkMonitor = NetworkMonitorClass;