import { createContext } from "svelte";

/**
 * What a `Field` tells the control inside it: its id, the ids that describe
 * it, and whether it is invalid or required.
 * @typedef {{ readonly id: string; readonly describedby: string | undefined; readonly invalid: boolean; readonly required: boolean }} FieldControl
 */

/** @type {[() => FieldControl | undefined, (context: FieldControl | undefined) => FieldControl | undefined, () => boolean]} */
const [get, set, has] = createContext();

/** The enclosing field's control attributes, or undefined outside a field. */
export function fieldControl() {
	return has() ? get() : undefined;
}

export const setFieldControl = set;
