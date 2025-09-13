export const kExtensionId = "network-stats@gnome.noroadsleft.xyz";
export const kSchemaName = "org.gnome.shell.extensions.network-stats";
export const kGtextDomain = "network-stats";
export const kRefreshInterval = 2 * 1000; // seconds

export enum DeviceType {
    ETHERNET = "ethernet",
    WIFI = "wifi",
    BLUETOOTH = "bt",
    OLPCMESH = "olpcmesh",
    WIMAX = "wimax",
    MODEM = "modem",
    NONE = "none"
}

export enum DisplayMode {
    TOTAL_SPEED = "total_speed",
    UPLOAD_SPEED = "upload_speed",
    DOWNLOAD_SPEED = "download_speed",
    BOTH_SPEED = "both_speed",
    TOTAL_DATA = "total_data",
    DEFAULT = "total_speed"
}

export enum ResetSchedule {
    DAILY = "daily",
    WEEKLY = "weekly",
    BIWEEKLY = "biweekly",
    MONTHLY = "monthly",
    NEVER = "never"
}

export enum DayOfWeek {
    MONDAY = "monday",
    TUESDAY = "tuesday",
    WEDNESDAY = "wednesday",
    THURSDAY = "thursday",
    FRIDAY = "friday",
    SATURDAY = "saturday",
    SUNDAY = "sunday"
}

/* Sync these constants properly with schema file */
export enum SettingKeys {
    REFRESH_INTERVAL = "refresh-interval",
    DISPLAY_MODE = "display-mode",
    RESET_SCHEDULE = "reset-schedule",
    RESET_WEEK_DAY = "reset-week-day",
    RESET_MONTH_DAY = "reset-month-day",
    RESET_HOURS = "reset-hours",
    RESET_MINUTES = "reset-minutes",
    DEVICES_INFO = "devices-info",
    PREFERED_DEVICE = "prefered-device",
    DISPLAY_BYTES = "display-bytes",
    STATUS_SHOW_ICON = "show-icon",
    STATUS_FONT_SIZE = "status-font-size",
    RESET_ALL_STATS = "reset-all-stats"
}
