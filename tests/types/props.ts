/*
 * Prop rules the layer's types enforce, checked by svelte-check. Each
 * `@ts-expect-error` must stay an error; each plain line must stay valid.
 */
import type { ComponentProps, Snippet } from "svelte";
import type {
	Button,
	Card,
	Dialog,
	IconButton,
	Menu,
	Row,
	ShellItem,
} from "../../src/svelte/index.js";

const snippet = (() => {}) as unknown as Snippet;

type RowProps = ComponentProps<typeof Row>;
export const rowOpens: RowProps = {
	title: "Opens in place",
	onopen: (event) => void event.clientX,
	disabled: true,
};
export const rowLinks: RowProps = { title: "Opens a page", href: "/page" };
// @ts-expect-error A row opens a page or something in place, not both.
export const rowBoth: RowProps = { title: "x", href: "/x", onopen: () => {} };
// @ts-expect-error Only a row that opens in place can be disabled.
export const rowDisabledLink: RowProps = { href: "/x", disabled: true };
// @ts-expect-error A tone names a state.
export const rowTone: RowProps = { title: "x", tone: "purple" };

type CardProps = ComponentProps<typeof Card>;
export const cardOpens: CardProps = { title: "x", onopen: () => {} };
// @ts-expect-error A card's title opens a page or something in place, not both.
export const cardBoth: CardProps = { title: "x", href: "/x", onopen: () => {} };

type ButtonProps = ComponentProps<typeof Button>;
// A handler's event is typed whether the button renders a link or a button.
export const buttonHandler: ButtonProps = {
	children: snippet,
	onclick: (event) => void event.currentTarget.focus(),
};
export const buttonLink: ButtonProps = {
	children: snippet,
	href: "/x",
	target: "_blank",
};
// @ts-expect-error A button has a weight from the catalog's list.
export const buttonVariant: ButtonProps = { children: snippet, variant: "big" };

type ItemProps = ComponentProps<typeof ShellItem>;
export const itemHandler: ItemProps = {
	label: "Home",
	children: snippet,
	onclick: (event) => void event.currentTarget.blur(),
};

// @ts-expect-error An icon alone needs a name.
export const iconUnnamed: ComponentProps<typeof IconButton> = {
	children: snippet,
};
// @ts-expect-error A dialog needs a title.
export const dialogUntitled: ComponentProps<typeof Dialog> = {
	children: snippet,
};
// @ts-expect-error A menu needs a name.
export const menuUnnamed: ComponentProps<typeof Menu> = { items: [] };
