import GLib from "gi://GLib";

import { bytesSpeedToString, bytesToString } from "../utils/GenUtils.js";
import { Broadcasters } from "../utils/Broadcasters.js";
import type { Logger } from "../utils/Logger.js";
import type { DeviceMonitor } from "./DeviceMonitor.js";
import type { AppSettingsModel } from "../AppSettingsModel.js";
import type { NetworkMonitor } from "./NetworkMonitor.js";

export interface DeviceStats {
    name: string;
    ip?: string;
    type?: string;
    upload?: number;
    download?: number;
    upSpeed: number;
    downSpeed: number;
    totalSpeed: number;
    totalUpload: number;
    totalDownload: number;
    totalData?: number;
    resetedAt: Date;
}

export interface DeviceStatsText {
    name: string;
    ip: string;
    type: string;
    upSpeed: string;
    downSpeed: string;
    totalSpeed: string;
    totalData: string;
    startTime: string;
}

export interface DeviceReading {
    initialReading: number;
    resetedAt?: string;
    totalUpload?: number;
    totalDownload?: number;
}

/*
 * Device model class responsible collecting network stats for all the network interfaces and stores them.
 * Device model is used by AppController and UI for fetching the stats details.
 */

export class DeviceModel {
    private _stats: Record<string, DeviceStats>;
    private _statsText: Record<string, DeviceStatsText>;
    private _lastTime: number | undefined;

    constructor(
        private _logger: Logger,
        private _deviceMonitor: DeviceMonitor,
        private _networkMonitor: NetworkMonitor,
        private _appSettingsModel: AppSettingsModel
    ) {
        this._stats = {};
        this._statsText = {};
        this._lastTime = undefined;
        this.init();
    }

    get networkMonitor(): NetworkMonitor {
        return this._networkMonitor;
    }

    get deviceMonitor(): DeviceMonitor {
        return this._deviceMonitor;
    }

    init(): void {
        const now = new Date();
        const { devicesInfoMap } = this._appSettingsModel;
        const stats: Record<string, DeviceStats> = {};
        for (const [name, deviceInfo] of Object.entries(devicesInfoMap)) {
            const { resetedAt, totalUpload = 0, totalDownload = 0 } = deviceInfo;
            const totalData = totalUpload + totalDownload;
            this._logger.info(`init - ${name} - ${resetedAt}`);
            stats[name] = {
                name,
                upSpeed: 0,
                downSpeed: 0,
                totalSpeed: 0,
                totalUpload,
                totalDownload,
                totalData,
                resetedAt: now
            };
            if (resetedAt) {
                stats[name].resetedAt = new Date(resetedAt);
            }
            this._stats = stats;
        }
        Broadcasters.deviceResetMessageBroadcaster?.subscribe(this.resetDeviceStats.bind(this));
    }

    getStats(): Record<string, DeviceStats> {
        return this._stats;
    }

    getReadableStats(): Record<string, DeviceStatsText> {
        return this._statsText;
    }

    getStatField<K extends keyof DeviceStats>(
        deviceName: string,
        field: K,
        defaultVal: DeviceStats[K]
    ): DeviceStats[K] {
        const stat = this._stats[deviceName];
        if (stat) {
            return stat[field] || defaultVal;
        }
        return defaultVal;
    }

    getStatTextField<K extends keyof DeviceStatsText>(
        deviceName: string,
        field: K,
        defaultVal: DeviceStatsText[K]
    ): DeviceStatsText[K] {
        const stat = this._statsText[deviceName];
        if (stat) {
            return stat[field] || defaultVal;
        }
        return defaultVal;
    }

    /** values in bytes */
    getUploadSpeed(deviceName: string): number {
        return this.getStatField(deviceName, "upSpeed", 0);
    }

    getDownloadSpeed(deviceName: string): number {
        return this.getStatField(deviceName, "downSpeed", 0);
    }

    getTotalSpeed(deviceName: string): number {
        return this.getStatField(deviceName, "totalSpeed", 0);
    }

    getTotalDataUsage(deviceName: string): string {
        return this.getStatTextField(deviceName, "totalData", "");
    }

    /** Human readable string format */
    getUploadSpeedText(deviceName: string): string {
        return this.getStatTextField(deviceName, "upSpeed", "");
    }

    getDownloadSpeedText(deviceName: string): string {
        return this.getStatTextField(deviceName, "downSpeed", "");
    }

    getTotalSpeedText(deviceName: string): string {
        return this.getStatTextField(deviceName, "totalSpeed", "");
    }

    getTotalDataUsageText(deviceName: string): string {
        return this.getStatTextField(deviceName, "totalData", "");
    }

    /** Device methods */
    hasDevice(deviceName: string): boolean {
        return this._deviceMonitor.hasDevice(deviceName);
    }

    getActiveDeviceName(): string {
        return this._deviceMonitor.getActiveDeviceName();
    }

    getDevices() {
        return this._deviceMonitor.getDevices();
    }

    /** Return time delta in milliseconds */
    getTimeDelta(): number {
        const newTime = GLib.get_monotonic_time() / 1000;
        const timeDelta = newTime - (this._lastTime || newTime) + 1;
        this._lastTime = newTime;
        return timeDelta;
    }

    /* time in seconds */
    update(bytesMode: boolean = true): void {
        const { error, deviceLogs } = this._networkMonitor.getStats();
        const timeDelta = this.getTimeDelta() / 1000;

        if (!error) {
            const stats: Record<string, DeviceStats> = {};
            const statsText: Record<string, DeviceStatsText> = {};
            for (const [name, deviceLog] of Object.entries(deviceLogs)) {
                const { upload, download } = deviceLog;

                if (!this._stats[name]) {
                    //new device detected
                    this.initDeviceStats(name);
                }

                const {
                    ["upload"]: oldUpload = upload,
                    ["download"]: oldDownload = download,
                    ["totalUpload"]: oldTotalUpload = 0,
                    ["totalDownload"]: oldTotalDownload = 0,
                    resetedAt
                } = this._stats[name];

                // delta
                const upDelta = upload - oldUpload;
                const downDelta = download - oldDownload;

                // speeds
                const upSpeed = upDelta / timeDelta;
                const downSpeed = downDelta / timeDelta;
                const totalSpeed = upSpeed + downSpeed;

                // total data till now
                const totalUpload = oldTotalUpload + upDelta;
                const totalDownload = oldTotalDownload + downDelta;
                const totalData = totalUpload + totalDownload;

                const device = this._deviceMonitor.getDeviceByName(name);
                if (device) {
                    const { ip, type } = device;
                    stats[name] = {
                        name,
                        ip,
                        type,
                        upload,
                        download,
                        upSpeed,
                        downSpeed,
                        totalSpeed,
                        totalUpload,
                        totalDownload,
                        resetedAt
                    };

                    statsText[name] = {
                        name,
                        ip: ip,
                        type: type,
                        upSpeed: bytesSpeedToString(upSpeed, bytesMode),
                        downSpeed: bytesSpeedToString(downSpeed, bytesMode),
                        totalSpeed: bytesSpeedToString(totalSpeed, bytesMode),
                        totalData: bytesToString(totalData),
                        startTime: resetedAt.toLocaleString(undefined, {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour12: true,
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                        })
                    };
                    //this._logger.debug(`${name} => upload: ${upSpeed} download: ${downSpeed} total: ${totalData}`);
                }
            }
            this._stats = stats;
            this._statsText = statsText;
        } else {
            this._logger.debug(error);
        }
    }

    saveStats(): void {
        const devicesInfo = { ...this._appSettingsModel.devicesInfoMap };
        const deviceLogs = this.getStats();
        for (const [name, stat] of Object.entries(deviceLogs)) {
            devicesInfo[name].totalUpload = stat.totalUpload;
            devicesInfo[name].totalDownload = stat.totalDownload;
        }
        this._appSettingsModel.devicesInfoMap = devicesInfo;
    }

    initDeviceStats(name: string): void {
        this._logger.info(`New device added: ${name}`);
        const now = new Date();
        const stat: DeviceStats = {
            name,
            upSpeed: 0,
            downSpeed: 0,
            totalSpeed: 0,
            totalUpload: 0,
            totalDownload: 0,
            resetedAt: now
        };
        this._stats[name] = stat;
        const deviceLogs: DeviceReading = {
            initialReading: 0,
            totalUpload: 0,
            totalDownload: 0,
            resetedAt: now.toString()
        };
        this._appSettingsModel.replaceDeviceInfo(name, deviceLogs);
    }

    resetDeviceStats({ name }: { name: string }): void {
        const now = new Date();
        this._logger.info(`Resetting the device ${name} at ${now.toString()}`);
        if (this._stats[name]) {
            this._stats[name] = {
                ...this._stats[name],
                resetedAt: now,
                totalUpload: 0,
                totalDownload: 0
            };
            let deviceLogs = this._appSettingsModel.getDeviceInfo(name);
            deviceLogs = {
                ...deviceLogs,
                totalUpload: 0,
                totalDownload: 0,
                resetedAt: now.toString()
            };
            this._appSettingsModel.replaceDeviceInfo(name, deviceLogs);
        }
    }

    resetAll(): void {
        const now = new Date();
        const nowStr = now.toString();
        this._logger.info(`Restting all devices at ${nowStr}`);
        const infoMap = this._appSettingsModel.devicesInfoMap;
        for (const name in this._stats) {
            this._stats[name] = {
                ...this._stats[name],
                resetedAt: now,
                totalDownload: 0,
                totalUpload: 0
            };
            infoMap[name] = {
                ...infoMap[name],
                resetedAt: nowStr,
                totalDownload: 0,
                totalUpload: 0
            };
        }
        this._appSettingsModel.devicesInfoMap = infoMap;
    }
}
