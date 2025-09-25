import GLib from "gi://GLib";
import { AppView } from "./ui/AppView.js";
import { DisplayMode } from "./utils/Constants.js";
import { getNextResetTime } from "./utils/DateTimeUtils.js";
import { Broadcasters } from "./utils/Broadcasters.js";
import type { Logger } from "./utils/Logger.js";
import type { AppSettingsModel } from "./AppSettingsModel.js";
import type { DevicePresenter } from "./net/DevicePresenter.js";

const kOneMinuteInMilliSeconds = 60 * 1000;

/*
 * AppControlller class responsible for running timers,
 * refreshing view and pushing model updates to UI.
 */

export class AppController {
    private _appView: AppView;
    private _refreshTimeout?: number;
    private _minuteTimeout?: number;

    constructor(
        private _logger: Logger,
        private _appSettingsModel: AppSettingsModel,
        private _devicePresenter: DevicePresenter
    ) {
        this._appView = new AppView(_logger, _appSettingsModel);
    }

    /**
     * Initializes the app controller
     */
    init() {
        // TODO: remove update() call from here and move device reset time to DeviceMonitor.
        this.update();
        this.resetIfRequired();
        Broadcasters.titleClickedMessageBroadcaster?.subscribe(this.onRightClick);
        this._appSettingsModel.subscribe(this.onSettingChanged);
        this.installTimers();
        this._appView.setTitleTextSize(this._appSettingsModel.statusFontSize);
    }

    /**
     * Deinitializes the app controller
     */
    deinit() {
        Broadcasters.titleClickedMessageBroadcaster?.unsubscribe(this.onRightClick);
        this._appSettingsModel.unsubscribe(this.onSettingChanged);
        this._devicePresenter.saveStats();
        this._appSettingsModel.deinit();
        this.uninstallTimers();
    }

    /**
     * Installs the timers, refresh timer and minute timer.
     */
    installTimers() {
        const { refreshInterval } = this._appSettingsModel;
        this._refreshTimeout = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            refreshInterval,
            this.onRefreshTimeout
        );
        this._minuteTimeout = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            kOneMinuteInMilliSeconds,
            this.onEveryMinute
        );
    }

    /**
     * Uninstalls the timers, refresh timer and minute timer.
     */
    uninstallTimers() {
        if (this._refreshTimeout) {
            GLib.source_remove(this._refreshTimeout);
            this._refreshTimeout = undefined;
        }
        if (this._minuteTimeout) {
            GLib.source_remove(this._minuteTimeout);
            this._minuteTimeout = undefined;
        }
    }

    /**
     * Shows the app view
     */
    show() {
        this._appView.show();
    }

    /**
     * Hides the app view
     */
    hide() {
        this._appView.hide();
    }

    /**
     * Returns the active device name based on the user prefered device name.
     * If the user prefered device is not available, returns the active device name.
     */
    _getActiveDeviceName(): string {
        const userPreferedDevice = this._appSettingsModel.preferedDeviceName;
        if (userPreferedDevice && this._devicePresenter.hasDevice(userPreferedDevice)) {
            return userPreferedDevice;
        }
        return this._devicePresenter.getActiveDeviceName();
    }

    /**
     * Updates the app view with the updated view model from the device presenter.
     */
    update() {
        const { displayMode, displayBytes } = this._appSettingsModel;
        //this._logger.debug(`displayMode : ${displayMode}`);
        this._devicePresenter.update(displayBytes);
        const activeDevice = this._getActiveDeviceName();
        //this._logger.debug(`activeDevice: ${activeDevice}`);
        let titleStr = "----";
        switch (displayMode) {
            case DisplayMode.TOTAL_SPEED: {
                const totalSpeedStr = this._devicePresenter.getTotalSpeedText(activeDevice);
                titleStr = `↕ ${totalSpeedStr}`;
                break;
            }
            case DisplayMode.DOWNLOAD_SPEED: {
                const downloadStr = this._devicePresenter.getDownloadSpeedText(activeDevice);
                titleStr = `↓ ${downloadStr}`;
                break;
            }
            case DisplayMode.UPLOAD_SPEED: {
                const uploadStr = this._devicePresenter.getUploadSpeedText(activeDevice);
                titleStr = `↑ ${uploadStr}`;
                break;
            }
            case DisplayMode.BOTH_SPEED: {
                const downloadStr = this._devicePresenter.getDownloadSpeedText(activeDevice);
                const uploadStr = this._devicePresenter.getUploadSpeedText(activeDevice);
                titleStr = `↓ ${downloadStr} ↑ ${uploadStr}`;
                break;
            }
            case DisplayMode.TOTAL_DATA: {
                const totalDataStr = this._devicePresenter.getTotalDataUsageText(activeDevice);
                titleStr = `Σ ${totalDataStr}`;
                break;
            }
        }
        this._appView.setTitleText(titleStr);
        this._appView.update(this._devicePresenter);

        // Debugging
        // const upload = this._devicePresenter.getUploadSpeed(activeDevice);
        // const download = this._devicePresenter.getDownloadSpeed(activeDevice);
        // const totalData = this._devicePresenter.getTotalDataUsage(activeDevice);
        // this._logger.debug(`upload: ${upload} download: ${download} totalData: ${totalData}`);
        // const uploadStr = bytesSpeedToString(upload, displayBytes);
        // const downloadStr = bytesSpeedToString(download, displayBytes);
        // const totalDataStr = bytesToString(totalData);
        // this._logger.debug(`deviceName: ${activeDevice} upload: ${uploadStr} download: ${downloadStr} totalData: ${totalDataStr}`);
    }

    /**
     * Resets the network stats based on the reset schedule
     */
    resetIfRequired() {
        const now = new Date();
        const activeDevice = this._getActiveDeviceName();
        if (!activeDevice) {
            this._logger.error(`No active connection: ${activeDevice}! try reset next minute`);
            return;
        }
        const lastResetedAt = this._appSettingsModel.getLastResetDateTime(activeDevice);
        const newResetTime = getNextResetTime(lastResetedAt, this._appSettingsModel);
        //this._logger.log(`oldResetTime: ${lastResetedAt}`);
        //this._logger.log(`newResetTime: ${newResetTime}`);
        if (now.getTime() >= newResetTime.getTime()) {
            // crossed the mark, Time to reset network stats
            this._devicePresenter.resetAll();
        }
    }

    // #region Event handlers
    /**
     * Refreshes the app view after every refresh interval
     */
    onRefreshTimeout = () => {
        //this._logger.debug("tick");
        try {
            this.update();
        } catch (err) {
            const error = err as Error;
            this._logger.error(`ERROR: ${error?.toString()} TRACE: ${error?.stack}`);
        }
        return true;
    };

    /**
     * Resets the network stats if required, and saves the stats to the file
     * every minute
     */
    onEveryMinute = () => {
        //this._logger.debug("every 1 minutes");
        try {
            this.resetIfRequired();
            this._devicePresenter.saveStats();
        } catch (err) {
            const error = err as Error;
            this._logger.error(`ERROR: ${error?.toString()} TRACE: ${error?.stack}`);
        }
        return true;
    };

    /**
     * Handles the setting change event
     */
    onSettingChanged = () => {
        this.uninstallTimers();
        this.installTimers();
        this._appView.setTitleTextSize(this._appSettingsModel.statusFontSize);
        if (this._appSettingsModel.resetAllStats) {
            this._appSettingsModel.clearResetAllStats();
            this._devicePresenter.resetAll();
        }
    };

    /**
     * Handles the right click event, Cycles through the display modes.
     * @param button - button clicked
     */
    onRightClick = ({ button }: { button: string }) => {
        if (button === "right") {
            // cycle through the modes
            let { displayMode } = this._appSettingsModel;
            switch (displayMode) {
                default:
                case DisplayMode.TOTAL_SPEED: {
                    displayMode = DisplayMode.DOWNLOAD_SPEED;
                    break;
                }
                case DisplayMode.DOWNLOAD_SPEED: {
                    displayMode = DisplayMode.UPLOAD_SPEED;
                    break;
                }
                case DisplayMode.UPLOAD_SPEED: {
                    displayMode = DisplayMode.BOTH_SPEED;
                    break;
                }
                case DisplayMode.BOTH_SPEED: {
                    displayMode = DisplayMode.TOTAL_DATA;
                    break;
                }
                case DisplayMode.TOTAL_DATA: {
                    displayMode = DisplayMode.TOTAL_SPEED;
                    break;
                }
            }
            this._appSettingsModel.displayMode = displayMode;
            this.update();
        }
    };
    // #endregion Event handlers
}
