import Clutter from "gi://Clutter";
import St from "gi://St";

import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import { registerGObjectClass } from "../utils/gjs.js";

/*
 * DeviceMenuTitleItem class is ui popup item for displaying table titles.
 * This item is fixed at the top of the popup menu.
 */

export class DeviceMenuTitleItem extends PopupMenu.PopupBaseMenuItem {
    private _icon: InstanceType<typeof St.Icon> | null;
    private _nameLabel: InstanceType<typeof St.Label>;
    private _speedLabel: InstanceType<typeof St.Label>;
    private _totalDataLabel: InstanceType<typeof St.Label>;

    constructor(icon: St.Icon | null, name: string, speed: string, totalData: string) {
        super();

        this._icon = icon;
        this._nameLabel = new St.Label({
            text: name,
            style_class: "device-menu-item-label",
            y_align: Clutter.ActorAlign.CENTER
        });
        this._speedLabel = new St.Label({
            text: speed,
            style_class: "device-menu-item-label",
            y_align: Clutter.ActorAlign.CENTER
        });
        this._totalDataLabel = new St.Label({
            text: totalData,
            style_class: "device-menu-item-label",
            y_align: Clutter.ActorAlign.CENTER
        });

        if (this._icon != null) {
            this.add_child(this._icon);
        } else {
            this.add_child(new St.Label({ style_class: "icon-24" }));
        }
        this.add_child(this._nameLabel);
        this.add_child(this._speedLabel);
        this.add_child(this._totalDataLabel);
    }

    /**
     * Updates the title item with the given values.
     * @param _icon - The icon to display.
     * @param name - The name to display.
     * @param speed - The speed to display.
     * @param totalData - The total data to display.
     */
    update(_icon: St.Icon | null, name: string, speed: string, totalData: string): void {
        this._nameLabel.set_text(name);
        this._speedLabel.set_text(speed);
        this._totalDataLabel.set_text(totalData);
    }
}

registerGObjectClass(DeviceMenuTitleItem);
