'use strict';

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { logger } = Me.imports.utils.Logger;
const { appController } = Me.imports.AppController;
const Prefs = Me.imports.prefs;

function init() {
    logger.info(`initializing ${Me.metadata.name}`);
}

function enable() {
    logger.info(`enabling ${Me.metadata.name}`);
    appController.init();
    appController.show();
}

function disable() {
    logger.info(`disabling ${Me.metadata.name}`);
    appController.hide();
    appController.deinit();
}
