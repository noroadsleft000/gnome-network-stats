var DeviceType = Object.freeze({
    ETHERNET: "ethernet",
    WIFI: "wifi",
    BLETOOTH: "bt",
    OLPCMESH : "olpcmesh",
    WIMAX: "wimax",
    MODEM: "modem",
    NONE: "none"
});

var IconType = Object.freeze({
    UP: "arrow-up.svg",
    DOWN: "arrow-down.svg",
    UPDOWN: "arrow-down-up.svg",
    SETTINGS: "gear.svg",

    ETHERNET: "1ethernet_black_24dp.svg",
    WIFI: "wifi_black_24dp.svg",
    BLUETOOTH: "bluetooth_black_24dp.svg",
});

var DisplayMode = Object.freeze({
    TOTAL_SPEED: "total_speed",
    UPLOAD_SPEED: "upload_speed",
    DOWNLOAD_SPEED: "download_speed",
    BOTH_SPEED: "both_speed",
    TOTAL_DATA: "total_data",
    DEFAULT: "total_speed"
});


var kSchemaName = "org.gnome.shell.extensions.network-stats";

/* Sync these constants properly with schema file */
var SettingKeys = Object.freeze({
    REFRESH_INTERVAL: "refresh-interval",
    DISPLAY_MODE: "display-mode",
    RESET_TIME: "reset-time",
    RESET_HOURS: "reset-hours",
    RESET_MINUTES: "reset-minutes",
    DEVICES_INFO: "devices-info",
    PREFERED_DEVICE: "prefered-device"
});