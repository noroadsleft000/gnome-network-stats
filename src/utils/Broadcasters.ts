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

    static _instance?: Broadcasters;

    static getInstance() {
        if (!this._instance) {
            this._instance = new Broadcasters();
        }
        return this._instance;
    }

    static releaseInstance(): void {
        if (!this._instance) {
            return;
        }
        this._instance._deviceResetMessageBroadcaster?.destructor();
        this._instance._titleClickedMessageBroadcaster?.destructor();
        this._instance = undefined;
    }

    constructor() {
        this._deviceResetMessageBroadcaster = new EventBroadcaster<DeviceResetMessage>();
        this._titleClickedMessageBroadcaster = new EventBroadcaster<TitleClickedMessage>();
    }

    static get deviceResetMessageBroadcaster() {
        return Broadcasters.getInstance()._deviceResetMessageBroadcaster;
    }

    static get titleClickedMessageBroadcaster() {
        return Broadcasters.getInstance()._titleClickedMessageBroadcaster;
    }
}
