import Clutter from "gi://Clutter";
import St from "gi://St";

import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { registerGObjectClass } from "../utils/gjs.js";

/*
* DeviceMenuTitleItem class is ui popup item for displaying table titles.
*/

export class DeviceMenuTitleItem extends PopupMenu.PopupBaseMenuItem {

    _init(icon, name, speed, totalData) {
        super._init();

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

    update(icon, name, speed, totalData) {
        this._nameLabel.set_text(name);
        this._speedLabel.set_text(speed);
        this._totalDataLabel.set_text(totalData);
    }
}

registerGObjectClass(DeviceMenuTitleItem);
