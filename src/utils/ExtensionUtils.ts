import GLib from "gi://GLib";
import { getExtension } from "../../extension.js";

export class ExtensionUtils {

    static extensionLocalPath: string = ".local/share/gnome-shell/extensions/network-stats@gnome.noroadsleft.xyz";

    static getExtensionPath_v0(): string {
        const homeDir = GLib.get_home_dir();
        const absolutePath = GLib.build_pathv("/", [homeDir, this.extensionLocalPath]);
        //const absolutePath = GLib.Path.build_filename(homeDir, this.extensionLocalPath);
        return absolutePath;
    }

    static openPreferences(): void {
        const extension = getExtension();
        extension.openPreferences();
    }

    static getExtensionPath(): string {
        const extension = getExtension();
        return extension.metadata.path;
    }
}
