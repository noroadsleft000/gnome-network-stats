import { PopupSubMenuMenuItem } from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { registerGObjectClass } from "../utils/gjs.js";

/*
* ExpandableMenuItemClass class for creating expandable menu item.
*/

export class ExpandableMenuItem extends PopupSubMenuMenuItem {
    _init(content) {
        super._init("", false);
        content.add_style_class_name("popup-menu-item");
        this.insert_child_at_index(content, 1);
    }
}

registerGObjectClass(ExpandableMenuItem);
