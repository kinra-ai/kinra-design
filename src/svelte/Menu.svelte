<!--
@component
A menu button: a trigger and the `.kin-menu` it opens beneath itself. The
trigger is an `IconButton` named by the required `label`, with a more mark
unless `icon` gives another; or the product's own button from the `trigger`
snippet, which receives the attributes to spread on it:

```svelte
<Menu label="Sort" {items}>
	{#snippet trigger(attributes)}
		<Button {...attributes}>Sort</Button>
	{/snippet}
</Menu>
```

The trigger keeps `aria-haspopup`, `aria-expanded` and `aria-controls`;
ArrowDown and ArrowUp on it open the menu on its first and last item. A
press on the trigger that closes the menu does not open it again. `open`
binds, and `open()` and `close()` work it from script. Other props go to the
trigger; `menuProps` go to the popover. The menu itself is `ContextMenu`.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import { createAttachmentKey } from "svelte/attachments";
	import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
	import ContextMenu from "./ContextMenu.svelte";
	import IconButton from "./IconButton.svelte";
	import type { MenuEntry, MenuTriggerAttributes } from "./types.js";

	interface Props extends Omit<
		HTMLButtonAttributes,
		"aria-label" | "children"
	> {
		/** The trigger's and the menu's name for assistive technology. */
		label: string;
		items: readonly MenuEntry[];
		/** Whether the menu shows. */
		open?: boolean;
		/** The product's own trigger, given the attributes to spread on it. */
		trigger?: Snippet<[MenuTriggerAttributes]> | undefined;
		/** The default trigger's icon, in place of the more mark. */
		icon?: Snippet | undefined;
		variant?: "primary" | "quiet" | "ghost" | "danger" | undefined;
		size?: "compact" | "large" | undefined;
		/** Attributes for the popover that holds the menu. */
		menuProps?: Omit<HTMLAttributes<HTMLDivElement>, "popover"> | undefined;
		/** The mark beside a checked item and a done one; a check by default. */
		check?: Snippet | undefined;
	}

	let {
		label,
		items,
		open: isOpen = $bindable(false),
		trigger,
		icon,
		variant,
		size,
		menuProps,
		check,
		onclick,
		onkeydown,
		onpointerdown,
		...rest
	}: Props = $props();

	const uid = $props.id();
	const menuId = $derived(menuProps?.id ?? `${uid}-menu`);
	let menu: ContextMenu;
	let button = $state<HTMLElement | null>(null);
	/** The menu was open when the trigger was pressed. */
	let pressedOpen = false;

	const attach = createAttachmentKey();
	const attributes: MenuTriggerAttributes = {
		"aria-haspopup": "menu",
		get "aria-expanded"() {
			return isOpen;
		},
		get "aria-controls"() {
			return `${menuId}-list`;
		},
		onclick: click,
		onkeydown: keydown,
		onpointerdown: pointerdown,
		[attach]: (node: HTMLElement) => {
			button = node;
			return () => {
				if (button === node) button = null;
			};
		},
	};

	/** Opens the menu on its checked radio, else its first item that can be used. */
	export function open() {
		return menu.show(button);
	}

	export function close() {
		menu.close();
	}

	/** Whether the menu shows now; `open` follows a moment later, on `toggle`. */
	function showing() {
		return !!document.getElementById(menuId)?.matches(":popover-open");
	}

	// A press on the trigger while the menu shows light-dismisses it before
	// the click lands, and that click must not open it again.
	function pointerdown(event: PointerEvent) {
		pressedOpen = showing() || isOpen;
		onpointerdown?.(event as Parameters<NonNullable<typeof onpointerdown>>[0]);
	}

	function click(event: MouseEvent) {
		onclick?.(event as Parameters<NonNullable<typeof onclick>>[0]);
		const dismissed = pressedOpen && event.detail > 0;
		pressedOpen = false;
		if (event.defaultPrevented) return;
		if (dismissed || showing()) menu.close();
		else void menu.show(button);
	}

	function keydown(event: KeyboardEvent) {
		onkeydown?.(event as Parameters<NonNullable<typeof onkeydown>>[0]);
		if (event.defaultPrevented) return;
		if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
		event.preventDefault();
		pressedOpen = false;
		void menu.show(button, null, {
			focus: event.key === "ArrowUp" ? "last" : "first",
		});
	}
</script>

{#if trigger}
	{@render trigger({ ...rest, ...attributes })}
{:else}
	<IconButton {...rest} {...attributes} {label} {variant} {size}>
		{#if icon}{@render icon()}{:else}<svg
				viewBox="0 0 16 16"
				width="16"
				height="16"
				aria-hidden="true"
				fill="currentColor"
				><circle cx="3.5" cy="8" r="1.25" /><circle
					cx="8"
					cy="8"
					r="1.25"
				/><circle cx="12.5" cy="8" r="1.25" /></svg
			>{/if}
	</IconButton>
{/if}
<ContextMenu
	bind:this={menu}
	bind:open={isOpen}
	{label}
	{items}
	{check}
	anchor={button}
	{...menuProps}
	id={menuId}
/>
