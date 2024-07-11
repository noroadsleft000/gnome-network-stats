import Gio from "gi://Gio";
import St from "gi://St";
import { getIconPath } from "./GenUtils.js";

/**
 * create new Icon object for given iconName
 * @param {string} iconName
 * @returns Icon UI object
 */
export function createIcon(iconName) {
    const icon = new St.Icon({
        gicon: Gio.icon_new_for_string(getIconPath(iconName)),
        style_class: 'system-status-icon',
    });
    return icon;
}
