const { Gio, GObject, Gtk } = imports.gi;
const Lang = imports.lang;
const Pango = imports.gi.Pango;
const Gettext = imports.gettext;
const _ = Gettext.domain("network-stats").gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const { DisplayMode } = Me.imports.utils.Constants;
const { SettingKeys } = Me.imports.utils.Constants;
const { logger } = Me.imports.utils.Logger;
const { appSettingsModel } = Me.imports.AppSettingsModel;

const kSchemaName = "org.gnome.shell.extensions.network-stats";


function init() {
    logger.debug("init");
    const localeDir = Me.dir.get_child("locale");
    if (localeDir.query_exists(null)) {
        Gettext.bindtextdomain("network-stats", localeDir.get_path());
    }
}

const kIndexToDisplayModeMap = {
    0: DisplayMode.TOTAL_SPEED,
    1: DisplayMode.UPLOAD_SPEED,
    2: DisplayMode.DOWNLOAD_SPEED,
    3: DisplayMode.TOTAL_DATA
};

const kDisplayModeToIndexMap = {
    [DisplayMode.TOTAL_SPEED]: 0,
    [DisplayMode.UPLOAD_SPEED]: 1,
    [DisplayMode.DOWNLOAD_SPEED]: 2,
    [DisplayMode.TOTAL_DATA]: 3
};

function indexToDisplayMode(index) {
    let mode = DisplayMode.DEFAULT;
    if (kIndexToDisplayModeMap[index] != undefined) {
        mode = kIndexToDisplayModeMap[index];
    }
    return mode;
}

function displayModeToIndex(mode) {
    let index = 0;
    if (kDisplayModeToIndexMap[mode] != undefined) {
        index = parseInt(kDisplayModeToIndexMap[mode]);
    }
    return index;
}


class PrefsApp {
    constructor() {
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


        // values
        const displayMode = this.schema.get_string(SettingKeys.DISPLAY_MODE);
        const displayModeIndex = displayModeToIndex(displayMode);

        this._intervalInput = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 500,
                upper: 5000,
                step_increment: 100
            })
        });

        this._displayModeInput = new Gtk.ComboBox({
            model: this._createDisplayModeOptions(),
            active: displayModeIndex,
        });
        const rendererText = new Gtk.CellRendererText();
        this._displayModeInput.pack_start(rendererText, false);
        this._displayModeInput.add_attribute(rendererText, "text", 0);

        this._hoursInput = new Gtk.SpinButton({
            wrap: true,
            numeric: true,
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 23,
                step_increment: 1
            }),
            orientation: Gtk.Orientation.VERTICAL
        });
        this._minutesInput = new Gtk.SpinButton({
            wrap: true,
            numeric: true,
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 59,
                step_increment: 1,
            }),
            orientation: Gtk.Orientation.VERTICAL
        });
        const resetTimeWidget = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
        resetTimeWidget.add(this._hoursInput);
        resetTimeWidget.add(new Gtk.Label({
            label: "<span size=\"large\">:</span>",
            hexpand: false,
            halign: Gtk.Align.END,
            use_markup: true
        }));
        resetTimeWidget.add(this._minutesInput);


        const intervalLabel = new Gtk.Label({
            label: _(_("Refresh Interval (ms)")),
            hexpand: true,
            halign: Gtk.Align.START
        });
        const displayModeLabel  = new Gtk.Label({
            label: _("What to show in top bar"),
            hexpand: true,
            halign: Gtk.Align.START
        });
        const resetTimeLabel  = new Gtk.Label({
            label: _("What time should we reset network stats"),
            hexpand: true,
            halign: Gtk.Align.START
        });


        const addRow = ((main) => {
            let row = 0;
            return (label, input) => {
                let inputWidget = input;

                if (input instanceof Gtk.Switch) {
                    inputWidget = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL,});
                    inputWidget.append(input);
                }

                if (label) {
                    main.attach(label, 0, row, 1, 1);
                    main.attach(inputWidget, 1, row, 1, 1);
                }
                else {
                    main.attach(inputWidget, 0, row, 2, 1);
                }

                row++;
            };
        })(this.main);

        addRow(intervalLabel,         this._intervalInput);
        addRow(displayModeLabel,      this._displayModeInput);
        addRow(resetTimeLabel,        resetTimeWidget);

        this.schema.bind(SettingKeys.REFRESH_INTERVAL, this._intervalInput, 'value', Gio.SettingsBindFlags.DEFAULT);
        this.schema.bind(SettingKeys.RESET_HOURS, this._hoursInput, 'value', Gio.SettingsBindFlags.DEFAULT);
        this.schema.bind(SettingKeys.RESET_MINUTES, this._minutesInput, 'value', Gio.SettingsBindFlags.DEFAULT);
        this._displayModeInput.connect('changed', Lang.bind(this, this._displayModeInputChanged));
    }

    _createDisplayModeOptions() {
        const options = [
            { name: _("Total speed") },
            { name: _("Upload speed") },
            { name: _("Download speed") },
            { name: _("Total data used") },
        ];
        const liststore = new Gtk.ListStore();
        liststore.set_column_types([GObject.TYPE_STRING])
        for (let i = 0; i < options.length; i++ ) {
            const option = options[i];
            const iter = liststore.append();
            liststore.set(iter, [0], [option.name]);
        }
        return liststore;
    }

    _displayModeInputChanged(view) {
        logger.debug("_displayModeInputChanged");
        const index = view.get_active();
        const mode = indexToDisplayMode(index);
        this.schema.set_string(SettingKeys.DISPLAY_MODE, mode);
    }

    get schema() {
        if (!this._schema) {
            const schemaDir = Me.dir.get_child('schemas').get_path();
            const schemaSource = Gio.SettingsSchemaSource.new_from_directory(schemaDir, Gio.SettingsSchemaSource.get_default(), false);
            const schema = schemaSource.lookup(kSchemaName, false);
            this._schema = new Gio.Settings({ settings_schema: schema });
        }
        return this._schema;
    }
}

function buildPrefsWidget() {
    logger.debug("buildPrefsWidget");
    const widget = new PrefsApp();
    widget.main.show_all();
    return widget.main;
};