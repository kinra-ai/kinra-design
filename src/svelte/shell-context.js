import { createContext } from "svelte";

/**
 * What a `Shell` tells what it holds: its state, and the moves a part of it
 * may make, such as a sidebar control that routes without a link closing the
 * drawer.
 * @typedef {import("./shell-context.js").ShellState} ShellState
 */

/** @type {[() => ShellState, (context: ShellState) => ShellState, () => boolean]} */
const [get, set, has] = createContext();

/** The enclosing shell, or undefined outside one. */
export function shellState() {
	return has() ? get() : undefined;
}

export const setShellState = set;

/** ⌘ on a Mac, whose Ctrl+B moves the caret in a field; Ctrl elsewhere. */
export function onMac() {
	return (
		typeof navigator !== "undefined" &&
		/Mac|iPhone|iPad/.test(navigator.userAgent)
	);
}

/** The fold chord's name, as the platform writes it. */
export function chordLabel() {
	return onMac() ? "⌘B" : "Ctrl+B";
}

/**
 * Whether a key press is the fold chord: ⌘B on a Mac and Ctrl+B elsewhere,
 * never both, never with Alt or Shift, never a held key's repeats. Native
 * modals and rich text keep it.
 * @param {KeyboardEvent} event
 */
export function isChord(event) {
	if (event.repeat || event.altKey || event.shiftKey) return false;
	const mac = onMac();
	if (mac ? !event.metaKey || event.ctrlKey : !event.ctrlKey || event.metaKey)
		return false;
	if (event.key.toLowerCase() !== "b") return false;
	if (document.querySelector("dialog:modal")) return false;
	return !(
		event.target instanceof HTMLElement && event.target.isContentEditable
	);
}
