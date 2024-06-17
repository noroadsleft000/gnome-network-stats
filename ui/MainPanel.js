import * as Main from "resource:///org/gnome/shell/ui/main.js";

/*
* MainPanel class manager class for adding removing things from panel.
*/

export class MainPanel {

    addChild(child) {
        Main.panel._rightBox.insert_child_at_index(child, 0);
    }

    removeChild(child) {
        Main.panel._rightBox.remove_child(child);
    }

    addToStatusArea(view) {
        Main.panel.addToStatusArea('NetworkStatsStatusView', view, 0, 'right');
    }

    removeFromStatusArea(view) {
        view.destroy();
    }
}
