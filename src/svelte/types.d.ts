import type { Snippet } from "svelte";

/** A tone names a state: colour is information (principles). */
export type Tone = "primary" | "reason" | "success" | "warning" | "error";

/** A `.kin-status` state; omit it for idle. */
export type StatusState =
	"reason" | "running" | "success" | "warning" | "error";

/** Plain text, or a snippet when the part needs markup. */
export type Content = string | Snippet;

/** A heading level for a component that names its region. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** One choice in a `Segmented` group. */
export interface SegmentedOption<V extends string = string> {
	value: V;
	label: string;
	disabled?: boolean;
}

/** What a `Field` hands its `children` snippet for a control it can't reach. */
export interface FieldControlAttributes {
	id: string;
	"aria-describedby": string | undefined;
	"aria-invalid": "true" | undefined;
	required: boolean | undefined;
}

/** What a `Dialog` hands its footer: its form's id, and a guarded close. */
export interface DialogControls {
	/** The body form's id, for `<button type="submit" form={form}>`. */
	form: string;
	/** Close as Escape would, asking `canClose` first. */
	close: () => void;
}

/** A request to `confirm()`. */
export interface ConfirmRequest {
	title: string;
	/** What happens, in a sentence. */
	body?: string;
	/** The things it happens to, listed. */
	items?: readonly string[];
	/** The confirming action's words, such as "Delete repository". */
	action: string;
	/** The way back's words; "Cancel" by default. */
	cancel?: string;
	/** `error` for an action that destroys; `primary` otherwise. */
	tone?: "primary" | "error";
}
