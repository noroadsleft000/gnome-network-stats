"use strict";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

import { Logger } from "./src/utils/Logger.js";
import { App } from "./src/App.js";
import { Broadcasters } from "./src/utils/Broadcasters.js";
import { ExtensionMetadata } from "@girs/gnome-shell/extensions/extension";

export default class GnsExtension extends Extension {
    static instance?: GnsExtension;

    constructor(props: ExtensionMetadata) {
        super(props);
    }

    init() {
        Logger.info(`initializing ${this.metadata.name}`);
    }

    enable() {
        GnsExtension.instance = this;
        Logger.info(`enabling ${this.metadata.name}`);
        Broadcasters.getInstance();
        App.instance().start();
    }

    disable() {
        Logger.info(`disabling ${this.metadata.name}`);
        App.instance().stop();
        Broadcasters.getInstance().destruct();
        App.releaseInstance();
        Logger.releaseInstance();
        GnsExtension.instance = undefined;
    }
}

export function getExtension() {
    if (!GnsExtension.instance) {
        throw new Error("extension is not loaded/enabled");
    }
    return GnsExtension.instance;
}
