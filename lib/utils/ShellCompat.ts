import Clutter from "gi://Clutter";
import St from "gi://St";
import { PACKAGE_VERSION } from "resource:///org/gnome/shell/misc/config.js";

/*
 * Input handling helpers. Connecting to event signals is deprecated since GNOME 51,
 * so "button-press-event" is only used on older versions.
 */

const USE_LEGACY_EVENT_SIGNALS = parseInt(PACKAGE_VERSION, 10) < 51;

/**
 * Calls the handler when the given button is activated.
 * @param button - button to listen to
 * @param handler - function to call on activation
 */
export function connectButtonActivated(button: St.Button, handler: () => void): void {
    const signal = USE_LEGACY_EVENT_SIGNALS ? "button-press-event" : "clicked";
    button.connect(signal, () => {
        handler();
    });
}

/**
 * Calls the handler when the given actor is pressed, only on GNOME versions older than 51.
 * On newer versions it does nothing: the panel button's own ClickGesture handles the press
 * and neither this signal nor a second gesture on the same actor gets triggered.
 * @param actor - actor to listen to
 * @param handler - function to call on press, receives the mouse button number
 */
export function connectLegacyPress(actor: Clutter.Actor, handler: (button: number) => void): void {
    if (USE_LEGACY_EVENT_SIGNALS) {
        actor.connect("button-press-event", (_actor: Clutter.Actor, event: Clutter.Event) => {
            handler(event.get_button());
        });
    }
}
