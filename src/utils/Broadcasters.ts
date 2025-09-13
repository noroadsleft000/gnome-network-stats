import { EventBroadcaster } from "./EventBroadcaster.js";

interface DeviceResetMessage {
    name: string;
}

interface TitleClickedMessage {
    // Add properties as needed
    button: string;
}

export class Broadcasters {
    private _deviceResetMessageBroadcaster?: EventBroadcaster<DeviceResetMessage>;
    private _titleClickedMessageBroadcaster?: EventBroadcaster<TitleClickedMessage>;

    static _instance: Broadcasters;

    static getInstance() {
        if (!this._instance) {
            this._instance = new Broadcasters();
        }
        return this._instance;
    }

    constructor() {
        this._deviceResetMessageBroadcaster = new EventBroadcaster<DeviceResetMessage>();
        this._titleClickedMessageBroadcaster = new EventBroadcaster<TitleClickedMessage>();
    }

    destruct(): void {
        if (this._deviceResetMessageBroadcaster) {
            this._deviceResetMessageBroadcaster = undefined;
        }
        if (this._titleClickedMessageBroadcaster) {
            this._titleClickedMessageBroadcaster = undefined;
        }
    }

    static get deviceResetMessageBroadcaster() {
        return Broadcasters.getInstance()._deviceResetMessageBroadcaster;
    }

    static get titleClickedMessageBroadcaster() {
        return Broadcasters.getInstance()._titleClickedMessageBroadcaster;
    }
}
