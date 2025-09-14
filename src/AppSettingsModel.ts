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

    get refreshInterval() {
        return this._refreshInterval || kRefreshInterval;
    }

    get displayMode() {
        return this._displayMode || DisplayMode.DEFAULT;
    }

    set displayMode(mode) {
        this._displayMode = mode;
        this.save();
    }

    get preferedDeviceName(): string | undefined {
        return this._preferedDeviceName;
    }

    set preferedDeviceName(deviceName: string) {
        this._preferedDeviceName = deviceName;
        this.save();
    }

    get devicesListType(): DevicesListType {
        return this._devicesListType || DevicesListType.ALL;
    }

    get resetSchedule() {
        return this._resetSchedule;
    }

    get resetDayOfWeek() {
        return this._resetDayOfWeek;
    }

    get resetDayOfMonth() {
        return this._resetDayOfMonth;
    }

    get resetHours() {
        return this._resetHours;
    }

    get resetMinutes() {
        return this._resetMinutes;
    }

    get displayBytes() {
        return this._displayBytes;
    }

    get statusShowIcon() {
        return this._statusShowIcon;
    }

    get resetAllStats() {
        return this._resetAllStats;
    }

    clearResetAllStats() {
        this._resetAllStats = false;
        this.save();
    }

    getResetTime() {
        const date = new Date();
        date.setHours(this._resetHours);
        date.setMinutes(this._resetMinutes);
        date.setSeconds(0);
        return date;
    }

    getLastResetDateTime(deviceName: string): Date | undefined {
        const { resetedAt } = this.getDeviceInfo(deviceName);
        let lastResetedAt: Date | undefined = undefined;
        if (resetedAt) {
            lastResetedAt = new Date(resetedAt);
        }
        return lastResetedAt;
    }

    get devicesInfoMap(): DevicesInfoMap {
        return this._devicesInfoMap;
    }

    set devicesInfoMap(info: DevicesInfoMap) {
        this._devicesInfoMap = { ...this._devicesInfoMap, ...info };
        this.save();
    }

    get statusFontSize() {
        return this._statusFontSize;
    }

    getDeviceInfo(name: string) {
        return this._devicesInfoMap[name] || {};
    }

    replaceDeviceInfo(name: string, info: DeviceReading) {
        this._devicesInfoMap[name] = info;
        this.save();
    }

    updateDeviceInfo(name: string, info: DeviceReading) {
        this._devicesInfoMap[name] = { ...this.devicesInfoMap[name], ...info };
        this.save();
    }

    // pub-sub
    notifyListerners() {
        for (const listener of this._settingListeners) {
            listener();
        }
    }

    subscribe(listener: ListenerFunc) {
        this._settingListeners.push(listener);
        return listener;
    }

    unsubscribe(listener: ListenerFunc) {
        const index = this._settingListeners.indexOf(listener);
        if (index != -1) {
            this._settingListeners.splice(index, 1);
        }
        return listener;
    }
}
