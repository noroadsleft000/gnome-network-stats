import { EventBroadcaster } from "./EventBroadcaster.js";

let deviceResetMessageBroadcaster;
let titleClickedMessageBroadcaster;

export function initBrodcasters() {
    if (!deviceResetMessageBroadcaster) {
        deviceResetMessageBroadcaster = new EventBroadcaster();
    }
    if (!titleClickedMessageBroadcaster) {
        titleClickedMessageBroadcaster = new EventBroadcaster();
    }
}

export function deinitBrodcasters() {
    if (deviceResetMessageBroadcaster) {
        deviceResetMessageBroadcaster = undefined;
    }
    if (titleClickedMessageBroadcaster) {
        titleClickedMessageBroadcaster = undefined;
    }
}

export function getDeviceResetMessageBroadcaster() {
    return deviceResetMessageBroadcaster;
}

export function getTitleClickedMessageBroadcaster() {
    return titleClickedMessageBroadcaster;
}
