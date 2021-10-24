const { PopupSubMenuMenuItem } = imports.ui.popupMenu;
const { Atk, Clutter, Gio, GObject, Graphene, Shell, St } = imports.gi;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const { getIconPath } = Me.imports.utils.GenUtils;
const { logger } = Me.imports.utils.Logger;
const Gettext = imports.gettext;
const _ = Gettext.domain("network-stats").gettext;


/*
* ExpandableDeviceMenuItemClass class represents each interface item in dropdown UI.
*/

class ExpandableDeviceMenuItemClass extends PopupSubMenuMenuItem {
    _init(device,
        {
            defaultDeviceName,
            onResetClicked, 
            onMarkDefaultClicked,
        }
    ) {
        super._init("", false);

        const {
            iconPath,
        } = device;

        const box = new St.BoxLayout({ style_class: "popup-menu-item" });
        this.insert_child_at_index(box, 1);
        this._boxed = box;

        this._icon = new St.Icon({
            gicon: Gio.icon_new_for_string(iconPath),
            style_class: 'icon-24',
        });
        this._nameLabel = new St.Label({
            text: "",
            style_class: "device-menu-item-label",
            y_align: Clutter.ActorAlign.CENTER
        });
        this._speedLabel = new St.Label({
            text: "",
            style_class: "device-menu-item-label",
            y_align: Clutter.ActorAlign.CENTER
        });
        this._dataLabel = new St.Label({
            text: "",
            style_class: "device-menu-item-label",
            y_align: Clutter.ActorAlign.CENTER
        });
        box.insert_child_at_index(this._icon, 1);
        box.insert_child_at_index(this._nameLabel, 2);
        box.insert_child_at_index(this._speedLabel, 3);
        box.insert_child_at_index(this._dataLabel, 4);

        const box1 = new St.BoxLayout({ style_class: "popup-menu-item", vertical: false });
        this._ipTitleLabel = new St.Label({
            text: "",
            style_class: "text-item text-right"
        });
        this._ipValueLabel = new St.Label({
            text: "",
            style_class: "text-item text-left"
        });
        box1.add_child(this._ipTitleLabel);
        box1.add_child(this._ipValueLabel);

        const box2 = new St.BoxLayout({ style_class: "popup-menu-item", vertical: false });
        this._uploadSpeedTitleLabel = new St.Label({
            text: "",
            style_class: "text-item text-right"
        });
        this._uploadSpeedValueLabel = new St.Label({
            text: "",
            style_class: "text-item text-left"
        });
        box2.add_child(this._uploadSpeedTitleLabel);
        box2.add_child(this._uploadSpeedValueLabel);

        const box3 = new St.BoxLayout({ style_class: "popup-menu-item", vertical: false });
        this._downloadSpeedTitleLabel = new St.Label({
            text: "",
            style_class: "text-item text-right"
        });
        this._downloadSpeedValueLabel = new St.Label({
            text: "",
            style_class: "text-item text-left"
        });
        box3.add_child(this._downloadSpeedTitleLabel);
        box3.add_child(this._downloadSpeedValueLabel);


        const box4 = new St.BoxLayout({ style_class: "popup-menu-item", vertical: false });
        this._totalSpeedTitleLabel = new St.Label({
            text: "",
            style_class: "text-item text-right"
        });
        this._totalSpeedValueLabel = new St.Label({
            text: "",
            style_class: "text-item text-left"
        });
        box4.add_child(this._totalSpeedTitleLabel);
        box4.add_child(this._totalSpeedValueLabel);


        const box5 = new St.BoxLayout({ style_class: "popup-menu-item", vertical: false });
        this._totalDataTitleLabel = new St.Label({
            text: "",
            style_class: "text-item text-right",
            y_align: Clutter.ActorAlign.CENTER
        });
        this._totalDataValueLabel = new St.Label({
            text: "",
            style_class: "text-item text-left",
            y_align: Clutter.ActorAlign.CENTER,
        });
        box5.add_child(this._totalDataTitleLabel);
        box5.add_child(this._totalDataValueLabel);

        const resetIcon = new St.Icon({
            gicon: Gio.icon_new_for_string(getIconPath("restart_alt_black_24dp.svg")),
            style_class: 'icon-16',
        });

        const resetButton = new St.Button({
            style_class: 'ci-action-btn ns-button',
            can_focus: true,
            child: resetIcon,
            x_align: Clutter.ActorAlign.END,
            x_expand: true,
            y_expand: true
        });

        resetButton.connect('button-press-event', onResetClicked);
        this._resetButton = resetButton;
        box5.add_child(this._resetButton);


        const box6 = new St.BoxLayout({
            style_class: "popup-menu-item",
            vertical: false
        });
        this._makeDefaultTitleLabel = new St.Label({
            text: "",
            style_class: "text-item text-right",
            y_align: Clutter.ActorAlign.CENTER
        });
        this._makeDefaultValueLabel = new St.Label({
            text: "text-item",
            y_align: Clutter.ActorAlign.CENTER
        });
        box6.add_child(this._makeDefaultTitleLabel);
        box6.add_child(this._makeDefaultValueLabel);


        const makeDefaultLabel = new St.Label({
            text: _("Make Default"),
        });

        const makeDefaultButton = new St.Button({
            style_class: 'ns-button ns-text-button',
            can_focus: true,
            child: makeDefaultLabel,
            x_align: Clutter.ActorAlign.END,
            y_align: Clutter.ActorAlign.CENTER,
            x_expand: false,
            y_expand: true
        });

        makeDefaultButton.connect('button-press-event', onMarkDefaultClicked);
        this._makeDefaultButton = makeDefaultButton;
        box6.add_child(this._makeDefaultButton);


        this.menu.box.add_child(box1);
        this.menu.box.add_child(box2);
        this.menu.box.add_child(box3);
        this.menu.box.add_child(box4);
        this.menu.box.add_child(box5);
        this.menu.box.add_child(box6);

        this.update(device, defaultDeviceName);
    }

    update(device, defaultDeviceName) {
        const {
            //iconPath,
            name,
            upSpeed,
            downSpeed,
            totalSpeed,
            totalData,
            ip,
            startTime,
        } = device;

        //this._icon.set_gicon(iconPath);
        this._nameLabel.set_text(name);
        this._speedLabel.set_text(totalSpeed);
        this._dataLabel.set_text(totalData);

        // details
        this._ipTitleLabel.set_text(`${_("IP")} : `);
        this._ipValueLabel.set_text(ip);
        
        this._uploadSpeedTitleLabel.set_text(`${_("Upload speed")} [↑] : `);
        this._uploadSpeedValueLabel.set_text(upSpeed);

        this._downloadSpeedTitleLabel.set_text(`${_("Download speed")} [↓] : `);
        this._downloadSpeedValueLabel.set_text(downSpeed);


        this._totalSpeedTitleLabel.set_text(`${_("Total speed")} [↕] : `);
        this._totalSpeedValueLabel.set_text(totalSpeed);

        this._totalDataTitleLabel.set_text(`${_("Total data used")} [Σ] : `);
        this._totalDataValueLabel.set_text(`${totalData}  --  ${_("since")} -- ${startTime}`);

        let symbol = "★";
        if (name === defaultDeviceName) {
            this._makeDefaultValueLabel.set_text(`${_("Yes")}`);
            this._makeDefaultButton.hide();
        } else {
            this._makeDefaultValueLabel.set_text(`${_("No")}`);
            symbol = "☆";
            this._makeDefaultButton.show();
        }
        this._makeDefaultTitleLabel.set_text(`${_("Default device")} [${symbol}] : `);
    }
}

var ExpandableDeviceMenuItem = GObject.registerClass(ExpandableDeviceMenuItemClass);