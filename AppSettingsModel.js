const { Gio, GObject } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { logger } = Me.imports.utils.Logger;
const { DisplayMode } = Me.imports.utils.Constants;
const { SettingKeys } = Me.imports.utils.Constants;
const { compareJsonStrings } = Me.imports.utils.GenUtils;

const kRefreshInterval = 2 * 1000; // milliseconds
const kSchemaName = "org.gnome.shell.extensions.network-stats";


/*
* AppSettingsModel represents application setttings and user prefrences.
*/
class AppSettingsModel {

    constructor() {
        this._schema = undefined;
        this._settingListeners = [];
        this._resetHours = 0;
        this._resetMinutes = 0;
        this._refreshInterval = kRefreshInterval;
        this._displayMode = DisplayMode.DEFAULT;
        this._preferedDeviceName = undefined;
        this._devicesInfoMap = {};
    }

    init() {
        this.load();
        this._settingsC = this.schema.connect("changed", () => {
            // setting changed - get the new values
            logger.info("Prefrences/Settings value changed");
            this.load();
            this.notifyListerners();
        });
    }

    deinit() {
        if (this._settingsC) {
            this.schema.disconnect(this._settingsC);
            this._settingsC = undefined;
        }
    }

    get schema() {
        if (!this._schema) {
            const schemaDir = Me.dir.get_child('schemas').get_path();
            const schemaSource = Gio.SettingsSchemaSource.new_from_directory(schemaDir, Gio.SettingsSchemaSource.get_default(), false);
            const schema = schemaSource.lookup(kSchemaName, false);
            this._schema = new Gio.Settings({ settings_schema: schema });
        }
        return this._schema;
    }

    load() {
        this._refreshInterval = this.schema.get_int(SettingKeys.REFRESH_INTERVAL);
        this._displayMode = this.schema.get_string(SettingKeys.DISPLAY_MODE);
        this._resetHours = this.schema.get_int(SettingKeys.RESET_HOURS);
        this._resetMinutes = this.schema.get_int(SettingKeys.RESET_MINUTES);
        const str = this.schema.get_string(SettingKeys.DEVICES_INFO);
        this._devicesInfoMap = JSON.parse(str);
        this._preferedDeviceName = this.schema.get_string(SettingKeys.PREFERED_DEVICE);
        // logger.debug(`new values [ refreshInterval: ${this._refreshInterval} displayMode: ${this._displayMode} resetTime: ${this._resetHours} : ${this._resetMinutes}]`);
        // logger.debug(`deivicesInfoMap ${str}`);
    }

    save() {
        // write back the changed values.
        if (this.schema.get_string(SettingKeys.DISPLAY_MODE) !== this._displayMode) {
            this.schema.set_string(SettingKeys.DISPLAY_MODE, this._displayMode);
        }
        if (this.schema.get_string(SettingKeys.PREFERED_DEVICE) !== this._preferedDeviceName) {
            this.schema.set_string(SettingKeys.PREFERED_DEVICE, this._preferedDeviceName);
        }
        const devicesJson = JSON.stringify(this._devicesInfoMap);
        if (!compareJsonStrings(this.schema.get_string(SettingKeys.DEVICES_INFO), devicesJson)) {
            this.schema.set_string(SettingKeys.DEVICES_INFO, devicesJson);
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

    getResetTime() {
        const date = new Date();
        date.setHours(this._resetHours);
        date.setMinutes(this._resetMinutes);
        date.setSeconds(0);
        return date;
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
    }

    unsubscribe(listener) {
        const index = this._settingListeners.indexOf(listener);
        if (index != -1) {
            this._settingListeners.splice(index, 1);
        }
    }
}

var appSettingsModel = new AppSettingsModel;