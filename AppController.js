const Mainloop = imports.mainloop;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const { appView } = Me.imports.ui.AppView;
const { logger } = Me.imports.utils.Logger;
const { deviceModel } = Me.imports.net.DeviceModel;
const { deviceMonitor } = Me.imports.net.DeviceMonitor;
const { appSettingsModel } = Me.imports.AppSettingsModel;

const { DisplayMode } = Me.imports.utils.Constants;
const { bytesSpeedToString } = Me.imports.utils.GenUtils;
const { bytesToString } = Me.imports.utils.GenUtils;
const { titleClickedMessageBroadcaster } = Me.imports.utils.EventBroadcaster;

const kMinuteTime = 60 * 1000;

/*
* AppControlller class responsible for running timers, refreshing view and pushing model updates to UI.
*/

class AppController {

    constructor() {
        this._refreshTimeout = undefined;
        this._resetTimeout = undefined;
        this._rightClickSubscribeHandle = undefined;
        this._settingsSubscribeHandle = undefined;
    }

    init() {
        appSettingsModel.init();
        // TODO: remove refresh call from here and move device reset time to DeviceMonitor.
        this.refresh();
        this.resetDevices();
        this._rightClickSubscribeHandle = this.onRightClick.bind(this);
        titleClickedMessageBroadcaster.subscribe(this._rightClickSubscribeHandle);
        this._settingsSubscribeHandle = this.onSettingChanged.bind(this);
        appSettingsModel.subscribe(this._settingsSubscribeHandle);
        this.installTimers();
    }

    deinit() {
        titleClickedMessageBroadcaster.unsubscribe(this._rightClickSubscribeHandle);
        appSettingsModel.unsubscribe(this._settingsSubscribeHandle);
        appSettingsModel.deinit();
    }

    installTimers() {
        const { refreshInterval } = appSettingsModel;
        this._refreshTimeout = Mainloop.timeout_add(refreshInterval, this.onRefreshTimeout.bind(this));
        this._resetTimeout = Mainloop.timeout_add(kMinuteTime, this.onEveryMinute.bind(this));
    }

    uninstallTimers() {
        if (this._refreshTimeout) {
            Mainloop.source_remove(this._refreshTimeout);
            this._refreshTimeout = undefined;
        }
        if (this._resetTimeout) {
            Mainloop.source_remove(this._resetTimeout);
            this._resetTimeout = undefined;
        }
    }

    show() {
        appView.show();
    }

    hide() {
        appView.hide();
    }

    refresh() {
        const { displayMode, refreshInterval } = appSettingsModel;
        //logger.debug(`displayMode : ${displayMode}`);
        deviceModel.update(refreshInterval);
        const activeDevice = deviceMonitor.getActiveDeviceName();
        let titleStr = "----";
        switch(displayMode) {
            case DisplayMode.TOTAL_SPEED:
            {
                const totalSpeed = deviceModel.getTotalSpeed(activeDevice);
                const totalSpeedStr = bytesSpeedToString(totalSpeed);
                titleStr = `↕ ${totalSpeedStr}`;
                break;
            }
            case DisplayMode.DOWNLOAD_SPEED:
            {
                const download = deviceModel.getDownloadSpeed(activeDevice);
                const downloadStr = bytesSpeedToString(download);
                titleStr = `↓ ${downloadStr}`;
                break;
            }
            case DisplayMode.UPLOAD_SPEED:
            {
                const upload = deviceModel.getUploadSpeed(activeDevice);
                const uploadStr = bytesSpeedToString(upload);
                titleStr = `↑ ${uploadStr}`;
                break;
            }
            case DisplayMode.TOTAL_DATA:
            {
                const totalData = deviceModel.getTotalDataUsage(activeDevice);
                const totalDataStr = bytesToString(totalData);
                titleStr = `Σ ${totalDataStr}`;
                break;
            }
        }
        appView.setTitleText(titleStr);
        appView.update(deviceModel);

        // Debugging
        // const upload = deviceModel.getUploadSpeed(activeDevice);
        // const download = deviceModel.getDownloadSpeed(activeDevice);
        // const totalData = deviceModel.getTotalDataUsage(activeDevice);
        // logger.debug(`upload: ${upload} download: ${download} totalData: ${totalData}`);
        // const uploadStr = bytesSpeedToString(upload);
        // const downloadStr = bytesSpeedToString(download);
        // const totalDataStr = bytesToString(totalData);
        // logger.debug(`deviceName: ${activeDevice} upload: ${uploadStr} download: ${downloadStr} totalData: ${totalDataStr}`);
    }

    resetDevices() {
        const now = new Date();
        const resetTime = appSettingsModel.getResetTime();
        const activeDevice = deviceMonitor.getActiveDeviceName();
        const { resetedAt } = appSettingsModel.getDeviceInfo(activeDevice);
        //logger.debug(typeof resetedAt);
        let deviceResetedAt = new Date(resetTime.getTime() - 1000);
        if (resetedAt) {
            deviceResetedAt = new Date(resetedAt);
        }

        // logger.debug(`now:             ${now.toString()}`);
        // logger.debug(`resetTime:       ${resetTime.toString()}`);
        // logger.debug(`deviceResetedAt: ${deviceResetedAt.toString()}`);

        if (now.getTime() >= resetTime.getTime() &&
            deviceResetedAt.getTime() < resetTime.getTime()) {
            deviceModel.resetAll();
        }
    }

    onRefreshTimeout() {
        //logger.debug("tick");
        try {
            this.refresh();
        } catch(err) {
            logger.error(`ERROR: ${err.toString()} TRACE: ${err.stack}`);
        }
        return true;
    }

    onEveryMinute() {
        //logger.debug("every 1 minutes");
        this.resetDevices();
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
            this.refresh();
        }
    }
}

var appController = new AppController;