import type { Button } from "@girs/gnome-shell/ui/panelMenu";
import St from "gi://St";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

/*
 * MainPanel class manager class for adding removing things from panel.
 */

export class MainPanel {
    get rightBox(): St.Widget {
        if ("_rightBox" in Main.panel) {
            return Main.panel["_rightBox"] as St.Widget;
        }
        return Main.panel as unknown as St.Widget;
    }

    addChild(child: St.Widget): void {
        this.rightBox.insert_child_at_index(child, 0);
    }

    removeChild(child: St.Widget): void {
        this.rightBox.remove_child(child);
    }

    addToStatusArea(view: Button): void {
        Main.panel.addToStatusArea("NetworkStatsStatusView", view, 0, "right");
    }

    removeFromStatusArea(view: Button): void {
        view.destroy();
    }
}
