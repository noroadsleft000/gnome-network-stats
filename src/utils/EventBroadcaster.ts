/*
 * EventBroadcaster class can be inherited to create a new type of event broadcaster.
 */

export class EventBroadcaster<T = unknown> {
    private _listeners: Array<(message: T) => void>;

    constructor() {
        this._listeners = [];
    }

    subscribe(listener: (message: T) => void): (message: T) => void {
        if (-1 == this._listeners.indexOf(listener)) {
            this._listeners.push(listener);
        }
        return listener;
    }

    unsubscribe(listener: (message: T) => void): (message: T) => void {
        const index = this._listeners.indexOf(listener);
        if (index != -1) {
            this._listeners.splice(index, 1);
        }
        return listener;
    }

    broadcast(message: T): void {
        for (const listener of this._listeners) {
            listener(message);
        }
    }
}
