import Gio from "gi://Gio";
import {
    DayOfWeek,
    DevicesListType,
    DisplayMode,
    ResetSchedule,
    SettingKeys
} from "./utils/Constants.js";
import { kRefreshInterval, kSchemaName } from "./utils/Constants.js";
import { compareJsonStrings } from "./utils/GenUtils.js";
import { getExtension } from "../extension.js";
import type { Logger } from "./utils/Logger.ts";
import type { DeviceReading } from "./net/DevicePresenter.js";

/**
 * DevicesInfoMap
 * {
 *      "enp0s3": {
 *          "initialReading":8850276,
 *          "totalUpload": 12,
 *          "totalDownload": 23,
 *          "resetedAt":"Sat Nov 26 2022 10:32:41 GMT+0530 (India Standard Time)"
 *       }
 * }
 */

export type DevicesInfoMap = Record<string, DeviceReading>;

export type ListenerFunc = () => void;

/*
 * AppSettingsModel represents application setttings and user prefrences.
 */
export class AppSettingsModel {
    private _schema: Gio.Settings | undefined;
    private _settingsC: number | undefined;
    private _settingListeners: ListenerFunc[] = [];
    private _refreshInterval = kRefreshInterval;
    private _displayMode = DisplayMode.DEFAULT;
    private _devicesListType = DevicesListType.DEFAULT;
    private _resetSchedule = ResetSchedule.DAILY;
    private _resetDayOfWeek = DayOfWeek.MONDAY;
    private _resetDayOfMonth = 1;
    private _resetHours = 0;
    private _resetMinutes = 0;
    private _preferedDeviceName: string | undefined = undefined;
    private _devicesInfoMap: DevicesInfoMap = {};
    private _statusFontSize = 16;
    private _displayBytes = true;
    private _statusShowIcon = true;
    private _resetAllStats = false;

    constructor(private _logger: Logger) {}

    init() {
        this.load();
        this._settingsC = this.settings.connect("changed", () => {
            // setting changed - get the new values
            this._logger.info("Prefrences/Settings value changed");
            this.load();
            this.notifyListerners();
        });
    }

    deinit() {
        if (this._settingsC !== undefined) {
            this.settings.disconnect(this._settingsC);
            this._settingsC = undefined;
        }
    }

    get settings(): Gio.Settings {
        if (!this._schema) {
            this._schema = getExtension().getSettings(kSchemaName);
        }
        return this._schema;
    }

    /**
     * Loads all the setting values
     */
    load() {
        this._refreshInterval = this.settings.get_int(SettingKeys.REFRESH_INTERVAL);
        this._displayMode = this.settings.get_string(SettingKeys.DISPLAY_MODE) as DisplayMode;
        this._devicesListType = this.settings.get_string(
            SettingKeys.DEVICES_LIST_TYPE
        ) as DevicesListType;
        this._resetSchedule = this.settings.get_string(SettingKeys.RESET_SCHEDULE) as ResetSchedule;
        this._resetDayOfWeek = this.settings.get_string(SettingKeys.RESET_WEEK_DAY) as DayOfWeek;
        this._resetDayOfMonth = this.settings.get_int(SettingKeys.RESET_MONTH_DAY);
        this._resetHours = this.settings.get_int(SettingKeys.RESET_HOURS);
        this._resetMinutes = this.settings.get_int(SettingKeys.RESET_MINUTES);
        const str = this.settings.get_string(SettingKeys.DEVICES_INFO);
        this._devicesInfoMap = JSON.parse(str);
        this._preferedDeviceName = this.settings.get_string(SettingKeys.PREFERED_DEVICE);
        this._displayBytes = this.settings.get_boolean(SettingKeys.DISPLAY_BYTES);
        this._statusFontSize = this.settings.get_int(SettingKeys.STATUS_FONT_SIZE);
        this._statusShowIcon = this.settings.get_boolean(SettingKeys.STATUS_SHOW_ICON);
        this._resetAllStats = this.settings.get_boolean(SettingKeys.RESET_ALL_STATS);
        // this._logger.debug(`new values [ refreshInterval: ${this._refreshInterval} displayMode: ${this._displayMode} resetTime: ${this._resetHours} : ${this._resetMinutes}]`);
        // this._logger.debug(`deivicesInfoMap ${str}`);
    }

    /**
     * Save/Write all the setting values
     */
    save() {
        // write back the changed values.
        if (this.settings.get_string(SettingKeys.DISPLAY_MODE) !== this._displayMode) {
            this.settings.set_string(SettingKeys.DISPLAY_MODE, this._displayMode);
        }

        if (this.settings.get_string(SettingKeys.PREFERED_DEVICE) !== this._preferedDeviceName) {
            this.settings.set_string(SettingKeys.PREFERED_DEVICE, this._preferedDeviceName ?? "");
        }
        const devicesJson = JSON.stringify(this._devicesInfoMap);
        //this._logger.info("devicesInfoMap", devicesJson);
        if (!compareJsonStrings(this.settings.get_string(SettingKeys.DEVICES_INFO), devicesJson)) {
            this.settings.set_string(SettingKeys.DEVICES_INFO, devicesJson);
        }
        if (this.settings.get_boolean(SettingKeys.RESET_ALL_STATS) !== this._resetAllStats) {
            this.settings.set_boolean(SettingKeys.RESET_ALL_STATS, this._resetAllStats);
        }
    }

    /**
     * Returns the refresh interval in milliseconds.
     */
    get refreshInterval() {
        return this._refreshInterval || kRefreshInterval;
    }

    /**
     * Returns the display mode @see DisplayMode
     */
    get displayMode() {
        return this._displayMode || DisplayMode.DEFAULT;
    }

    /**
     * Sets the display mode @see DisplayMode
     */
    set displayMode(mode) {
        this._displayMode = mode;
        this.save();
    }

    /**
     * Returns the prefered device name.
     */
    get preferedDeviceName(): string | undefined {
        return this._preferedDeviceName;
    }

    /**
     * Sets the prefered device name.
     */
    set preferedDeviceName(deviceName: string) {
        this._preferedDeviceName = deviceName;
        this.save();
    }

    /**
     * Returns the devices list type @see DevicesListType
     */
    get devicesListType(): DevicesListType {
        return this._devicesListType || DevicesListType.ALL;
    }

    /**
     * Returns the reset schedule @see ResetSchedule
     */
    get resetSchedule() {
        return this._resetSchedule;
    }

    /**
     * Returns the day of week when we want to reset the network stats.
     */
    get resetDayOfWeek() {
        return this._resetDayOfWeek;
    }

    /**
     * Returns the day of month when we want to reset the network stats.
     */
    get resetDayOfMonth() {
        return this._resetDayOfMonth;
    }

    /**
     * Returns the hours when we want to reset the network stats.
     */
    get resetHours() {
        return this._resetHours;
    }

    /**
     * Returns the minutes when we want to reset the network stats.
     */
    get resetMinutes() {
        return this._resetMinutes;
    }

    /**
     * Returns true if we want to display bytes instead of bits.
     */
    get displayBytes() {
        return this._displayBytes;
    }

    /**
     * Returns true if we want to show speed icon in the status bar
     */
    get statusShowIcon() {
        return this._statusShowIcon;
    }

    /**
     * Returns true if we want to reset all stats.
     * This value is set from the reset-all-stats button in the settings.
     * After reset, this value is cleared using clearResetAllStats() method.
     */
    get resetAllStats() {
        return this._resetAllStats;
    }

    /**
     * Clears the reset all stats flag.
     * This is called after the stats are reset.
     */
    clearResetAllStats() {
        this._resetAllStats = false;
        this.save();
    }

    /**
     * Returns the reset time based on the reset schedule.
     */
    getResetTime() {
        const date = new Date();
        date.setHours(this._resetHours);
        date.setMinutes(this._resetMinutes);
        date.setSeconds(0);
        return date;
    }

    /**
     * Returns the last reset time for the given device.
     */
    getLastResetDateTime(deviceName: string): Date | undefined {
        const { resetedAt } = this.getDeviceInfo(deviceName);
        let lastResetedAt: Date | undefined = undefined;
        if (resetedAt) {
            lastResetedAt = new Date(resetedAt);
        }
        return lastResetedAt;
    }

    /**
     * Returns the devices info map.
     */
    get devicesInfoMap(): DevicesInfoMap {
        return this._devicesInfoMap;
    }

    /**
     * Sets the devices info map.
     */
    set devicesInfoMap(info: DevicesInfoMap) {
        this._devicesInfoMap = { ...this._devicesInfoMap, ...info };
        this.save();
    }

    /**
     * Returns the status bar label font size.
     * This label shows the total speed, download, upload, total data etc...
     */
    get statusFontSize() {
        return this._statusFontSize;
    }

    /**
     * Returns the device info for the given device name.
     */
    getDeviceInfo(name: string) {
        return this._devicesInfoMap[name] || {};
    }

    /**
     * Replaces the device info for the given device name.
     */
    replaceDeviceInfo(name: string, info: DeviceReading) {
        this._devicesInfoMap[name] = info;
        this.save();
    }

    /**
     * Updates the device info for the given device name.
     */
    updateDeviceInfo(name: string, info: DeviceReading) {
        this._devicesInfoMap[name] = { ...this.devicesInfoMap[name], ...info };
        this.save();
    }

    /**
     * Notifies all the listeners about the setting change.
     */
    notifyListerners() {
        for (const listener of this._settingListeners) {
            listener();
        }
    }

    /**
     * Subscribes to the setting change events.
     */
    subscribe(listener: ListenerFunc) {
        this._settingListeners.push(listener);
        return listener;
    }

    /**
     * Unsubscribes from the setting change events.
     */
    unsubscribe(listener: ListenerFunc) {
        const index = this._settingListeners.indexOf(listener);
        if (index != -1) {
            this._settingListeners.splice(index, 1);
        }
        return listener;
    }
}
