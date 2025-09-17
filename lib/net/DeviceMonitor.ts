import GLib from "gi://GLib";
import GObject from "gi://GObject";
import NM from "gi://NM";

import { DeviceType } from "../utils/Constants.js";
import type { Logger } from "../utils/Logger.js";

type NMDevice = NM.Device;

export interface DeviceInfo {
    name: string;
    type: string;
    ip: string;
    active: boolean;
    metered: boolean;
    dummy: boolean;
    device: NMDevice;
}

export interface SignalConnection {
    device: NMDevice;
    signal: number;
}

/*
 * Device monitor class responsible maintaining active devices record.
 * It handles addtion and removal of devices at run time.
 */

export class DeviceMonitor {
    private _textDecoder: TextDecoder;
    private _client: NM.Client;
    private _devices: Record<string, DeviceInfo> = {};
    private _defaultGw: string = "";
    private _netMgrSignals: number[] = [];
    private _netMgrStateChangeSignals: SignalConnection[] = [];

    constructor(private _logger: Logger) {
        this._textDecoder = new TextDecoder();
        this._client = NM.Client.new(null);
        this.init();
    }

    /**
     * Returns the list of all devices.
     * @returns list of all devices.
     */
    getDevices(): Record<string, DeviceInfo> {
        return this._devices;
    }

    /**
     * Checks if a device is present in the list.
     * @param name - Name of the device
     * @returns true if device is present in the list.
     */
    hasDevice(name: string): boolean {
        return this._devices[name] !== undefined;
    }

    /**
     * Returns the device info by name.
     * @param name - Name of the device
     * @returns device info if found, undefined otherwise.
     */
    getDeviceByName(name: string): DeviceInfo | undefined {
        return this._devices[name];
    }

    /**
     * Returns the active device name.
     * @returns active device name.
     */
    getActiveDeviceName(): string {
        return this._defaultGw;
    }

    /**
     * Returns the device type by name.
     * @param deviceName - Name of the device
     * @returns device type.
     */
    getDeviceTypeFromName(deviceName: string): string {
        const device = this._client.get_device_by_iface(deviceName);
        return this.getDeviceType(device);
    }

    /**
     * Returns the device type.
     * @param device - Network device
     * @returns device type.
     */
    getDeviceType(device: NMDevice): DeviceType {
        if (device) {
            switch (device.device_type) {
                case NM.DeviceType.ETHERNET:
                    return DeviceType.ETHERNET;
                case NM.DeviceType.WIFI:
                    return DeviceType.WIFI;
                case NM.DeviceType.BT:
                    return DeviceType.BLUETOOTH;
                case NM.DeviceType.OLPC_MESH:
                    return DeviceType.OLPCMESH;
                case NM.DeviceType.WIMAX:
                    return DeviceType.WIMAX;
                case NM.DeviceType.MODEM:
                    return DeviceType.MODEM;
                default:
                    return DeviceType.NONE;
            }
        }
        return DeviceType.NONE;
    }

    /**
     * Checks if a device/connection is active.
     * @param device - Network device
     * @returns true if device is active
     */
    isActive(device: NM.Device) {
        return device.get_state() === NM.DeviceState.ACTIVATED;
    }

    /**
     * Checks if a connection is metered connection
     * @param client - Netwoker manager connection
     * @returns true if connection is metered connection.
     */
    isMetered(client: NM.Device) {
        // Get metered property
        const metered = client.get_metered();
        // NM.Metered values:
        // 0: UNKNOWN
        // 1: YES
        // 2: NO
        // 3: GUESS_YES
        // 4: GUESS_NO
        return metered === NM.Metered.YES || metered === NM.Metered.GUESS_YES;
    }

    /**
     * Checks if a device is dummy device
     * @param device - Network device
     * @returns true if device is dummy device
     */
    isDummy(device: NM.Device): boolean {
        return device.get_device_type() === NM.DeviceType.DUMMY;
    }

    /**
     * Checks if a device is loopback device
     * @param device - Network device
     * @returns true if device is loopback device
     */
    isLoopback(device: NM.Device) {
        return device.get_device_type() === NM.DeviceType.LOOPBACK;
    }

    /**
     * Initializes the device monitor.
     * It connects to the network manager signals to get the device changes.
     */
    init(): void {
        this._netMgrSignals.push(
            this._client.connect("any-device-added", this._deviceChanged.bind(this))
        );
        this._netMgrSignals.push(
            this._client.connect("any-device-removed", this._deviceChanged.bind(this))
        );
        this._netMgrSignals.push(
            this._client.connect("device-added", this._deviceChanged.bind(this))
        );
        this._netMgrSignals.push(
            this._client.connect("device-removed", this._deviceChanged.bind(this))
        );
        this._netMgrSignals.push(
            this._client.connect("connection-added", this._connectionChanged.bind(this))
        );
        this._netMgrSignals.push(
            this._client.connect("connection-removed", this._connectionChanged.bind(this))
        );
        this._netMgrSignals.push(
            this._client.connect("active-connection-added", this._connectionChanged.bind(this))
        );
        this._netMgrSignals.push(
            this._client.connect("active-connection-removed", this._connectionChanged.bind(this))
        );
        this._netMgrSignals.push(
            this._client.connect("notify::metered", this._deviceChanged.bind(this))
        );

        this._loadDevices();
    }

    /**
     * Deinitializes the device monitor.
     * It disconnects from the network manager signals.
     */
    deinit(): void {
        this._netMgrSignals.forEach((sigId) => {
            this._client.disconnect(sigId);
        });
        this._netMgrSignals = [];
    }

    /**
     * Loads the devices from the system.
     * It disconnects "state-changed" signals of previously stored devices.
     * It connects "state-changed" signals of new stored devices.
     * It updates the default device.
     */
    private _loadDevices(): void {
        // disconnect "state-changed" signals of previously stored devices.
        this._disconnectDeviceStateChangeSignals();

        const fileContent = GLib.file_get_contents("/proc/net/dev");
        const lines = this._textDecoder.decode(fileContent[1]).split("\n");

        const devices: string[] = [];
        for (let index = 2; index < lines.length - 1; ++index) {
            const line = lines[index].trim();
            this._logger.debug(`${index} - ${line}`);
            const fields = line.split(/[^A-Za-z0-9_-]+/);
            const deviceName = fields[0];

            if (deviceName == "lo") continue;

            devices.push(deviceName);
        }
        for (const name of devices) {
            const deviceObj = this._client.get_device_by_iface(name);
            const addresses = this._getIPAddress(deviceObj, GLib.SYSDEF_AF_INET);
            const type = this.getDeviceType(deviceObj);
            const active = this.isActive(deviceObj);
            const metered = this.isMetered(deviceObj);
            const dummy = this.isDummy(deviceObj);
            this._devices[name] = {
                name,
                type,
                device: deviceObj,
                ip: addresses[0] || "",
                active,
                metered,
                dummy
            };
        }

        // connect "state-changed" signals of new stored devices.
        this._connectDeviceStateChangeSignals();

        this._updateDefaultDevice();
    }

    /**
     * Updates the default device.
     * It reads the default gateway from the system.
     */
    private _updateDefaultDevice(): void {
        const fileContent = GLib.file_get_contents("/proc/net/route");
        const lines = this._textDecoder.decode(fileContent[1]).split("\n");

        //first 2 lines are for header
        for (const line of lines) {
            const lineText = line.replace(/^ */g, "");
            const params = lineText.split("\t");
            if (params.length != 11)
                // ignore empty lines
                continue;
            // So store up/down values
            if (params[1] == "00000000") {
                this._defaultGw = params[0];
            }
        }
        this._logger.debug(`default gateway: ${this._defaultGw}`);
    }

    /**
     * Connects the device state change signals.
     */
    private _connectDeviceStateChangeSignals(): void {
        for (const item of Object.values(this._devices)) {
            const signalId = item.device.connect(
                "state-changed",
                this._deviceStateChanged.bind(this)
            );
            this._netMgrStateChangeSignals.push({ device: item.device, signal: signalId });
        }
    }

    /**
     * Disconnects the device state change signals.
     */
    private _disconnectDeviceStateChangeSignals(): void {
        this._netMgrStateChangeSignals.forEach((item) => {
            //item.device.disconnect(item.signal);
            GObject.signal_handler_disconnect(item.device, item.signal);
        });
        this._netMgrStateChangeSignals = [];
    }

    /**
     * Handles the device state changed signal.
     * It reloads the devices.
     */
    private _deviceStateChanged(): void {
        this._loadDevices();
    }

    /**
     * Handles the device changed signal.
     * It reloads the devices.
     */
    private _deviceChanged(): void {
        this._loadDevices();
    }

    /**
     * Handles the connection changed signal.
     * It reloads the devices.
     */
    private _connectionChanged(): void {
        this._loadDevices();
    }

    /**
     * Returns the IP addresses of the device.
     * @param device - Network device
     * @param family - IP address family
     * @returns IP addresses of the device.
     */
    private _getIPAddress(device: NMDevice, family: number): string[] {
        const addresses: string[] = [];
        let ipConfig: NM.IPConfig | null = null;
        if (family == GLib.SYSDEF_AF_INET) ipConfig = device.get_ip4_config();
        else ipConfig = device.get_ip6_config();

        if (ipConfig == null) {
            this._logger.info(`No config found for device '${device.get_iface()}'`);
            addresses[0] = "-";
            return addresses;
        }

        const netMgrAddresses = ipConfig.get_addresses();
        if (netMgrAddresses.length == 0) {
            this._logger.info(`No IP addresses found for device '${device.get_iface()}'`);
            addresses[0] = "-";
            return addresses;
        }

        for (const netAddress of netMgrAddresses) {
            const addr = netAddress.get_address();
            //const prefix = netAddress.get_prefix();
            addresses.push(addr);
        }

        return addresses;
    }
}
