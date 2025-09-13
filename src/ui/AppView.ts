import Clutter from "gi://Clutter";
import St from "gi://St";

import { MainPanel } from "./MainPanel.js";
import { PopupView } from "./PopupView.js";
import type { Logger } from "../utils/Logger.js";
import type { AppSettingsModel } from "../AppSettingsModel.js";
import type { DeviceModel } from "../net/DeviceModel.js";

/*
 * AppView class is manager class for managing UI show/hide/enable/disable.
 */

export class AppView {
    private _mainPanel: MainPanel;
    private _statusFontSize = 0;
    private _label: St.Label;
    private _button: St.Bin;
    private _popupView: PopupView | undefined;

    constructor(
        private _logger: Logger,
        private _appSettingsModel: AppSettingsModel
    ) {
        this._mainPanel = new MainPanel();
        const { label, button } = this.createLayout();
        this._label = label;
        this._button = button;
    }

    destructor() {
        // @ts-ignore
        this._label = undefined;
        // @ts-ignore
        this._button = undefined;
    }

    createLayout() {
        const button = new St.Bin({
            style_class: "panel-button",
            reactive: true,
            can_focus: true,
            x_expand: true,
            y_expand: false,
            track_hover: true
        });

        const label = new St.Label({
            text: "---",
            y_align: Clutter.ActorAlign.CENTER,
            style_class: "main-label"
        });

        button.set_child(label);
        button.connect("button-press-event", this.showDropDown);
        return { label, button };
    }

    update(deviceModel: DeviceModel): void {
        if (!this._popupView) {
            return;
        }

        const stats = deviceModel.getReadableStats();
        for (const stat of Object.values(stats)) {
            this._popupView.updateItem(stat);
        }
    }

    /**
     * Updates the top status bar text
     * @param text - text to display in status bar
     */
    setTitleText(text: string): void {
        this._label.set_text(text);
        if (this._popupView) {
            this._popupView.setTitleText(text);
        }
    }

    /**
     * Updates the text size of top bar text
     * @param size - text size
     */
    setTitleTextSize(size: number): void {
        if (this._statusFontSize !== size && size >= 10) {
            this._statusFontSize = size;
            this._label.style += `font-size: ${size}px`;
            if (this._popupView) {
                this._popupView.setTitleTextSize(size);
            }
        }
    }

    showDropDown(): void {
        this._logger.debug("Show the drop down", this);
    }

    show(): void {
        if (!this._popupView) {
            this._popupView = new PopupView(this._logger, this._appSettingsModel);
        }
        this._mainPanel.addToStatusArea(this._popupView);
    }

    hide(): void {
        if (this._popupView) {
            this._popupView.destroy();
            this._popupView = undefined;
        }
    }
}
