/** Gtk utilities */

export function getGtkVersion() {
    const { Gtk } = imports.gi;
    const gtkVersion = Gtk.get_major_version();
    return gtkVersion;
}

export function isGtk3() {
    return getGtkVersion() === 3;
}

export function isGtk4() {
    return getGtkVersion() === 4;
}

export function addChildToBox(box, child) {
    if (isGtk4()) {
        box.append(child);
    } else {
        box.add(child);
    }
}
