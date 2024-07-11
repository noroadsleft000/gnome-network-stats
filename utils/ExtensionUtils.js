import GLib from "gi://GLib";
import { getExtension } from "../extension.js";

export class ExtensionUtils {

    static extensionLocalPath = ".local/share/gnome-shell/extensions/network-stats@gnome.noroadsleft.xyz";

    static getExtensionPath_v0() {
        const homeDir = GLib.get_home_dir();
        const absolutePath = GLib.Path.build_filename(homeDir, this.extensionLocalPath);
        return absolutePath;
    }

    static openPreferences() {
        const extension = getExtension();
        extension.openPreferences();
    }

    static getExtensionPath() {
        const extension = getExtension();
        return extension.metadata.path;
    }
}
