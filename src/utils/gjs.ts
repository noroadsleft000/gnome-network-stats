import GObject from "gi://GObject";

/**
 * Registers the UI components as GObject.
 * @param target - UI component Class
 * @returns object
 */
export function registerGObjectClass(target: any): any {
    if (Object.prototype.hasOwnProperty.call(target, "metaInfo")) {
        return GObject.registerClass(target.metaInfo, target);
    } else {
        return GObject.registerClass(target);
    }
}
