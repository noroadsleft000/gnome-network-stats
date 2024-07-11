import { AppController } from "./AppController.js";
import { AppSettingsModel } from "./AppSettingsModel.js";
import { DeviceModel } from "./net/DeviceModel.js"
import { NetworkMonitor } from "./net/NetworkMonitor.js";
import { DeviceMonitor } from "./net/DeviceMonitor.js";
import { Logger } from "./utils/Logger.js";

export class App {
    static instance() {
        return this._instance || (this._instance = new this());
    }

    static releaseInstance() {
        this._instance = undefined;
    }

    constructor() {
        const logger = new Logger();
        const appSettingsModel = new AppSettingsModel(logger);
        appSettingsModel.init();
        const deviceMonitor = new DeviceMonitor(logger);
        const networkMonitor = new NetworkMonitor(logger);
        const deviceModel = new DeviceModel(logger, deviceMonitor, networkMonitor, appSettingsModel);
        this._appController = new AppController(logger, appSettingsModel, deviceModel);
    }

    start() {
        this._appController.init();
        this._appController.show();
    }

    stop() {
        this._appController.hide();
        this._appController.deinit();
    }
}
