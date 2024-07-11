
import { DayOfWeek, DisplayMode, ResetSchedule, SettingKeys } from "./utils/Constants.js";
import { kRefreshInterval, kSchemaName } from "./utils/Constants.js";
import { compareJsonStrings } from "./utils/GenUtils.js";
import { getExtension } from "./extension.js";

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

/*
* AppSettingsModel represents application setttings and user prefrences.
*/
export class AppSettingsModel {

    constructor(logger) {
        this._logger = logger;
        this._schema = undefined;
        this._settingListeners = [];
        this._refreshInterval = kRefreshInterval;
        this._displayMode = DisplayMode.DEFAULT;
        this._resetSchedule = ResetSchedule.DAILY;
        this._resetDayOfWeek = DayOfWeek.MONDAY;
        this._resetDayOfMonth = 1;
        this._resetHours = 0;
        this._resetMinutes = 0;
        this._preferedDeviceName = undefined;
        this._devicesInfoMap = {};
        this._displayBytes = true;
        this._showIcon = true;
    }

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
        if (this._settingsC) {
            this.settings.disconnect(this._settingsC);
            this._settingsC = undefined;
        }
    }

    get settings() {
        if (!this._schema) {
            this._schema = getExtension().getSettings(kSchemaName);
        }
        return this._schema;
    }

    load() {
        this._refreshInterval = this.settings.get_int(SettingKeys.REFRESH_INTERVAL);
        this._displayMode = this.settings.get_string(SettingKeys.DISPLAY_MODE);
        this._resetSchedule = this.settings.get_string(SettingKeys.RESET_SCHEDULE);
        this._resetDayOfWeek = this.settings.get_string(SettingKeys.RESET_WEEK_DAY);
        this._resetDayOfMonth = this.settings.get_int(SettingKeys.RESET_MONTH_DAY);
        this._resetHours = this.settings.get_int(SettingKeys.RESET_HOURS);
        this._resetMinutes = this.settings.get_int(SettingKeys.RESET_MINUTES);
        const str = this.settings.get_string(SettingKeys.DEVICES_INFO);
        this._devicesInfoMap = JSON.parse(str);
        this._preferedDeviceName = this.settings.get_string(SettingKeys.PREFERED_DEVICE);
        this._displayBytes = this.settings.get_boolean(SettingKeys.DISPLAY_BYTES);
        this._showIcon = this.settings.get_boolean(SettingKeys.SHOW_ICON);
        // this._logger.debug(`new values [ refreshInterval: ${this._refreshInterval} displayMode: ${this._displayMode} resetTime: ${this._resetHours} : ${this._resetMinutes}]`);
        // this._logger.debug(`deivicesInfoMap ${str}`);
    }

    save() {
        // write back the changed values.
        if (this.settings.get_string(SettingKeys.DISPLAY_MODE) !== this._displayMode) {
            this.settings.set_string(SettingKeys.DISPLAY_MODE, this._displayMode);
        }

        if (this.settings.get_string(SettingKeys.PREFERED_DEVICE) !== this._preferedDeviceName) {
            this.settings.set_string(SettingKeys.PREFERED_DEVICE, this._preferedDeviceName);
        }
        const devicesJson = JSON.stringify(this._devicesInfoMap);
        //this._logger.info("devicesInfoMap", devicesJson);
        if (!compareJsonStrings(this.settings.get_string(SettingKeys.DEVICES_INFO), devicesJson)) {
            this.settings.set_string(SettingKeys.DEVICES_INFO, devicesJson);
        }
        if (this.settings.get_boolean(SettingKeys.DISPLAY_BYTES) !== this._displayBytes) {
            this.settings.set_boolean(SettingKeys.DISPLAY_BYTES, this._displayBytes);
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

    get preferedDeviceName() {
        return this._preferedDeviceName;
    }

    set preferedDeviceName(deviceName) {
        this._preferedDeviceName = deviceName;
        this.save();
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

    get showIcon() {
        return this._showIcon;
    }

    getResetTime() {
        const date = new Date();
        date.setHours(this._resetHours);
        date.setMinutes(this._resetMinutes);
        date.setSeconds(0);
        return date;
    }

    getLastResetDateTime(deviceName) {
        const { resetedAt } = this.getDeviceInfo(deviceName);
        let lastResetedAt = undefined;
        if (resetedAt) {
            lastResetedAt = new Date(resetedAt);
        }
        return lastResetedAt;
    }

    get devicesInfoMap() {
        return this._devicesInfoMap;
    }

    set devicesInfoMap(info) {
        this._devicesInfoMap = { ...this._devicesInfoMap, ...info };
        this.save();
    }

    getDeviceInfo(name) {
        return this._devicesInfoMap[name] || {};
    }

    replaceDeviceInfo(name, info) {
        this._devicesInfoMap[name] = info;
        this.save();
    }

    updateDeviceInfo(name, info) {
        this._devicesInfoMap[name] = { ...this.devicesInfoMap[name], ...info };
        this.save();
    }

    notifyListerners() {
        for (const listener of this._settingListeners) {
            listener();
        }
    }

    subscribe(listener) {
        this._settingListeners.push(listener);
        return listener;
    }

    unsubscribe(listener) {
        const index = this._settingListeners.indexOf(listener);
        if (index != -1) {
            this._settingListeners.splice(index, 1);
        }
        return listener;
    }
}
