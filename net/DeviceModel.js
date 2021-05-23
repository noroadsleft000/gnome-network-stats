const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const { logger } = Me.imports.utils.Logger;
const { networkMonitor } = Me.imports.net.NetworkMonitor;
const { deviceMonitor } = Me.imports.net.DeviceMonitor;
const { bytesSpeedToString } = Me.imports.utils.GenUtils;
const { bytesToString } = Me.imports.utils.GenUtils;


/*
* Device model class responsible collecting network stats for all the network interfaces and stores them.
* Device model is used by AppController and UI for fetching the stats details.
*/

class DeviceModel {

    constructor() {
        this._upload = 0;
        this._download = 0;
        this._stats = {};
        this._statsText = {};
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

    getActiveDeviceName() {
        return deviceMonitor.getActiveDeviceName();
    }

    getDevices() {
        return this.deviceMonitor.getDevices();
    }

    getStats() {
        return this._stats;
    }

    getReadableStats() {
        return this._statsText;
    }

    update(time) {
        const {
            error,
            deviceLogs
        } = networkMonitor.getStats();

        //logger.debug(`defaultGateway: ${deviceMonitor.getActiveDeviceName()}`);
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
                    initailReadingTime: startTime,
                } = deviceLog;
                const device = deviceMonitor.getDeviceByName(name);
                stats[name] = {
                    name,
                    ip: device.ip,
                    type: device.type,
                    upSpeed: upDelta/time,
                    downSpeed: downDelta/time,
                    totalSpeed: totalDelta/time,
                    totalData: totalData,
                    startTime: startTime,
                };

                const { type, ip, upSpeed, downSpeed, totalSpeed } = stats[name];
                statsText[name] = {
                    name,
                    ip: ip,
                    type: type,
                    upSpeed: bytesSpeedToString(upSpeed),
                    downSpeed: bytesSpeedToString(downSpeed),
                    totalSpeed: bytesSpeedToString(totalSpeed),
                    totalData: bytesToString(totalData),
                    startTime: startTime.toLocaleTimeString(),
                };
                //logger.debug(`${name} => upload: ${upSpeed} download: ${downSpeed} total: ${totalData}`);
            }
            this._stats = stats;
            this._statsText = statsText;
        } else {
            logger.debug(error);
        }
    }

    resetAll() {
        networkMonitor.resetAll();
    }
}

var deviceModel = new DeviceModel;