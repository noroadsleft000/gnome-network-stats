const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const { logger } = Me.imports.utils.Logger;
const { NetworkMonitor } = Me.imports.net.NetworkMonitor;
const { DeviceMonitor } = Me.imports.net.DeviceMonitor;
const { bytesSpeedToString } = Me.imports.utils.GenUtils;
const { bytesToString } = Me.imports.utils.GenUtils;


/*
* Device model class responsible collecting network stats for all the network interfaces and stores them.
* Device model is used by AppController and UI for fetching the stats details.
*/

class DeviceModelClass {

    constructor() {
        this._upload = 0;
        this._download = 0;
        this._stats = {};
        this._statsText = {};
        this._deviceMonitor = new DeviceMonitor();
        this._networkMonitor = new NetworkMonitor();
    }

    getUploadSpeed(deviceName) {
        if (this._stats[deviceName]) {
            return this._stats[deviceName].upSpeed;
        }
        return 0;
    }

    getDownloadSpeed(deviceName) {
        if (this._stats[deviceName]) {
            return this._stats[deviceName].downSpeed;
        }
        return 0;
    }

    getTotalSpeed(deviceName) {
        return this.getUploadSpeed(deviceName) + this.getDownloadSpeed(deviceName);
    }

    getTotalDataUsage(deviceName) {
        if (this._stats[deviceName]) {
            return this._stats[deviceName].totalData;
        }
        return 0;
    }

    hasDevice(deviceName) {
        return this._deviceMonitor.hasDevice(deviceName);
    }

    getActiveDeviceName() {
        return this._deviceMonitor.getActiveDeviceName();
    }

    getDevices() {
        return this._deviceMonitor.getDevices();
    }

    getStats() {
        return this._stats;
    }

    getReadableStats() {
        return this._statsText;
    }

    get networkMonitor() {
        return this._networkMonitor;
    }

    get deviceMonitor() {
        return this._deviceMonitor;
    }

    /* time in milliseconds */
    update(time, mode = true) {
        const {
            error,
            deviceLogs
        } = this._networkMonitor.getStats();

        //logger.debug(`defaultGateway: ${this._deviceMonitor.getActiveDeviceName()}`);
        if (!error) {
            const stats = {};
            const statsText = {};
            for (const [, deviceLog] of Object.entries(deviceLogs)) {
                const {
                    name,
                    upDelta,
                    downDelta,
                    totalDelta,
                    totalData,
                    ["resetedAt"]: startTime,
                } = deviceLog;
                const device = this._deviceMonitor.getDeviceByName(name);
                if (device) {
                    stats[name] = {
                        name,
                        ip: device.ip,
                        type: device.type,
                        upSpeed: upDelta / (time/1000),
                        downSpeed: downDelta / (time/1000),
                        totalSpeed: totalDelta /(time/1000),
                        totalData: totalData,
                        startTime: startTime,
                    };

                    const { type, ip, upSpeed, downSpeed, totalSpeed } = stats[name];
                    statsText[name] = {
                        name,
                        ip: ip,
                        type: type,
                        upSpeed: bytesSpeedToString(upSpeed, mode),
                        downSpeed: bytesSpeedToString(downSpeed, mode),
                        totalSpeed: bytesSpeedToString(totalSpeed, mode),
                        totalData: bytesToString(totalData),
                        startTime: startTime.toLocaleString(undefined, {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour12: true,
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                        }),
                    };
                    //logger.debug(`${name} => upload: ${upSpeed} download: ${downSpeed} total: ${totalData}`);
                }
            }
            this._stats = stats;
            this._statsText = statsText;
        } else {
            logger.debug(error);
        }
    }

    resetAll() {
        this._networkMonitor.resetAll();
    }
}

var DeviceModel = DeviceModelClass;