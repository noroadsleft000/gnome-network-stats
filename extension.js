'use strict';

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

import { Logger } from "./utils/Logger.js"
import { App } from "./App.js";
import { initBrodcasters, deinitBrodcasters } from "./utils/Broadcasters.js";

export default class GnsExtension extends Extension {

    constructor(props) {
        super(props);
    }

    init() {
        Logger.info(`initializing ${this.metadata.name}`);
    }

    enable() {
        GnsExtension.instance = this;
        Logger.info(`enabling ${this.metadata.name}`);
        initBrodcasters();
        App.instance().start();
    }

    disable() {
        Logger.info(`disabling ${this.metadata.name}`);
        App.instance().stop();
        deinitBrodcasters();
        App.releaseInstance();
        Logger.releaseInstance();
        GnsExtension.instance = undefined;
    }
}


export function getExtension() {
    if (!GnsExtension.instance) {
        throw new Error('extension is not loaded/enabled');
    }
    return GnsExtension.instance;
}
