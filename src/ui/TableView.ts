import St from "gi://St";
import { registerGObjectClass } from "../utils/gjs.js";

/*
 * TableViewClass class to create a table layout.
 */

export class TableView extends St.BoxLayout {
    // constructor
    constructor(props?: Partial<St.BoxLayout.ConstructorProps>) {
        super(props);
    }

    addRow(...controls: St.Widget[]): void {
        const box = new St.BoxLayout({ vertical: false });
        for (const control of controls) {
            box.add_child(control);
        }
        this.add_child(box);
    }

    removeRow(index: number): void {
        const child = this.get_child_at_index(index);
        if (child) {
            this.remove_child(child);
        }
    }
}

registerGObjectClass(TableView);
