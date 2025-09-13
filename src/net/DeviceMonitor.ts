import GLib from "gi://GLib";
import GObject from "gi://GObject";
import NetworkManager from "gi://NM";

import { DeviceType } from "../utils/Constants.js";
import type { Logger } from "../utils/Logger.js";

export interface Device {
    name: string;
    type: string;
    ip: string;
    device: any;
}

export interface SignalConnection {
    device: any;
    signal: number;
}

/*
* Device monitor class responsible maintaining active devices record.
* It handles addtion and removal of devices at run time.
*/

export class DeviceMonitor {
    private _textDecoder: TextDecoder;
    private _client: NetworkManager.Client;
    private _devices: Record<string, Device> = {};
    private _defaultGw: string = "";
    private _netMgrSignals: number[] = [];
    private _netMgrStateChangeSignals: SignalConnection[] = [];

    constructor(private _logger: Logger) {
        this._textDecoder = new TextDecoder;
        this._client = NetworkManager.Client.new(null);
        this.init();
    }

    getDevices(): Record<string, Device> {
        return this._devices;
    }

    hasDevice(name: string): boolean {
        return this._devices[name] !== undefined;
    }

    getDeviceByName(name: string): Device | undefined {
        return this._devices[name];
    }

    getActiveDeviceName(): string {
        return this._defaultGw;
    }

    getDeviceTypeFromName(deviceName: string): string {
        const device = this._client.get_device_by_iface(deviceName);
        return this.getDeviceTypeFromDevice(device);
    }

    getDeviceTypeFromDevice(device: any): string {
        if (device) {
            switch (device.device_type) {
                case NetworkManager.DeviceType.ETHERNET:
                    return DeviceType.ETHERNET;
                case NetworkManager.DeviceType.WIFI:
                    return DeviceType.WIFI;
                case NetworkManager.DeviceType.BT:
                    return DeviceType.BLUETOOTH;
                case NetworkManager.DeviceType.OLPC_MESH:
                    return DeviceType.OLPCMESH;
                case NetworkManager.DeviceType.WIMAX:
                    return DeviceType.WIMAX;
                case NetworkManager.DeviceType.MODEM:
                    return DeviceType.MODEM;
                default:
                    return DeviceType.NONE;
            }
        }
        return DeviceType.NONE;
    }

    init(): void {
        this._netMgrSignals.push(this._client.connect('any-device-added', this._deviceChanged.bind(this)));
        this._netMgrSignals.push(this._client.connect('any-device-removed', this._deviceChanged.bind(this)));
        this._netMgrSignals.push(this._client.connect('connection-added', this._connectionChanged.bind(this)));
        this._netMgrSignals.push(this._client.connect('connection-removed', this._connectionChanged.bind(this)));
        this._netMgrSignals.push(this._client.connect('active-connection-added', this._connectionChanged.bind(this)));
        this._netMgrSignals.push(this._client.connect('active-connection-removed', this._connectionChanged.bind(this)));

        this._loadDevices();
    }

    deinit(): void {
        this._netMgrSignals.forEach((sigId) => {
            this._client.disconnect(sigId);
        });
        this._netMgrSignals = [];
    }

    private _loadDevices(): void {
        // disconnect "state-changed" signals of previously stored devices.
        this._disconnectDeviceStateChangeSignals();

        const fileContent = GLib.file_get_contents('/proc/net/dev');
        const lines = this._textDecoder.decode(fileContent[1]).split("\n");

        const devices: string[] = [];
        for (let index = 2; index < lines.length - 1; ++index) {
            const line = lines[index].trim();
            this._logger.debug(`${index} - ${line}`);
            const fields = line.split(/[^A-Za-z0-9_-]+/);
            const deviceName = fields[0];

            if (deviceName == "lo")
                continue;

            devices.push(deviceName);
        }
        for (const name of devices) {
            const deviceObj = this._client.get_device_by_iface(name);
            const addresses = this._getIPAddress(deviceObj, GLib.SYSDEF_AF_INET);
            const type = this.getDeviceTypeFromDevice(deviceObj);
            this._devices[name] = {
                name,
                type,
                device: deviceObj,
                ip: addresses[0] || ""
            };
        }

        // connect "state-changed" signals of new stored devices.
        this._connectDeviceStateChangeSignals();

        this._updateDefaultDevice();
    }

    private _updateDefaultDevice(): void {
        let fileContent = GLib.file_get_contents('/proc/net/route');
        let lines = this._textDecoder.decode(fileContent[1]).split("\n");

        //first 2 lines are for header
        for (const line of lines) {
            let lineText = line.replace(/^ */g, "");
            let params = lineText.split("\t");
            if (params.length != 11) // ignore empty lines
                continue;
            // So store up/down values
            if (params[1] == "00000000") {
                this._defaultGw = params[0];
            }
        }
        this._logger.debug(`default gateway: ${this._defaultGw}`);
    }

    private _connectDeviceStateChangeSignals(): void {
        for (const [_key, item] of Object.entries(this._devices)) {
            const signalId = item.device.connect('state-changed', this._deviceStateChanged.bind(this));
            this._netMgrStateChangeSignals.push({ device: item.device, signal: signalId });
        }
    }

    private _disconnectDeviceStateChangeSignals(): void {
        this._netMgrStateChangeSignals.forEach((item) => {
            //item.device.disconnect(item.signal);
            GObject.signal_handler_disconnect(item.device, item.signal);
        });
        this._netMgrStateChangeSignals = [];
    }

    private _deviceStateChanged(): void {
        this._loadDevices();
    }

    private _deviceChanged(): void {
        this._loadDevices();
    }

    private _connectionChanged(): void {
        this._loadDevices();
    }

    private _getIPAddress(device: any, family: number): string[] {
        let addresses: string[] = [];
        let ipConfig: any;
        if (family == GLib.SYSDEF_AF_INET)
            ipConfig = device.get_ip4_config();
        else
            ipConfig = device.get_ip6_config();

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

        for (let netAddress of netMgrAddresses) {
            const addr = netAddress.get_address();
            //const prefix = netAddress.get_prefix();
            addresses.push(addr);
        }

        return addresses;
    }
}
