const Mainloop = imports.mainloop;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const { appView } = Me.imports.ui.AppView;
const { logger } = Me.imports.utils.Logger;
const { DeviceModel } = Me.imports.net.DeviceModel;
const { appSettingsModel } = Me.imports.AppSettingsModel;

const { DisplayMode } = Me.imports.utils.Constants;
const { bytesSpeedToString } = Me.imports.utils.GenUtils;
const { bytesToString } = Me.imports.utils.GenUtils;
const { getNextResetTime } = Me.imports.utils.DateTimeUtils;
const { titleClickedMessageBroadcaster } = Me.imports.utils.EventBroadcaster;

const kOneMinuteInMilliSeconds = 60 * 1000;

/*
* AppControlller class responsible for running timers,
* refreshing view and pushing model updates to UI.
*/

class AppController {

    constructor() {
        this._refreshTimeout = undefined;
        this._minuteTimeout = undefined;
        this._rightClickSubscribeHandle = undefined;
        this._settingsSubscribeHandle = undefined;
        this._deviceModel = new DeviceModel();
    }

    init() {
        appSettingsModel.init();
        // TODO: remove update() call from here and move device reset time to DeviceMonitor.
        this.update();
        this.resetIfRequired();
        this._rightClickSubscribeHandle = this.onRightClick.bind(this);
        titleClickedMessageBroadcaster.subscribe(this._rightClickSubscribeHandle);
        this._settingsSubscribeHandle = this.onSettingChanged.bind(this);
        appSettingsModel.subscribe(this._settingsSubscribeHandle);
        this.installTimers();
    }

    deinit() {
        titleClickedMessageBroadcaster.unsubscribe(this._rightClickSubscribeHandle);
        this._rightClickSubscribeHandle = undefined;
        appSettingsModel.unsubscribe(this._settingsSubscribeHandle);
        this._settingsSubscribeHandle = undefined;
        appSettingsModel.deinit();
        this.uninstallTimers();
    }

    installTimers() {
        const { refreshInterval } = appSettingsModel;
        this._refreshTimeout = Mainloop.timeout_add(refreshInterval, this.onRefreshTimeout.bind(this));
        this._minuteTimeout = Mainloop.timeout_add(kOneMinuteInMilliSeconds, this.onEveryMinute.bind(this));
    }

    uninstallTimers() {
        if (this._refreshTimeout) {
            Mainloop.source_remove(this._refreshTimeout);
            this._refreshTimeout = undefined;
        }
        if (this._minuteTimeout) {
            Mainloop.source_remove(this._minuteTimeout);
            this._minuteTimeout = undefined;
        }
    }

    show() {
        appView.show();
    }

    hide() {
        appView.hide();
    }

    _getActiveDeviceName() {
        const userPreferedDevice = appSettingsModel.preferedDeviceName;
        if (this._deviceModel.hasDevice(userPreferedDevice)) {
            return userPreferedDevice;
        }
        return this._deviceModel.getActiveDeviceName();
    }

    update() {
        const { displayMode, refreshInterval } = appSettingsModel;
        //logger.debug(`displayMode : ${displayMode}`);
        this._deviceModel.update(refreshInterval);
        const activeDevice = this._getActiveDeviceName();
        //logger.debug(`activeDevice: ${activeDevice}`);
        let titleStr = "----";
        switch(displayMode) {
            case DisplayMode.TOTAL_SPEED:
            {
                const totalSpeed = this._deviceModel.getTotalSpeed(activeDevice);
                const totalSpeedStr = bytesSpeedToString(totalSpeed);
                titleStr = `↕ ${totalSpeedStr}`;
                break;
            }
            case DisplayMode.DOWNLOAD_SPEED:
            {
                const download = this._deviceModel.getDownloadSpeed(activeDevice);
                const downloadStr = bytesSpeedToString(download);
                titleStr = `↓ ${downloadStr}`;
                break;
            }
            case DisplayMode.UPLOAD_SPEED:
            {
                const upload = this._deviceModel.getUploadSpeed(activeDevice);
                const uploadStr = bytesSpeedToString(upload);
                titleStr = `↑ ${uploadStr}`;
                break;
            }
            case DisplayMode.BOTH_SPEED:
            {
                const download = this._deviceModel.getDownloadSpeed(activeDevice);
                const downloadStr = bytesSpeedToString(download);
                const upload = this._deviceModel.getUploadSpeed(activeDevice);
                const uploadStr = bytesSpeedToString(upload);
                titleStr = `↓ ${downloadStr} ↑ ${uploadStr}`;
                break;
            }
            case DisplayMode.TOTAL_DATA:
            {
                const totalData = this._deviceModel.getTotalDataUsage(activeDevice);
                const totalDataStr = bytesToString(totalData);
                titleStr = `Σ ${totalDataStr}`;
                break;
            }
        }
        appView.setTitleText(titleStr);
        appView.update(this._deviceModel);

        // Debugging
        // const upload = this._deviceModel.getUploadSpeed(activeDevice);
        // const download = this._deviceModel.getDownloadSpeed(activeDevice);
        // const totalData = this._deviceModel.getTotalDataUsage(activeDevice);
        // logger.debug(`upload: ${upload} download: ${download} totalData: ${totalData}`);
        // const uploadStr = bytesSpeedToString(upload);
        // const downloadStr = bytesSpeedToString(download);
        // const totalDataStr = bytesToString(totalData);
        // logger.debug(`deviceName: ${activeDevice} upload: ${uploadStr} download: ${downloadStr} totalData: ${totalDataStr}`);
    }

    resetIfRequired() {
        const now = new Date();
        const activeDevice = this._getActiveDeviceName();
        const lastResetedAt = appSettingsModel.getLastResetDateTime(activeDevice);
        const newResetTime = getNextResetTime(lastResetedAt, appSettingsModel);
        //logger.log(`oldResetTime: ${lastResetedAt}`);
        //logger.log(`newResetTime: ${newResetTime}`);
        if (now.getTime() >= newResetTime.getTime()) {
            // crossed the mark, Time to reset network stats
            this._deviceModel.resetAll();
        }
    }

    // #region Event handlers
    onRefreshTimeout() {
        //logger.debug("tick");
        try {
            this.update();
        } catch(err) {
            logger.error(`ERROR: ${err.toString()} TRACE: ${err.stack}`);
        }
        return true;
    }

    onEveryMinute() {
        //logger.debug("every 1 minutes");
        try {
            this.resetIfRequired();
        } catch(err) {
            logger.error(`ERROR: ${err.toString()} TRACE: ${err.stack}`);
        }
        return true;
    }

    onSettingChanged() {
        this.uninstallTimers();
        this.installTimers();
    }

    onRightClick({button}) {
        if (button === "right") {
            // cycle through the modes
            let { displayMode } = appSettingsModel;
            switch(displayMode) {
                default:
                case DisplayMode.TOTAL_SPEED:
                {
                    displayMode = DisplayMode.DOWNLOAD_SPEED;
                    break;
                }
                case DisplayMode.DOWNLOAD_SPEED:
                {
                    displayMode = DisplayMode.UPLOAD_SPEED;
                    break;
                }
                case DisplayMode.UPLOAD_SPEED:
                {
                    displayMode = DisplayMode.BOTH_SPEED;
                    break;
                }
                case DisplayMode.BOTH_SPEED:
                {
                    displayMode = DisplayMode.TOTAL_DATA;
                    break;
                }
                case DisplayMode.TOTAL_DATA:
                {
                    displayMode = DisplayMode.TOTAL_SPEED;
                    break;
                }
            }
            appSettingsModel.displayMode = displayMode;
            this.update();
        }
    }
    // #endregion Event handlers
}

var appController = new AppController;