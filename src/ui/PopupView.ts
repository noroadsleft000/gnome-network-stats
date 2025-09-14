import Clutter from "gi://Clutter";
import Gio from "gi://Gio";
import St from "gi://St";
import { PopupMenu, PopupMenuSection } from "resource:///org/gnome/shell/ui/popupMenu.js";
import { Button as PanelMenuButton } from "resource:///org/gnome/shell/ui/panelMenu.js";

import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";

import { ExpandableDeviceMenuItem } from "./ExpandableDeviceMenuItem.js";
import { DeviceMenuTitleItem } from "./DeviceMenuTitleItem.js";

import { Broadcasters } from "../utils/Broadcasters.js";
import { DisplayMode } from "../utils/Constants.js";
import { registerGObjectClass } from "../utils/gjs.js";
import { getDeviceIcon, getIconPath } from "../utils/GenUtils.js";
import { ExtensionUtils } from "../utils/ExtensionUtils.js";
import type { AppSettingsModel, ListenerFunc } from "../AppSettingsModel.ts";
import type { Logger } from "../utils/Logger.ts";
import type { DeviceViewModel } from "../net/DevicePresenter.js";

/*
 * PopupViewClass class represents the UI for dropdown menu.
 */

export class PopupView extends PanelMenuButton {
    private _menuItems: Record<string, ExpandableDeviceMenuItem>;
    private _mainLabel: St.Label;
    private _mainIcon: St.Icon;
    private _totalSpeed: St.Button;
    private _downloadSpeed: St.Button;
    private _uploadSpeed: St.Button;
    private _bothSpeed: St.Button;
    private _dataUsage: St.Button;
    private _settings: St.Button;
    private _settingsListener?: ListenerFunc;

    constructor(
        private _logger: Logger,
        private _appSettingsModel: AppSettingsModel
    ) {
        super(0, "PopupView");
        this._menuItems = {};

        const mainLabel = new St.Label({
            text: "---",
            y_align: Clutter.ActorAlign.CENTER,
            style_class: "main-label"
        });
        this._mainLabel = mainLabel;

        const mainIcon = new St.Icon({
            //icon_name : 'security-low-symbolic',
            gicon: Gio.icon_new_for_string(getIconPath("network_check_white_24dp.svg")),
            style_class: "system-status-icon"
        });
        this._mainIcon = mainIcon;

        const topBox = new St.BoxLayout();
        topBox.add_child(this._mainLabel);
        if (this._appSettingsModel.statusShowIcon === true) {
            topBox.add_child(this._mainIcon);
        }
        this.add_child(topBox);

        const upIcon = new St.Icon({
            gicon: Gio.icon_new_for_string(getIconPath("arrow_up_black_24dp.svg")),
            style_class: "system-status-icon"
        });

        const downIcon = new St.Icon({
            gicon: Gio.icon_new_for_string(getIconPath("arrow_down_black_24dp.svg")),
            style_class: "system-status-icon"
        });

        const upDownIcon = new St.Icon({
            gicon: Gio.icon_new_for_string(getIconPath("arrow_updown_black_24dp.svg")),
            style_class: "system-status-icon"
        });

        const bothSpeedIcon = new St.Icon({
            gicon: Gio.icon_new_for_string(getIconPath("arrow_both_black_24dp.svg")),
            style_class: "system-status-icon"
        });

        const settingIcon = new St.Icon({
            //icon_name: "emblem-system",
            gicon: Gio.icon_new_for_string(getIconPath("settings_black_24dp.svg")),
            style_class: "system-status-icon"
        });

        const totalIcon = new St.Icon({
            gicon: Gio.icon_new_for_string(getIconPath("data_usage_black_24dp.svg")),
            style_class: "system-status-icon"
        });

        this._totalSpeed = new St.Button({
            style_class: "ns-action-button",
            reactive: true,
            can_focus: true,
            track_hover: true,
            child: upDownIcon,
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
            y_expand: true
        });

        this._downloadSpeed = new St.Button({
            style_class: "message-list-clear-button ns-action-button",
            reactive: true,
            can_focus: true,
            track_hover: true,
            child: downIcon,
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
            y_expand: true
        });

        this._uploadSpeed = new St.Button({
            style_class: "message-list-clear-button ns-action-button",
            reactive: true,
            can_focus: true,
            track_hover: true,
            child: upIcon,
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
            y_expand: true
        });

        this._bothSpeed = new St.Button({
            style_class: "message-list-clear-button ns-action-button",
            reactive: true,
            can_focus: true,
            track_hover: true,
            child: bothSpeedIcon,
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
            y_expand: true
        });

        this._dataUsage = new St.Button({
            style_class: "ci-action-btn ns-action-button",
            reactive: true,
            can_focus: true,
            track_hover: true,
            child: totalIcon,
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
            y_expand: true
        });

        this._settings = new St.Button({
            style_class: "ci-action-btn ns-action-button",
            reactive: true,
            can_focus: true,
            track_hover: true,
            child: settingIcon,
            x_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
            y_expand: true
        });

        this._settings.connect("button-press-event", () => {
            ExtensionUtils.openPreferences();
        });

        this._totalSpeed.connect("button-press-event", () => {
            //this._logger.debug("total speed button pressed");
            this._appSettingsModel.displayMode = DisplayMode.TOTAL_SPEED;
            this.updateGroupButtonsState();
        });
        this._downloadSpeed.connect("button-press-event", () => {
            //this._logger.debug("download speed button pressed");
            this._appSettingsModel.displayMode = DisplayMode.DOWNLOAD_SPEED;
            this.updateGroupButtonsState();
        });
        this._uploadSpeed.connect("button-press-event", () => {
            //this._logger.debug("upload speed button pressed");
            this._appSettingsModel.displayMode = DisplayMode.UPLOAD_SPEED;
            this.updateGroupButtonsState();
        });
        this._bothSpeed.connect("button-press-event", () => {
            //this._logger.debug("upload speed button pressed");
            this._appSettingsModel.displayMode = DisplayMode.BOTH_SPEED;
            this.updateGroupButtonsState();
        });
        this._dataUsage.connect("button-press-event", () => {
            //this._logger.debug("total data button pressed");
            this._appSettingsModel.displayMode = DisplayMode.TOTAL_DATA;
            this.updateGroupButtonsState();
        });
        this.updateGroupButtonsState();

        // connect to main button click event
        this.connect("button-press-event", this.onMainButtonClicked.bind(this));

        // connect to app settings model change event
        this._settingsListener = this._appSettingsModel.subscribe(() => {
            this.updateGroupButtonsState();
        });
        this.addDefaultMenuItems();
    }

    destructor() {
        if (this._settingsListener) {
            this._appSettingsModel.unsubscribe(this._settingsListener);
            this._settingsListener = undefined;
        }
    }

    get popupMenu() {
        return this.menu as InstanceType<typeof PopupMenu>;
    }

    updateGroupButtonsState(): void {
        const { displayMode } = this._appSettingsModel;
        this.toggleButtonState(this._totalSpeed, displayMode == DisplayMode.TOTAL_SPEED);
        this.toggleButtonState(this._uploadSpeed, displayMode == DisplayMode.UPLOAD_SPEED);
        this.toggleButtonState(this._downloadSpeed, displayMode == DisplayMode.DOWNLOAD_SPEED);
        this.toggleButtonState(this._bothSpeed, displayMode == DisplayMode.BOTH_SPEED);
        this.toggleButtonState(this._dataUsage, displayMode == DisplayMode.TOTAL_DATA);
    }

    onMainButtonClicked(_button: St.Button, event: Clutter.Event): void {
        //this._logger.debug(event);
        const broadcaster = Broadcasters.titleClickedMessageBroadcaster;
        if (broadcaster) {
            if (event.get_button() == 1) {
                broadcaster.broadcast({ button: "left" });
            } else if (event.get_button() == 2) {
                broadcaster.broadcast({ button: "middle" });
            } else if (event.get_button() == 3) {
                broadcaster.broadcast({ button: "right" });
            }
        }
    }

    toggleButtonState(button: St.Button, value?: boolean): void {
        if (value != undefined) {
            if (value) {
                button.add_style_class_name("ns-action-button-down");
            } else {
                button.remove_style_class_name("ns-action-button-down");
            }
        } else {
            if (button.has_style_class_name("ns-action-button-down")) {
                button.remove_style_class_name("ns-action-button-down");
            } else {
                button.add_style_class_name("ns-action-button-down");
            }
        }
    }

    addDefaultMenuItems() {
        const box = new St.BoxLayout({ style_class: "view-item", vertical: false });
        box.add_child(this._totalSpeed);
        box.add_child(this._downloadSpeed);
        box.add_child(this._uploadSpeed);
        box.add_child(this._bothSpeed);
        box.add_child(this._dataUsage);
        box.add_child(this._settings);

        const popupMenuSection0 = new PopupMenuSection();
        popupMenuSection0.actor.add_child(box);
        this.popupMenu.addMenuItem(popupMenuSection0);

        const popupMenuSection1 = new PopupMenuSection();
        popupMenuSection1.actor.add_child(new St.BoxLayout({ style_class: "v-spacer" }));
        this.popupMenu.addMenuItem(popupMenuSection1);

        const popupMenuSection2 = new PopupMenuSection();
        popupMenuSection2.actor.add_child(this.createSeparator());
        this.popupMenu.addMenuItem(popupMenuSection2);

        const titleMenuItem = new DeviceMenuTitleItem(
            null,
            _("Device"),
            _("Speed"),
            _("Data Used")
        );
        const popupMenuSection3 = new PopupMenuSection();
        popupMenuSection3.actor.add_child(titleMenuItem);
        this.popupMenu.addMenuItem(popupMenuSection3);

        const popupMenuSection4 = new PopupMenuSection();
        popupMenuSection4.actor.add_child(this.createSeparator());
        this.popupMenu.addMenuItem(popupMenuSection4);
    }

    createSeparator(): St.BoxLayout {
        const outerBox = new St.BoxLayout({
            style_class: "v-separator-cont",
            x_expand: true,
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER
        });
        const innerBox = new St.BoxLayout({
            style_class: "h-line",
            x_expand: true,
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER
        });
        outerBox.add_child(innerBox);
        return outerBox;
    }

    /**
     * Get all menu items
     * @returns All menu items
     */
    menuItems(): Readonly<Record<string, ExpandableDeviceMenuItem>> {
        return this._menuItems;
    }

    /**
     * Update a menu item
     * @param device - Device to update
     */
    updateItem(device: DeviceViewModel): void {
        let menuItem = this._menuItems[device.name];
        const iconPath = getDeviceIcon(device.type);
        const extendedDeviceStats = { ...device, iconPath };
        if (!menuItem) {
            menuItem = new ExpandableDeviceMenuItem(extendedDeviceStats, {
                defaultDeviceName: this._appSettingsModel.preferedDeviceName,
                onResetClicked: this.onResetClicked.bind(this, device.name),
                onMarkDefaultClicked: this.onMarkDefaultClicked.bind(this, device.name)
            });
            this.popupMenu.addMenuItem(menuItem);
            this._menuItems[device.name] = menuItem;
        } else {
            menuItem.update(device, this._appSettingsModel.preferedDeviceName);
        }
    }

    /**
     * Clear all menu items
     */
    clearMenuItems(): void {
        for (const value of Object.values(this._menuItems)) {
            value.destroy();
        }
        this._menuItems = {};
    }

    onResetClicked(name: string): void {
        this._logger.info(`Reset the device : ${name}`);
        const broadcaster = Broadcasters.deviceResetMessageBroadcaster;
        if (broadcaster) {
            broadcaster.broadcast({ name });
        }
    }

    onMarkDefaultClicked(name: string): void {
        this._logger.info(`Mark the device "${name}" as default`);
        this._appSettingsModel.preferedDeviceName = name;
    }

    setTitleText(text: string): void {
        this._mainLabel.set_text(text);
    }

    setTitleTextSize(size: number): void {
        this._mainLabel.style = `font-size: ${size}px`;
    }

    /** @override */
    vfunc_event(event: Clutter.Event): boolean {
        if (
            event.type() == Clutter.EventType.TOUCH_BEGIN ||
            event.type() == Clutter.EventType.BUTTON_PRESS
        ) {
            if (event.get_button() == 3) {
                // right click - just ignore it
                return true;
            }
        }
        return super.vfunc_event(event);
    }

    /** @override */
    destroy(): void {
        if (this.menu) {
            this.menu.close();
        }
        // this._uploadSpeed.unref();
        // this._downloadSpeed.unref();
        // this._totalSpeed.unref();
        // this._bothSpeed.unref();
        // this._dataUsage.unref();
        // @ts-ignore - forceful garbage collect
        this._uploadSpeed = undefined;
        // @ts-ignore - forceful garbage collect
        this._downloadSpeed = undefined;
        // @ts-ignore - forceful garbage collect
        this._totalSpeed = undefined;
        // @ts-ignore - forceful garbage collect
        this._bothSpeed = undefined;
        // @ts-ignore - forceful garbage collect
        this._dataUsage = undefined;
        if (this._settingsListener) {
            this._appSettingsModel.unsubscribe(this._settingsListener);
            this._settingsListener = undefined;
        }
        super.destroy();
    }
}

registerGObjectClass(PopupView);
