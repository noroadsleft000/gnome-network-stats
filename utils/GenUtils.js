const { St } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { DeviceType } = Me.imports.utils.Constants;


/*
* converts data bytes to string representation of data speed.
*/
function bytesSpeedToString(amount, mode = 1) {

    let unitsMap;
    if (mode == 0) {
        unitsMap = ["b/s", "Kb/s", "Mb/s", "Gb/s", "Tb/s"];
    } else {
        unitsMap = ["B/s", "KB/s", "MB/s", "GB/s", "TB/s"];
    }

    if (amount === 0) {
        return `0.00 ${unitsMap[0]}`;
    }

    let base = 1024;
    if (mode == 0) {
        base = 1000;
        amount = amount * 8;
    }

    let unitIndex = 0;
    while (amount >= 1000) {
        amount /= base;
        ++unitIndex;
    }

    let digits = 2;
    if (amount >= 100)
        digits = 0;
    else if (amount >= 10)
        digits = 1;

    return `${amount.toFixed(digits)} ${unitsMap[unitIndex]}`;
}


/*
* converts data bytes to human readable string representation.
*/
function bytesToString(bytes) {

    const unitsMap = ["B", "KB", "MB", "GB", "TB"];
    if (!bytes || bytes === 0) {
        return `0.00 ${unitsMap[0]}`;
    }

    let unitIndex = 0;
    while (bytes >= 1000) {
        bytes /= 1024;
        ++unitIndex;
    }

    let digits = 2;
    if (bytes >= 100)
        digits = 0;
    else if (bytes >= 10)
        digits = 1;

    return `${bytes.toFixed(digits)} ${unitsMap[unitIndex]}`;
}


function getIconPath(name) {
    const currDir = Me.dir.get_path();
    return `${currDir}/assets/${name}`;
}


/**
 * Lookup and returns icon path for given deviceType
 * @param {string} deviceType
 * @returns icon relative path
 */
function getDeviceIcon(deviceType) {
    let path = "";
    switch(deviceType) {
        case DeviceType.ETHERNET:
            path = getIconPath("ethernet_black_24dp.svg");
            break;
        case DeviceType.WIFI:
            path = getIconPath("wifi_black_24dp.svg");
            break;
        case DeviceType.BLETOOTH:
            path = getIconPath("bluetooth_black_24dp.svg");
            break;
        case DeviceType.MODEM:
            path = getIconPath("modem_black_24dp.svg");
            break;
        default:
            path = getIconPath("device_hub_black_24dp.svg");
            break;
    }
    return path;
}


function iconForIconType(iconName) {
    const icon = new St.Icon({
        gicon : Gio.icon_new_for_string(getIconPath(iconName)),
        style_class : 'system-status-icon',
    });
    return icon;
}

