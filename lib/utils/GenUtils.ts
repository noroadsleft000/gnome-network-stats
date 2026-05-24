import { DeviceType } from "./Constants.js";
import { TypeUtils } from "./TypeUtils.js";
import { ExtensionUtils } from "./ExtensionUtils.js";

/**
 * Compares 2 POJO for equality
 * @param obj1 - First object to compare
 * @param obj2 - Second object to compare
 * @returns if objects/values are equal returns true otherwise false
 */
export function areEqual(obj1: unknown, obj2: unknown): boolean {
    if (TypeUtils.isObject(obj1) && TypeUtils.isObject(obj2)) {
        // @ts-ignore
        const keys1 = Object.keys(obj1);
        // @ts-ignore
        const keys2 = Object.keys(obj2);
        if (keys1.length === keys2.length) {
            for (const key of keys1) {
                // @ts-ignore
                if (!areEqual(obj1[key], obj2[key])) {
                    return false;
                }
            }
            return true;
        }
    } else if (Array.isArray(obj1) && Array.isArray(obj2)) {
        if (obj1.length !== obj2.length) {
            for (const index in obj1) {
                if (areEqual(obj1[index], obj2[index])) {
                    return false;
                }
            }
        }
        return true;
    }
    return obj1 === obj2;
}

/**
 * Compares to json string for equality
 * @param str1 - First JSON string
 * @param str2 - Second JSON string
 * @returns true if they are equal otherwise false.
 */
export function compareJsonStrings(str1: string, str2: string): boolean {
    try {
        const obj1 = JSON.parse(str1);
        const obj2 = JSON.parse(str2);
        return areEqual(obj1, obj2);
    } catch (_err) {
        _err;
        // do nothing
    }
    return false;
}

/**
 * converts data bytes to string representation of data speed.
 * @param amount - Amount in bytes
 * @param mode - false - bits mode, true - bytes mode
 * @returns string representation of data speed
 */
export function bytesSpeedToString(amount: number, mode: boolean = true): string {
    let unitsMap;
    if (mode == false) {
        unitsMap = ["b/s", "Kb/s", "Mb/s", "Gb/s", "Tb/s"];
    } else {
        unitsMap = ["B/s", "KB/s", "MB/s", "GB/s", "TB/s"];
    }

    if (amount === 0) {
        return `0.00 ${unitsMap[0]}`;
    }

    let base = 1024;
    if (mode == false) {
        base = 1000;
        amount = amount * 8;
    }

    let unitIndex = 0;
    while (amount >= 1000) {
        amount /= base;
        ++unitIndex;
    }

    let digits = 2;
    if (amount >= 100) digits = 0;
    else if (amount >= 10) digits = 1;

    return `${amount.toFixed(digits)} ${unitsMap[unitIndex]}`;
}

/**
 * converts data bytes to human readable string representation.
 * @param bytes - Number of bytes
 * @returns data size human readable units
 */
export function bytesToString(bytes: number): string {
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
    if (bytes >= 100) digits = 0;
    else if (bytes >= 10) digits = 1;

    return `${bytes.toFixed(digits)} ${unitsMap[unitIndex]}`;
}

/**
 * returns the icon relative path for given name
 * @param name - Icon name
 * @returns icon relative path.
 */
export function getIconPath(name: string): string {
    const currDir = ExtensionUtils.getExtensionPath();
    return `${currDir}/assets/${name}`;
}

/**
 * Returns the theme-specific icon path by replacing black/white with the current theme color.
 * @param baseName - Base icon name (e.g. settings_black_24dp.svg)
 * @param isDark - Whether the theme is dark
 * @returns resolved icon relative path
 */
export function getThemeIconPath(baseName: string, isDark: boolean = true): string {
    const colorSuffix = isDark ? "white" : "black";
    const resolvedName = baseName.replace(/_(black|white)_/, `_${colorSuffix}_`);
    return getIconPath(resolvedName);
}

/**
 * Lookup and returns icon path for given deviceType
 * @param deviceType - Type of device
 * @param isDark - Whether the theme is dark
 * @returns icon relative path
 */
export function getDeviceIcon(deviceType: string, isDark: boolean = true): string {
    const colorSuffix = isDark ? "white" : "black";
    let iconName = "";
    switch (deviceType) {
        case DeviceType.ETHERNET:
            iconName = `ethernet_black_24dp.svg`;
            break;
        case DeviceType.WIFI:
            iconName = `wifi_black_24dp.svg`;
            break;
        case DeviceType.BLUETOOTH:
            iconName = `bluetooth_black_24dp.svg`;
            break;
        case DeviceType.MODEM:
            iconName = `modem_24dp.svg`;
            break;
        default:
            iconName = `device_hub_black_24dp.svg`;
            break;
    }
    const resolvedName = iconName.replace(/_(black|white)_/, `_${colorSuffix}_`);
    return getIconPath(resolvedName);
}
