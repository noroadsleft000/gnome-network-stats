'use strict';

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { logger } = Me.imports.utils.Logger;
const { appController } = Me.imports.AppController;
const Prefs = Me.imports.prefs;

function init() {
    logger.debug(`initializing ${Me.metadata.name}`);
    appController.init();
}

function enable() {
    logger.debug(`enabling ${Me.metadata.name}`);
    appController.show();
}

function disable() {
    logger.debug(`disabling ${Me.metadata.name}`);
    appController.hide();
    //appController.deinit();
}
