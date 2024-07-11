import GObject from "gi://GObject";

/**
 * Registers the UI components as GObject.
 * @param {UI component Class} target 
 * @returns object
 */
export function registerGObjectClass(target) {
    if (Object.prototype.hasOwnProperty.call(target, 'metaInfo')) {
        return GObject.registerClass(target.metaInfo, target);
    } else {
        return GObject.registerClass(target);
    }
}
