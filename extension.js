'use strict';

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { Logger } = Me.imports.utils.Logger;
const { App } = Me.imports.App;
const { initBrodcasters, deinitBrodcasters } = Me.imports.utils.Broadcasters;
const Prefs = Me.imports.prefs;

let logger = undefined;
let app = undefined;
function init() {
    logger = new Logger;
    logger.info(`initializing 1 ${Me.metadata.name}`);
}

function enable() {
    logger.info(`enabling ${Me.metadata.name}`);
    initBrodcasters();
    app = new App();
    app.start();
}

function disable() {
    logger.info(`disabling ${Me.metadata.name}`);
    app.stop();
    deinitBrodcasters();
    app = undefined;
    logger = undefined;
}
