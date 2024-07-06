import Adw from 'gi://Adw';
import Gio from "gi://Gio";
import GObject from "gi://GObject";
import Gtk from "gi://Gtk";
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import { DisplayMode, ResetSchedule, DayOfWeek, SettingKeys, kSchemaName } from "./utils/Constants.js";
import { setTimeout } from "./utils/DateTimeUtils.js";
import { addChildToBox } from "./utils/GtkUtils.js";
import { IndexMap } from "./utils/IndexMap.js";


const kDisplayModeMapping = new IndexMap({
    0: DisplayMode.TOTAL_SPEED,
    1: DisplayMode.UPLOAD_SPEED,
    2: DisplayMode.DOWNLOAD_SPEED,
    3: DisplayMode.BOTH_SPEED,
    4: DisplayMode.TOTAL_DATA
});

const kResetScheduleMapping = new IndexMap({
    0: ResetSchedule.DAILY,
    1: ResetSchedule.WEEKLY,
    2: ResetSchedule.BIWEEKLY,
    3: ResetSchedule.MONTHLY,
    4: ResetSchedule.NEVER
});

const kDayOfWeekMapping = new IndexMap({
    0: DayOfWeek.MONDAY,
    1: DayOfWeek.TUESDAY,
    2: DayOfWeek.WEDNESDAY,
    3: DayOfWeek.THURSDAY,
    4: DayOfWeek.FRIDAY,
    5: DayOfWeek.SATURDAY,
    6: DayOfWeek.SUNDAY
});


const SettingRowOrder = Object.freeze({
    REFRESH_INTERVAL: 0,
    DISPLAY_MODE: 1,
    RESET_SCHEDULE: 2,
    RESET_WEEK_DAY: 3,
    RESET_MONTH_DAY: 4,
    RESET_TIME: 5,
    DISPLAY_BYTES: 6,
    SHOW_ICON: 7
});

let _;

export default class GnsPreferences extends ExtensionPreferences {

    constructor(props) {
        super(props);
        this._rows = {};
        this.main = new Gtk.Grid({
            margin_top: 10,
            margin_bottom: 10,
            margin_start: 10,
            margin_end: 10,
            row_spacing: 12,
            column_spacing: 18,
            column_homogeneous: false,
            row_homogeneous: false
        });
        _ = this.gettext.bind(this);

        this._createRefreshIntervalControl();
        this._createDisplayModeControl();
        this._createResetScheduleControl();
        this._createResetDayOfWeekControl();
        this._createResetMonthdayControl();
        this._createResetTimeControl();
        this._createUnitToggleControl();
        this._createIconToggleControl();

        setTimeout(() => {
            this.updateControls();
        }, 100);
    }

    destruct() {
        this._rows = undefined;
        this._schema = undefined;
        _ = undefined;
        this.main = undefined;
    }

    _addRow(label, input, row) {
        let inputWidget = input;

        if (input instanceof Gtk.Switch) {
            inputWidget = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
            addChildToBox(inputWidget, input);
        }

        if (label) {
            this.main.attach(label, 0, row, 1, 1);
            this.main.attach(inputWidget, 1, row, 1, 1);
        }
        else {
            this.main.attach(inputWidget, 0, row, 2, 1);
        }
        this._rows[row] = { label, input: inputWidget };
    }

    _hideRow(row) {
        const label = this.main.get_child_at(0, row);
        const input = this.main.get_child_at(1, row);
        //Logger.log(`${row}. label: ${label} input: ${input}`);
        if (label) {
            this.main.remove(label);
        }
        if (input) {
            this.main.remove(input);
        }
    }

    _showRow(row) {
        const { label, input } = this._rows[row];
        //Logger.log(`${row}. label: ${label} input: ${input}`);
        if (!label.parent && !input.parent) {
            this.main.attach(label, 0, row, 1, 1);
            this.main.attach(input, 1, row, 1, 1);
        }
    }

    // 1. Refresh interval control number edit box.
    _createRefreshIntervalControl() {
        const intervalLabel = new Gtk.Label({
            label: _("Refresh Interval (ms)"),
            hexpand: true,
            halign: Gtk.Align.END
        });

        const intervalInput = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 500,
                upper: 5000,
                step_increment: 100
            })
        });
        this._addRow(intervalLabel, intervalInput, SettingRowOrder.REFRESH_INTERVAL);
        this.settings.bind(SettingKeys.REFRESH_INTERVAL, intervalInput, 'value', Gio.SettingsBindFlags.DEFAULT);
    }

    // 2. Display mode select drop down.
    _createDisplayModeControl() {
        const displayModeLabel = new Gtk.Label({
            label: _("What to show in status bar"),
            hexpand: true,
            halign: Gtk.Align.END
        });
        const displayMode = this.settings.get_string(SettingKeys.DISPLAY_MODE);
        const displayModeIndex = kDisplayModeMapping.getIndex(displayMode);

        const options = [
            { name: _("Total speed") },
            { name: _("Upload speed") },
            { name: _("Download speed") },
            { name: _("Upload and download speed") },
            { name: _("Total data used") },
        ];

        const displayModeInput = new Gtk.ComboBox({
            model: this._createOptionsList(options),
            active: displayModeIndex,
        });
        const rendererText = new Gtk.CellRendererText();
        displayModeInput.pack_start(rendererText, false);
        displayModeInput.add_attribute(rendererText, "text", 0);
        this._addRow(displayModeLabel, displayModeInput, SettingRowOrder.DISPLAY_MODE);
        displayModeInput.connect('changed', this._onDisplayModeInputChanged.bind(this));
    }

    // 3. Reset schedule drop down.
    _createResetScheduleControl() {
        const resetScheduleLabel = new Gtk.Label({
            label: _("When do you want to reset the stats ?"),
            hexpand: true,
            halign: Gtk.Align.END
        });
        const resetSchedule = this.settings.get_string(SettingKeys.RESET_SCHEDULE);
        const resetScheduleIndex = kResetScheduleMapping.getIndex(resetSchedule);

        const options = [
            { name: _("Daily") },
            { name: _("Weekly") },
            { name: _("BiWeekly") },
            { name: _("Monthly") },
            { name: _("Never") },
        ];

        const resetScheduleInput = new Gtk.ComboBox({
            model: this._createOptionsList(options),
            active: resetScheduleIndex,
        });
        const rendererText = new Gtk.CellRendererText();
        resetScheduleInput.pack_start(rendererText, false);
        resetScheduleInput.add_attribute(rendererText, "text", 0);
        this._addRow(resetScheduleLabel, resetScheduleInput, SettingRowOrder.RESET_SCHEDULE);
        resetScheduleInput.connect('changed', this._onResetScheduleInputChanged.bind(this));
    }

    // 4. Reset on day of week, in case week is selected.
    _createResetDayOfWeekControl() {
        const resetOnDayOfWeekLabel = new Gtk.Label({
            label: _("Reset on day of week"),
            hexpand: true,
            halign: Gtk.Align.END
        });
        const resetDayOfWeek = this.settings.get_string(SettingKeys.RESET_WEEK_DAY);
        const resetDayOfWeekIndex = kDayOfWeekMapping.getIndex(resetDayOfWeek);

        const options = [
            { name: _("Monday") },
            { name: _("Tuesday") },
            { name: _("Wednesday") },
            { name: _("Thursday") },
            { name: _("Friday") },
            { name: _("Saturday") },
            { name: _("Sunday") },
        ];

        const resetDayOfWeekInput = new Gtk.ComboBox({
            model: this._createOptionsList(options),
            active: resetDayOfWeekIndex,
        });
        const rendererText = new Gtk.CellRendererText();
        resetDayOfWeekInput.pack_start(rendererText, false);
        resetDayOfWeekInput.add_attribute(rendererText, "text", 0);
        this._addRow(resetOnDayOfWeekLabel, resetDayOfWeekInput, SettingRowOrder.RESET_WEEK_DAY);
        resetDayOfWeekInput.connect('changed', this._onResetDayOfWeekInputChanged.bind(this));
    }

    // 5. Day of month when Month is selected in reset schedule.
    _createResetMonthdayControl() {
        const resetOnDayOfMonthLabel = new Gtk.Label({
            label: _("Reset on day of month"),
            hexpand: true,
            halign: Gtk.Align.END
        });

        const resetOnDayOfMonthInput = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 31,
                step_increment: 1
            })
        });
        this._addRow(resetOnDayOfMonthLabel, resetOnDayOfMonthInput, SettingRowOrder.RESET_MONTH_DAY);
        this.settings.bind(SettingKeys.RESET_MONTH_DAY, resetOnDayOfMonthInput, 'value', Gio.SettingsBindFlags.DEFAULT);
    }

    // 6. Reset time Spin button control.
    _createResetTimeControl() {
        const resetTimeLabel = new Gtk.Label({
            label: _("What time should we reset network stats"),
            hexpand: true,
            halign: Gtk.Align.END
        });
        const resetHoursInput = new Gtk.SpinButton({
            wrap: true,
            numeric: true,
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 23,
                step_increment: 1
            }),
            orientation: Gtk.Orientation.VERTICAL
        });
        const timeSeparatorLabel = new Gtk.Label({
            label: ":",
            hexpand: false,
            halign: Gtk.Align.CENTER,
            use_markup: true
        })
        const resetMinutesInput = new Gtk.SpinButton({
            wrap: true,
            numeric: true,
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 59,
                step_increment: 1,
            }),
            orientation: Gtk.Orientation.VERTICAL
        });

        const resetTimeWidget = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
        addChildToBox(resetTimeWidget, resetHoursInput);
        addChildToBox(resetTimeWidget, timeSeparatorLabel);
        addChildToBox(resetTimeWidget, resetMinutesInput);

        this._addRow(resetTimeLabel, resetTimeWidget, SettingRowOrder.RESET_TIME);
        this.settings.bind(SettingKeys.RESET_HOURS, resetHoursInput, 'value', Gio.SettingsBindFlags.DEFAULT);
        this.settings.bind(SettingKeys.RESET_MINUTES, resetMinutesInput, 'value', Gio.SettingsBindFlags.DEFAULT);
    }

    // 7. Show numbers in bytes instead of bits
    _createUnitToggleControl() {
        const unitLabel = new Gtk.Label({
            label: _("Show speeds in bytes instead of bits"),
            hexpand: true,
            halign: Gtk.Align.END
        });

        const unitSwitch = new Gtk.Switch({
            halign: Gtk.Align.END,
            visible: true
        });
        this._addRow(unitLabel, unitSwitch, SettingRowOrder.DISPLAY_BYTES);
        this.settings.bind(SettingKeys.DISPLAY_BYTES, unitSwitch, 'state', Gio.SettingsBindFlags.DEFAULT);
    }

    // 8. Show icon in status bar
    _createIconToggleControl() {
        const iconLabel = new Gtk.Label({
            label: _("Show icon in status bar (requires reload)"),
            hexpand: true,
            halign: Gtk.Align.END
        });

        const iconSwitch = new Gtk.Switch({
            halign: Gtk.Align.END,
            visible: true
        });
        this._addRow(iconLabel, iconSwitch, SettingRowOrder.SHOW_ICON);
        this.settings.bind(SettingKeys.SHOW_ICON, iconSwitch, 'state', Gio.SettingsBindFlags.DEFAULT);
    }

    _createOptionsList(options) {
        const liststore = new Gtk.ListStore();
        liststore.set_column_types([GObject.TYPE_STRING])
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            const iter = liststore.append();
            liststore.set(iter, [0], [option.name]);
        }
        return liststore;
    }

    _onDisplayModeInputChanged(view) {
        const index = view.get_active();
        const mode = kDisplayModeMapping.getValue(index);
        this.settings.set_string(SettingKeys.DISPLAY_MODE, mode);
    }

    _onResetScheduleInputChanged(view) {
        const index = view.get_active();
        const mode = kResetScheduleMapping.getValue(index);
        this.settings.set_string(SettingKeys.RESET_SCHEDULE, mode);
        this.updateControls();
    }

    _onResetDayOfWeekInputChanged(view) {
        const index = view.get_active();
        const mode = kDayOfWeekMapping.getValue(index);
        this.settings.set_string(SettingKeys.RESET_WEEK_DAY, mode);
    }

    updateControls() {
        const resetSchedule = this.settings.get_string(SettingKeys.RESET_SCHEDULE);
        //Logger.log(`resetSchedule: ${resetSchedule}`);
        switch (resetSchedule) {
            default:
            case ResetSchedule.DAILY:
                this._hideRow(SettingRowOrder.RESET_WEEK_DAY);
                this._hideRow(SettingRowOrder.RESET_MONTH_DAY);
                this._showRow(SettingRowOrder.RESET_TIME);
                break;
            case ResetSchedule.WEEKLY:
            case ResetSchedule.BIWEEKLY:
                this._showRow(SettingRowOrder.RESET_WEEK_DAY);
                this._hideRow(SettingRowOrder.RESET_MONTH_DAY);
                this._showRow(SettingRowOrder.RESET_TIME);
                break;
            case ResetSchedule.MONTHLY:
                this._hideRow(SettingRowOrder.RESET_WEEK_DAY);
                this._showRow(SettingRowOrder.RESET_MONTH_DAY);
                this._showRow(SettingRowOrder.RESET_TIME);
                break;
            case ResetSchedule.NEVER:
                this._hideRow(SettingRowOrder.RESET_WEEK_DAY);
                this._hideRow(SettingRowOrder.RESET_MONTH_DAY);
                this._hideRow(SettingRowOrder.RESET_TIME);
                break;
        }
    }

    get settings() {
        if (!this._schema) {
            this._schema = this.getSettings(kSchemaName);
        }
        return this._schema;
    }

    fillPreferencesWindow(window) {
        window.connect("close-request", () => {
            console.log("closing the window");
            this.destruct();
            console.log("destruct the objects");
        });
        const group = new Adw.PreferencesGroup();
        group.add(this.main);

        const page = new Adw.PreferencesPage();
        page.add(group);

        window.add(page);
    }
}