import Adw from "gi://Adw";
import Gio from "gi://Gio";
import GObject from "gi://GObject";
import Gtk from "gi://Gtk";
import { ExtensionMetadata } from "@girs/gnome-shell/extensions/extension";
import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

import {
    DisplayMode,
    ResetSchedule,
    DayOfWeek,
    SettingKeys,
    kSchemaName,
    DevicesListType
} from "./lib/utils/Constants.js";
import { setTimeout } from "./lib/utils/DateTimeUtils.js";
import { addChildToBox } from "./lib/utils/GtkUtils.js";
import { ReverseMap } from "./lib/utils/ReverseMap.js";

const DisplayModeOrder = [
    DisplayMode.TOTAL_SPEED,
    DisplayMode.UPLOAD_SPEED,
    DisplayMode.DOWNLOAD_SPEED,
    DisplayMode.BOTH_SPEED,
    DisplayMode.TOTAL_DATA
];

const ResetScheduleOrder = [
    ResetSchedule.DAILY,
    ResetSchedule.WEEKLY,
    ResetSchedule.BIWEEKLY,
    ResetSchedule.MONTHLY,
    ResetSchedule.NEVER
];

const DayOfWeekOrder = [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
    DayOfWeek.SUNDAY
];

const DevicesListOrder = [
    DevicesListType.ALL,
    DevicesListType.ACTIVE,
    DevicesListType.METERED,
    DevicesListType.PREFERED,
    DevicesListType.NON_DUMMY
];

const kDisplayModeMapping = new ReverseMap<number, DisplayMode>(DisplayModeOrder);
const kDevicesListMapping = new ReverseMap<number, DevicesListType>(DevicesListOrder);
const kResetScheduleMapping = new ReverseMap<number, ResetSchedule>(ResetScheduleOrder);
const kDayOfWeekMapping = new ReverseMap<number, DayOfWeek>(DayOfWeekOrder);

enum SettingRowOrder {
    REFRESH_INTERVAL = 0,
    DISPLAY_MODE,
    DEVICES_LIST_TYPE,
    RESET_SCHEDULE,
    RESET_WEEK_DAY,
    RESET_MONTH_DAY,
    RESET_TIME,
    RESET_ALL_STATS,
    STATUS_FONT_SIZE,
    DISPLAY_BYTES,
    STATUS_SHOW_ICON
}

interface RowEntry {
    label: InstanceType<typeof Gtk.Label>;
    input: InstanceType<typeof Gtk.Widget>;
}

type GetTextFunc = (_in: string) => string;

let _: GetTextFunc;

export default class GnsPreferences extends ExtensionPreferences {
    private _rows: Partial<Record<SettingRowOrder, RowEntry>>;
    private _schema?: Gio.Settings;
    private main: Gtk.Grid;

    constructor(props: ExtensionMetadata) {
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
        this._createResetAllInterfacesControl();
        this._createMainLabelFontSizeControl();
        this._createUnitToggleControl();
        this._createIconToggleControl();
        this._createDevicesListControl();

        setTimeout(() => {
            this.updateControls();
        }, 100);
    }

    destruct() {
        this._rows = {};
        this._schema = undefined;
        // @ts-ignore
        this.main = undefined;
        // @ts-ignore
        _ = undefined;
    }

    _addRow(label: Gtk.Label, input: Gtk.Widget, row: SettingRowOrder) {
        let inputWidget = input;

        if (input instanceof Gtk.Switch) {
            inputWidget = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
            addChildToBox(<Gtk.Box>inputWidget, input);
        }

        if (label) {
            this.main.attach(label, 0, row, 1, 1);
            this.main.attach(inputWidget, 1, row, 1, 1);
        } else {
            this.main.attach(inputWidget, 0, row, 2, 1);
        }
        this._rows[row] = { label, input: inputWidget };
    }

    _hideRow(row: SettingRowOrder) {
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

    _showRow(row: SettingRowOrder) {
        const { label, input } = this._rows[row] || {};
        //Logger.log(`${row}. label: ${label} input: ${input}`);
        if (!label || !input) {
            return;
        }
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
        this.settings.bind(
            SettingKeys.REFRESH_INTERVAL,
            intervalInput,
            "value",
            Gio.SettingsBindFlags.DEFAULT
        );
    }

    // 2. Display mode select drop down.
    _createDisplayModeControl() {
        const displayModeLabel = new Gtk.Label({
            label: _("What to show in status bar"),
            hexpand: true,
            halign: Gtk.Align.END
        });
        const displayMode = this.settings.get_string(SettingKeys.DISPLAY_MODE) as DisplayMode;
        const displayModeIndex = kDisplayModeMapping.getKey(displayMode) ?? -1;

        const options = [
            { name: _("Total speed") },
            { name: _("Upload speed") },
            { name: _("Download speed") },
            { name: _("Upload and download speed") },
            { name: _("Total data used") }
        ];

        const displayModeInput = new Gtk.ComboBox({
            model: this._createOptionsList(options),
            active: displayModeIndex
        });
        const rendererText = new Gtk.CellRendererText();
        displayModeInput.pack_start(rendererText, false);
        displayModeInput.add_attribute(rendererText, "text", 0);
        this._addRow(displayModeLabel, displayModeInput, SettingRowOrder.DISPLAY_MODE);
        displayModeInput.connect("changed", this._onDisplayModeInputChanged.bind(this));
    }

    // 3. Reset schedule drop down.
    _createResetScheduleControl() {
        const resetScheduleLabel = new Gtk.Label({
            label: _("When do you want to reset the stats ?"),
            hexpand: true,
            halign: Gtk.Align.END
        });
        const resetSchedule = this.settings.get_string(SettingKeys.RESET_SCHEDULE) as ResetSchedule;
        const resetScheduleIndex = kResetScheduleMapping.getKey(resetSchedule) ?? -1;

        const options = [
            { name: _("Daily") },
            { name: _("Weekly") },
            { name: _("BiWeekly") },
            { name: _("Monthly") },
            { name: _("Never") }
        ];

        const resetScheduleInput = new Gtk.ComboBox({
            model: this._createOptionsList(options),
            active: resetScheduleIndex
        });
        const rendererText = new Gtk.CellRendererText();
        resetScheduleInput.pack_start(rendererText, false);
        resetScheduleInput.add_attribute(rendererText, "text", 0);
        this._addRow(resetScheduleLabel, resetScheduleInput, SettingRowOrder.RESET_SCHEDULE);
        resetScheduleInput.connect("changed", this._onResetScheduleInputChanged.bind(this));
    }

    // 4. Reset on day of week, in case week is selected.
    _createResetDayOfWeekControl() {
        const resetOnDayOfWeekLabel = new Gtk.Label({
            label: _("Reset on day of week"),
            hexpand: true,
            halign: Gtk.Align.END
        });
        const resetDayOfWeek = this.settings.get_string(SettingKeys.RESET_WEEK_DAY) as DayOfWeek;
        const resetDayOfWeekIndex = kDayOfWeekMapping.getKey(resetDayOfWeek) ?? -1;

        const options = [
            { name: _("Monday") },
            { name: _("Tuesday") },
            { name: _("Wednesday") },
            { name: _("Thursday") },
            { name: _("Friday") },
            { name: _("Saturday") },
            { name: _("Sunday") }
        ];

        const resetDayOfWeekInput = new Gtk.ComboBox({
            model: this._createOptionsList(options),
            active: resetDayOfWeekIndex
        });
        const rendererText = new Gtk.CellRendererText();
        resetDayOfWeekInput.pack_start(rendererText, false);
        resetDayOfWeekInput.add_attribute(rendererText, "text", 0);
        this._addRow(resetOnDayOfWeekLabel, resetDayOfWeekInput, SettingRowOrder.RESET_WEEK_DAY);
        resetDayOfWeekInput.connect("changed", this._onResetDayOfWeekInputChanged.bind(this));
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
        this._addRow(
            resetOnDayOfMonthLabel,
            resetOnDayOfMonthInput,
            SettingRowOrder.RESET_MONTH_DAY
        );
        this.settings.bind(
            SettingKeys.RESET_MONTH_DAY,
            resetOnDayOfMonthInput,
            "value",
            Gio.SettingsBindFlags.DEFAULT
        );
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
        });
        const resetMinutesInput = new Gtk.SpinButton({
            wrap: true,
            numeric: true,
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 59,
                step_increment: 1
            }),
            orientation: Gtk.Orientation.VERTICAL
        });

        const resetTimeWidget = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
        addChildToBox(resetTimeWidget, resetHoursInput);
        addChildToBox(resetTimeWidget, timeSeparatorLabel);
        addChildToBox(resetTimeWidget, resetMinutesInput);

        this._addRow(resetTimeLabel, resetTimeWidget, SettingRowOrder.RESET_TIME);
        this.settings.bind(
            SettingKeys.RESET_HOURS,
            resetHoursInput,
            "value",
            Gio.SettingsBindFlags.DEFAULT
        );
        this.settings.bind(
            SettingKeys.RESET_MINUTES,
            resetMinutesInput,
            "value",
            Gio.SettingsBindFlags.DEFAULT
        );
    }

    // 7. Main label font size control.
    _createResetAllInterfacesControl() {
        const resetAllLabel = new Gtk.Label({
            label: _("Reset all interfaces"),
            hexpand: true,
            halign: Gtk.Align.END
        });

        const resetAllButton = new Gtk.Button({ label: _("Reset now") });
        resetAllButton.connect("clicked", this._onResetAllInterfacesClicked.bind(this));
        this._addRow(resetAllLabel, resetAllButton, SettingRowOrder.RESET_ALL_STATS);
    }

    // 8. Show numbers in bytes instead of bits
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
        this.settings.bind(
            SettingKeys.DISPLAY_BYTES,
            unitSwitch,
            "state",
            Gio.SettingsBindFlags.DEFAULT
        );
    }

    // 9. Show icon in status bar
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
        this._addRow(iconLabel, iconSwitch, SettingRowOrder.STATUS_SHOW_ICON);
        this.settings.bind(
            SettingKeys.STATUS_SHOW_ICON,
            iconSwitch,
            "state",
            Gio.SettingsBindFlags.DEFAULT
        );
    }

    // 10. Main label font size control.
    _createMainLabelFontSizeControl() {
        const fontSizeLabel = new Gtk.Label({
            label: _("Font size (status label)"),
            hexpand: true,
            halign: Gtk.Align.END
        });

        const fontSizeInput = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 10,
                upper: 48,
                step_increment: 1
            })
        });
        this._addRow(fontSizeLabel, fontSizeInput, SettingRowOrder.STATUS_FONT_SIZE);
        this.settings.bind(
            SettingKeys.STATUS_FONT_SIZE,
            fontSizeInput,
            "value",
            Gio.SettingsBindFlags.DEFAULT
        );
    }

    // 11. Devices list select drop down.
    _createDevicesListControl() {
        const displayModeLabel = new Gtk.Label({
            label: _("Show devices/interfaces"),
            hexpand: true,
            halign: Gtk.Align.END
        });
        const displayListType = this.settings.get_string(
            SettingKeys.DEVICES_LIST_TYPE
        ) as DevicesListType;
        const displayModeIndex = kDevicesListMapping.getKey(displayListType) ?? -1;

        const options = [
            { name: _("All") },
            { name: _("Active") },
            { name: _("Metered") },
            { name: _("Prefered") },
            { name: _("Non dummy") }
        ];

        const displayListInput = new Gtk.ComboBox({
            model: this._createOptionsList(options),
            active: displayModeIndex
        });
        const rendererText = new Gtk.CellRendererText();
        displayListInput.pack_start(rendererText, false);
        displayListInput.add_attribute(rendererText, "text", 0);
        this._addRow(displayModeLabel, displayListInput, SettingRowOrder.DEVICES_LIST_TYPE);
        displayListInput.connect("changed", this._onDevicesListInputChanged.bind(this));
    }

    _createOptionsList(options: Array<{ name: string }>) {
        const liststore = new Gtk.ListStore();
        liststore.set_column_types([GObject.TYPE_STRING]);
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            const iter = liststore.append();
            liststore.set(iter, [0], [option.name]);
        }
        return liststore;
    }

    _onDevicesListInputChanged(view: Gtk.ComboBox) {
        const index = view.get_active();
        const value = kDevicesListMapping.getValue(index);
        this.settings.set_string(SettingKeys.DEVICES_LIST_TYPE, value);
    }

    _onDisplayModeInputChanged(view: Gtk.ComboBox) {
        const index = view.get_active();
        const mode = kDisplayModeMapping.getValue(index);
        this.settings.set_string(SettingKeys.DISPLAY_MODE, mode);
    }

    _onResetScheduleInputChanged(view: Gtk.ComboBox) {
        const index = view.get_active();
        const mode = kResetScheduleMapping.getValue(index);
        this.settings.set_string(SettingKeys.RESET_SCHEDULE, mode);
        this.updateControls();
    }

    _onResetDayOfWeekInputChanged(view: Gtk.ComboBox) {
        const index = view.get_active();
        const mode = kDayOfWeekMapping.getValue(index);
        this.settings.set_string(SettingKeys.RESET_WEEK_DAY, mode);
    }

    _onResetAllInterfacesClicked(_view: InstanceType<typeof Gtk.Widget>) {
        this.settings.set_boolean(SettingKeys.RESET_ALL_STATS, true);
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

    get settings(): Gio.Settings {
        if (!this._schema) {
            this._schema = this.getSettings(kSchemaName);
        }
        return this._schema;
    }

    async fillPreferencesWindow(window: Adw.PreferencesWindow): Promise<void> {
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
