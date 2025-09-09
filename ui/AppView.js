import Clutter from "gi://Clutter";
import St from "gi://St";

import { MainPanel } from "./MainPanel.js";
import { PopupView } from "./PopupView.js";

/*
* AppView class is manager class for managing UI show/hide/enable/disable.
*/

export class AppView {

    constructor(logger, appSettingsModel) {
        this._logger = logger;
        this._appSettingsModel = appSettingsModel;
        this._mainPanel = new MainPanel();
        this.createLayout();
        this._statusFontSize = 0;
    }

    createLayout() {
        const button = new St.Bin({
            style_class: 'panel-button',
            reactive: true,
            can_focus: true,
            x_expand: true,
            y_expand: false,
            track_hover: true
        });

        const label = new St.Label({
            text: '---',
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'main-label'
        });

        button.set_child(label);
        button.connect('button-press-event', this.showDropDown);
        this._label = label;
        this._button = button;
    }

    update(deviceModel) {
        if (!this._popupView) {
            return;
        }

        const stats = deviceModel.getReadableStats();
        for (const stat of Object.values(stats)) {
            this._popupView.updateItem(stat);
        }
    }

    setTitleText(text) {
        this._label.set_text(text);
        if (this._popupView) {
            this._popupView.setTitleText(text);
        }
    }

    setTitleTextSize(size) {
        if (this._statusFontSize !== size && size >= 10) {
            this._statusFontSize = size;
            this._label.style += `font-size: ${size}`;
            this._popupView.setTitleTextSize(size);
        }
    }

    showDropDown() {
        this._logger.debug("Show the drop down", this);
    }

    show() {
        if (!this._popupView) {
            this._popupView = new PopupView(this._logger, this._appSettingsModel);
        }
        this._mainPanel.addToStatusArea(this._popupView);
    }

    hide() {
        if (this._popupView) {
            this._popupView.destroy();
            this._popupView = undefined;
        }
    }
}
