import type { Attachment } from "svelte/attachments";

/**
 * Shows `text`, and a quieter `hint` beneath it, in the shared top-layer
 * `.kin-tooltip` when the pointer rests on the node, the keyboard reaches it,
 * or a finger taps it where a tap does nothing else. A control also carries
 * the words as its description. Nothing to say attaches nothing.
 *
 * ```svelte
 * <IconButton label="Undo" {@attach tip("Undo", "Your last change")}>…</IconButton>
 * ```
 */
export function tip(
	text: string | null | undefined | false,
	hint?: string | null | undefined | false,
): Attachment<HTMLElement>;

/**
 * A tip whose words are found nowhere else on the page, on a mark that is no
 * control: the mark also takes the keyboard's focus and carries the words as
 * its description.
 */
export function told(
	text: string | null | undefined | false,
	hint?: string | null | undefined | false,
): Attachment<HTMLElement>;

/**
 * Puts the showing tip away; given a node, only that node's tip, shown or
 * waiting. `warmNext` (true by default) lets the next tip show at once.
 */
export function hideTip(target?: HTMLElement, warmNext?: boolean): void;
