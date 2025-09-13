import Gtk from "gi://Gtk";

/** Gtk utilities */

export function addChildToBox(box: Gtk.Box, child: Gtk.Widget): void {
    box.append(child);
}
