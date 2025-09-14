import GLib from "gi://GLib";

import { bytesSpeedToString, bytesToString } from "../utils/GenUtils.js";
import { Broadcasters } from "../utils/Broadcasters.js";
import type { Logger } from "../utils/Logger.js";
import type { DeviceInfo, DeviceMonitor } from "./DeviceMonitor.js";
import type { AppSettingsModel } from "../AppSettingsModel.js";
import type { NetworkMonitor } from "./NetworkMonitor.js";
import { DevicesListType } from "../utils/Constants.js";

/**
 * Device stats interface is used to store the stats for each device.
 * It is used to store the stats in memory by fetching the stats from NetworkMonitor.
 */
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

/**
 * Device view model interface is used to send updates to the UI.
 */
export interface DeviceViewModel {
    name: string;
    ip: string;
    type: string;
    upSpeed: string;
    downSpeed: string;
    totalSpeed: string;
    totalData: string;
    startTime: string;
}

/**
 * Device reading interface is used to send updates to the settings.
 */
export interface DeviceReading {
    initialReading: number;
    resetedAt?: string;
    totalUpload?: number;
    totalDownload?: number;
}

/**
 * Device presenter class responsible collecting network stats for all the network interfaces and stores them.
 * Device presenter is used by AppController and UI for fetching the stats details.
 */

export class DevicePresenter {
    private _stats: Record<string, DeviceStats>;
    private _statsViewModel: Record<string, DeviceViewModel>;
    private _lastTime: number | undefined;

    constructor(
        private _logger: Logger,
        private _deviceMonitor: DeviceMonitor,
        private _networkMonitor: NetworkMonitor,
        private _appSettingsModel: AppSettingsModel
    ) {
        this._stats = {};
        this._statsViewModel = {};
        this._lastTime = undefined;
        this.init();
    }

    /**
     * Get network monitor instance.
     * @returns Network monitor instance
     */
    get networkMonitor(): NetworkMonitor {
        return this._networkMonitor;
    }

    /**
     * Get device monitor instance.
     * @returns Device monitor instance
     */
    get deviceMonitor(): DeviceMonitor {
        return this._deviceMonitor;
    }

    /**
     * Initialize the device presenter with pull stats from settings.
     */
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

    /**
     * Get all device stats.
     * @returns All device stats
     */
    getStats(): Record<string, DeviceStats> {
        return this._stats;
    }

    /**
     * Get all device view models.
     * @returns All device view models
     */
    getViewModel(): Record<string, DeviceViewModel> {
        return this._statsViewModel;
    }

    /**
     * Get data field from device stats.
     * @param deviceName - Device name
     * @param field - Field name
     * @param defaultVal - Default value
     * @returns Data field from device stats
     */
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

    /**
     * Get data field from device view model.
     * @param deviceName - Device name
     * @param field - Field name
     * @param defaultVal - Default value
     * @returns Data field from device view model
     */
    getViewModelField<K extends keyof DeviceViewModel>(
        deviceName: string,
        field: K,
        defaultVal: DeviceViewModel[K]
    ): DeviceViewModel[K] {
        const stat = this._statsViewModel[deviceName];
        if (stat) {
            return stat[field] || defaultVal;
        }
        return defaultVal;
    }

    /**
     * Get upload speed in bytes.
     * @param deviceName - Device name
     * @returns Upload speed in bytes
     */
    getUploadSpeed(deviceName: string): number {
        return this.getStatField(deviceName, "upSpeed", 0);
    }

    /**
     * Get download speed in bytes.
     * @param deviceName - Device name
     * @returns Download speed in bytes
     */
    getDownloadSpeed(deviceName: string): number {
        return this.getStatField(deviceName, "downSpeed", 0);
    }

    /**
     * Get total speed in bytes.
     * @param deviceName - Device name
     * @returns Total speed in bytes
     */
    getTotalSpeed(deviceName: string): number {
        return this.getStatField(deviceName, "totalSpeed", 0);
    }

    /**
     * Get total data usage in bytes.
     * @param deviceName - Device name
     * @returns Total data usage in bytes
     */
    getTotalDataUsage(deviceName: string): string {
        return this.getViewModelField(deviceName, "totalData", "");
    }

    /**
     * Get upload speed in human readable string format.
     * @param deviceName - Device name
     * @returns Upload speed in human readable string format
     */
    getUploadSpeedText(deviceName: string): string {
        return this.getViewModelField(deviceName, "upSpeed", "");
    }

    /**
     * Get download speed in human readable string format.
     * @param deviceName - Device name
     * @returns Download speed in human readable string format
     */
    getDownloadSpeedText(deviceName: string): string {
        return this.getViewModelField(deviceName, "downSpeed", "");
    }

    /**
     * Get total speed in human readable string format.
     * @param deviceName - Device name
     * @returns Total speed in human readable string format
     */
    getTotalSpeedText(deviceName: string): string {
        return this.getViewModelField(deviceName, "totalSpeed", "");
    }

    /**
     * Get total data usage in human readable string format.
     * @param deviceName - Device name
     * @returns Total data usage in human readable string format
     */
    getTotalDataUsageText(deviceName: string): string {
        return this.getViewModelField(deviceName, "totalData", "");
    }

    /** Device methods */
    /**
     * Check if a device is present.
     * @param deviceName - Device name
     * @returns true if device is present
     */
    hasDevice(deviceName: string): boolean {
        return this._deviceMonitor.hasDevice(deviceName);
    }

    /**
     * Get active device name.
     * @returns Active device name
     */
    getActiveDeviceName(): string {
        return this._deviceMonitor.getActiveDeviceName();
    }

    /**
     * Get all devices/interfaces info.
     * @returns All devices/interfaces info
     */
    getDevices(): Record<string, DeviceInfo> {
        return this._deviceMonitor.getDevices();
    }

    /**
     * Return time delta in milliseconds since last call.
     * @returns Time delta in milliseconds
     */
    getTimeDelta(): number {
        const newTime = GLib.get_monotonic_time() / 1000;
        const timeDelta = newTime - (this._lastTime || newTime) + 1;
        this._lastTime = newTime;
        return timeDelta;
    }

    /**
     * Update the stats for all devices from NetworkMonitor to the view model.
     * ViewModel is used by UI for displaying the stats.
     * @param bytesMode - If true, stats are in bytes, else in bits
     */
    update(bytesMode: boolean = true): void {
        const { error, deviceLogs } = this._networkMonitor.getStats();
        const timeDelta = this.getTimeDelta() / 1000;

        if (!error) {
            const stats: Record<string, DeviceStats> = {};
            const statsText: Record<string, DeviceViewModel> = {};
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

                    // Compute the view model for the device if it should be displayed
                    if (this.shouldDisplayDevice(device)) {
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
                    }
                }
            }
            this._stats = stats;
            this._statsViewModel = statsText;
        } else {
            this._logger.debug(error);
        }
    }

    /**
     * Check if the device should be displayed in the popup menu.
     * @param device - Network device
     * @returns true if the device should be displayed
     */
    shouldDisplayDevice(device: DeviceInfo): boolean {
        const { devicesListType } = this._appSettingsModel;
        switch (devicesListType) {
            case DevicesListType.ALL:
                return true;
            case DevicesListType.ACTIVE:
                return device.active;
            case DevicesListType.METERED:
                return device.metered;
            case DevicesListType.PREFERED:
                return device.name === this._appSettingsModel.preferedDeviceName;
            case DevicesListType.NON_DUMMY:
                return !device.dummy;
            default:
                return false;
        }
    }

    /**
     * Save the stats for all devices.
     * It updates the stats in memory and also in the settings.
     */
    saveStats(): void {
        const devicesInfo = { ...this._appSettingsModel.devicesInfoMap };
        const deviceLogs = this.getStats();
        for (const [name, stat] of Object.entries(deviceLogs)) {
            devicesInfo[name].totalUpload = stat.totalUpload;
            devicesInfo[name].totalDownload = stat.totalDownload;
        }
        this._appSettingsModel.devicesInfoMap = devicesInfo;
    }

    /**
     * Initialize the stats for a new device.
     * It saves the new device stats in memory and also in the settings.
     */
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

    /**
     * Reset the stats for a specific device.
     * It updates the stats in memory and also in the settings.
     */
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

    /**
     * Reset all devices stats. Remove all the devices which are not active.
     * It updates the stats in memory and also in the settings.
     */
    resetAll(): void {
        const now = new Date();
        const nowStr = now.toString();
        this._logger.info(`Restting all devices at ${nowStr}`);
        const oldInfoMap = this._appSettingsModel.devicesInfoMap;
        const newInfoMap: Record<string, DeviceReading> = {};
        for (const name in this._stats) {
            this._stats[name] = {
                ...this._stats[name],
                resetedAt: now,
                totalDownload: 0,
                totalUpload: 0
            };
            newInfoMap[name] = {
                ...oldInfoMap[name],
                resetedAt: nowStr,
                totalDownload: 0,
                totalUpload: 0
            };
        }
        this._appSettingsModel.devicesInfoMap = newInfoMap;
    }
}
