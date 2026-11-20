import type { Snippet } from "svelte";
import type {
	HTMLAnchorAttributes,
	HTMLAttributes,
	HTMLButtonAttributes,
} from "svelte/elements";
import type { Attachment } from "svelte/attachments";

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

/** One command in a `Menu` or `ContextMenu`. */
export interface MenuItem {
	/** What the item does, in a few words. Typeahead reads its first letter. */
	label: string;
	/** A glyph before the label; mark its `svg` `aria-hidden="true"`. */
	icon?: Snippet | undefined;
	/**
	 * Runs when the item is chosen, after the menu closes. A `done` item runs
	 * it first and waits for the promise it returns.
	 */
	onselect?: ((event: MouseEvent) => unknown) | undefined;
	/** The item is a link. */
	href?: string | undefined;
	/** Open the link in a new tab, without a referrer. */
	external?: boolean | undefined;
	/** Download the link, under this file name when it is a string. */
	download?: boolean | string | undefined;
	/** A command that destroys or cannot be undone. */
	tone?: "error" | undefined;
	/**
	 * The item cannot be used now. A string says why: it shows beneath the
	 * label and is the item's description. The keyboard still reaches it.
	 */
	disabled?: boolean | string | undefined;
	/** On or off; with it the item is a `menuitemcheckbox` unless `role` says otherwise. */
	checked?: boolean | undefined;
	/** `menuitemradio` for one choice among a group's peers. */
	role?: "menuitem" | "menuitemcheckbox" | "menuitemradio" | undefined;
	/** A key chord shown at the item's end, such as ⌘C. */
	shortcut?: string | undefined;
	/**
	 * What the item says for a moment once its action has worked, such as
	 * Copied, before the menu closes. A rejected action closes it at once.
	 */
	done?: string | undefined;
}

/** A line between a menu's items. */
export interface MenuSeparator {
	separator: true;
}

/** Items that belong together under a quiet label, such as a set of radios. */
export interface MenuGroup {
	label?: string | undefined;
	items: readonly MenuItem[];
}

/** What a menu lists: items, separators and groups. */
export type MenuEntry = MenuItem | MenuSeparator | MenuGroup;

/** Where a `ContextMenu` opens from and which item takes focus. */
export interface MenuShowOptions {
	/** The element the menu belongs to: it is placed from it and focus returns to it. */
	anchor?: Element | null | undefined;
	/** The item that takes focus: the first or the last that can be used. */
	focus?: "first" | "last" | undefined;
}

/** What a `Menu` hands its `trigger` snippet, to spread on the product's own button. */
export interface MenuTriggerAttributes {
	"aria-haspopup": "menu";
	"aria-expanded": boolean;
	"aria-controls": string;
	onclick: (event: MouseEvent) => void;
	onkeydown: (event: KeyboardEvent) => void;
	onpointerdown: (event: PointerEvent) => void;
	[attachment: symbol]:
		Attachment<HTMLButtonElement> | false | null | undefined;
}

/**
 * The attributes of a part that renders a link with `href` and a button
 * without: one type, so a handler's event is typed for either element.
 */
export type LinkOrButtonAttributes = HTMLAttributes<
	HTMLAnchorElement | HTMLButtonElement
> &
	Omit<HTMLButtonAttributes, keyof HTMLAttributes<HTMLButtonElement>> &
	Omit<HTMLAnchorAttributes, keyof HTMLAttributes<HTMLAnchorElement>>;
