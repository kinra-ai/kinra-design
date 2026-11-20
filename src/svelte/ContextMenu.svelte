<!--
@component
A `.kin-menu` in a `.kin-popover`, opened from script. `show(event, items)`
opens it at the pointer for a right-click, and otherwise beneath the element
that took the event, at that element's inline start. It flips above near the
window's foot, keeps inside the window and its safe areas, and follows its
anchor while the page scrolls. `Menu` is this with its own trigger button.

```svelte
<ContextMenu bind:this={menu} label="File actions" />
<li oncontextmenu={(event) => menu.show(event, actions(file))}>…</li>
<IconButton label="More" aria-haspopup="menu" aria-expanded="false"
	onclick={(event) => menu.show(event, actions(file))}>…</IconButton>
```

Focus moves into the menu, to its checked radio, else its first item that
can be used. Arrow keys wrap, Home and End jump, and a letter moves to the
next item it starts. Escape and Tab close it, and focus returns to the
anchor unless the anchor now sits in an inert region. An item that cannot be
used is still reached, and says why. An anchor that carries
`aria-haspopup="menu"` has its `aria-expanded` kept.
-->
<script lang="ts">
	import { tick, untrack } from "svelte";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { follow, place } from "./placement.js";
	import type { Anchor, PlaceOptions } from "./placement.js";
	import type { MenuEntry, MenuItem, MenuShowOptions } from "./types.js";

	interface Props extends Omit<
		HTMLAttributes<HTMLDivElement>,
		"popover" | "children"
	> {
		/** The menu's name for assistive technology. */
		label: string;
		/** What the menu lists, unless `show` is given its own. */
		items?: readonly MenuEntry[];
		/** Whether the menu shows. Setting it opens the menu at `anchor`, or closes it. */
		open?: boolean;
		/** The element the menu opens from when `show` names none. */
		anchor?: Element | null | undefined;
		/** The mark beside a checked item and a done one; a check by default. */
		check?: Snippet | undefined;
	}

	let {
		label,
		items = [],
		open = $bindable(false),
		anchor,
		check,
		id,
		class: className,
		ontoggle,
		...rest
	}: Props = $props();

	/** How long a done item says so before the menu closes. */
	const DONE_FOR = 900;

	const uid = $props.id();
	const menuId = $derived(id ?? `${uid}-menu`);
	let popover: HTMLDivElement | undefined;
	let list: HTMLUListElement | undefined;
	/** The items `show` was given, which stand in for `items` while it shows. */
	let given = $state.raw<readonly MenuEntry[] | null>(null);
	/** The item saying it is done, while it says so. */
	let finished = $state(-1);
	let timer: ReturnType<typeof setTimeout> | undefined;
	/** A done item's action is running. */
	let working = false;
	/** A `show` is waiting to open the menu. */
	let pending = false;
	/** Each `show` and `close` takes a ticket, so a late one does nothing. */
	let ticket = 0;
	/** The element the menu belongs to: focus returns to it. */
	let owner: Element | null = null;
	let stop: (() => void) | undefined;

	type Numbered = { item: MenuItem; index: number };
	type Row =
		| Numbered
		| { separator: true }
		| { group: string | undefined; items: Numbered[] };

	// Every item is numbered in order, through its groups, as the keyboard
	// meets it.
	const rows: Row[] = $derived.by(() => {
		let index = 0;
		const number = (item: MenuItem): Numbered => ({ item, index: index++ });
		return (given ?? items).map((entry) =>
			"separator" in entry
				? { separator: true as const }
				: "items" in entry
					? { group: entry.label, items: entry.items.map(number) }
					: number(entry),
		);
	});
	const flat = $derived(
		rows.flatMap((row) =>
			"items" in row ? row.items : "item" in row ? [row] : [],
		),
	);

	/**
	 * Opens the menu. `target` is the event that asks, or the element it
	 * belongs to; `choices` replace `items` while it shows; `options` names
	 * the anchor (or is it) and which item takes focus.
	 */
	export async function show(
		target?: Event | Element | null,
		choices?: readonly MenuEntry[] | null,
		options?: Element | MenuShowOptions | null,
	): Promise<void> {
		const settings: MenuShowOptions =
			options instanceof Element ? { anchor: options } : (options ?? {});
		const event = target instanceof Event ? target : undefined;
		event?.preventDefault();
		const current = event?.currentTarget;
		const element =
			settings.anchor ??
			(target instanceof Element
				? target
				: current instanceof Element
					? current
					: null) ??
			anchor ??
			null;
		// A context menu at the pointer: the right button, or Ctrl+click on a
		// Mac, which sends contextmenu with the main button still down. The
		// keyboard's context menu key reports no button and opens beneath.
		const pointer =
			event instanceof MouseEvent &&
			(event.button === 2 ||
				(event.type === "contextmenu" && event.button >= 0))
				? event
				: null;
		const mine = ++ticket;
		settle();
		if (owner && owner !== element) expanded(owner, false);
		owner = element;
		given = choices ?? null;
		const where = locate(element, pointer);
		if (!where) {
			open = false;
			return;
		}
		pending = true;
		// Chromium sends contextmenu while the right button is still down, and
		// its release would light-dismiss a popover opened before it.
		if (pointer?.buttons) await released();
		await tick();
		pending = false;
		if (mine !== ticket || !popover || !list) return;
		try {
			if (!popover.matches(":popover-open")) {
				// Its source makes it a child of any popover it was opened from,
				// so opening it does not light-dismiss that one.
				const source = owner instanceof HTMLElement ? owner : undefined;
				popover.showPopover(source ? { source } : undefined);
				const modal = document.querySelector("dialog:modal");
				if (modal && !modal.contains(popover)) {
					console.warn(
						"ContextMenu: render the menu inside the modal dialog it opens from; outside it, the dialog makes the menu inert.",
					);
				}
			}
		} catch {
			open = false;
			return;
		}
		const placing: PlaceOptions = pointer ? { gap: 0 } : {};
		const at = where();
		if (at) place(popover, at, placing);
		stop = follow(popover, where, { ...placing, onlost: close });
		enter(settings.focus);
	}

	/** Closes the menu, and returns focus to its anchor if focus was in it. */
	export function close() {
		ticket++;
		pending = false;
		open = false;
		settle();
		if (!popover?.matches(":popover-open")) return;
		const active = document.activeElement;
		const held =
			!active || active === document.body || popover.contains(active);
		popover.hidePopover();
		if (held) restore();
	}

	function settle() {
		clearTimeout(timer);
		finished = -1;
		working = false;
		stop?.();
		stop = undefined;
	}

	function restore() {
		if (
			(owner instanceof HTMLElement || owner instanceof SVGElement) &&
			owner.isConnected &&
			!owner.closest("[inert]")
		)
			owner.focus({ preventScroll: true });
	}

	function expanded(element: Element, value: boolean) {
		if (element.getAttribute("aria-haspopup") === "menu")
			element.setAttribute("aria-expanded", String(value));
	}

	function released() {
		return new Promise<void>((resolve) => {
			const done = () => {
				removeEventListener("pointerup", done, true);
				removeEventListener("pointercancel", done, true);
				setTimeout(resolve, 0);
			};
			addEventListener("pointerup", done, true);
			addEventListener("pointercancel", done, true);
		});
	}

	/**
	 * Where the menu stands, asked again as the page scrolls: beside its
	 * element, or at the pointer, which moves with the element it was over.
	 */
	function locate(
		element: Element | null,
		pointer: MouseEvent | null,
	): (() => Anchor | null) | null {
		if (!pointer) return element ? () => element : null;
		const { clientX: x, clientY: y } = pointer;
		if (!element) return () => ({ x, y });
		const start = element.getBoundingClientRect();
		const dx = x - start.left;
		const dy = y - start.top;
		return () => {
			if (!element.isConnected) return null;
			const now = element.getBoundingClientRect();
			const point = { x: now.left + dx, y: now.top + dy };
			const inside =
				point.x >= 0 &&
				point.y >= 0 &&
				point.x <= innerWidth &&
				point.y <= innerHeight;
			return inside ? point : null;
		};
	}

	function menuItems() {
		return list
			? [...list.querySelectorAll<HTMLElement>('[role^="menuitem"]')]
			: [];
	}

	function enter(which?: "first" | "last") {
		const all = menuItems();
		const usable = all.filter(
			(item) => item.getAttribute("aria-disabled") !== "true",
		);
		const checked =
			which === undefined
				? list?.querySelector<HTMLElement>(
						'[role="menuitemradio"][aria-checked="true"]',
					)
				: null;
		const target =
			which === "last"
				? (usable.at(-1) ?? all.at(-1))
				: (checked ?? usable[0] ?? all[0]);
		reach(target ?? list);
	}

	/** Focus an item, and scroll the menu, not the page, to show it. */
	function reach(item: HTMLElement | null | undefined) {
		if (!item) return;
		item.focus({ preventScroll: true });
		if (!popover || item === list) return;
		const outer = popover.getBoundingClientRect();
		const inner = item.getBoundingClientRect();
		const top = outer.top + popover.clientTop;
		const bottom = top + popover.clientHeight;
		if (inner.top < top) popover.scrollTop -= top - inner.top;
		else if (inner.bottom > bottom) popover.scrollTop += inner.bottom - bottom;
	}

	function keydown(event: KeyboardEvent) {
		if (event.key === "Escape") {
			// Only the menu closes, not a drawer or dialog behind it.
			event.preventDefault();
			event.stopPropagation();
			close();
			return;
		}
		if (event.key === "Tab") {
			// Focus returns to the anchor first, so Tab moves on from there.
			close();
			return;
		}
		// Every item, those that cannot be used among them, so the keyboard
		// reads their reasons as the pointer sees them.
		const all = menuItems();
		if (!all.length) return;
		const at = all.indexOf(document.activeElement as HTMLElement);
		let next: number;
		if (event.key === "ArrowDown") next = (at + 1) % all.length;
		else if (event.key === "ArrowUp") next = at <= 0 ? all.length - 1 : at - 1;
		else if (event.key === "Home") next = 0;
		else if (event.key === "End") next = all.length - 1;
		else if (
			event.key.length === 1 &&
			event.key !== " " &&
			!event.ctrlKey &&
			!event.metaKey &&
			!event.altKey
		) {
			const letter = event.key.toLowerCase();
			const order = [...flat.slice(at + 1), ...flat.slice(0, at + 1)];
			const match = order.find(({ item }) =>
				item.label.trim().toLowerCase().startsWith(letter),
			);
			if (!match) return;
			next = match.index;
		} else return;
		event.preventDefault();
		reach(all[next]);
	}

	async function choose(item: MenuItem, index: number, event: MouseEvent) {
		if (item.disabled || working || finished >= 0) {
			event.preventDefault();
			return;
		}
		if (!item.done) {
			close();
			void item.onselect?.(event);
			return;
		}
		// A done item says it worked before it closes; a failure closes it at
		// once, and the product says what went wrong.
		const mine = ticket;
		working = true;
		let worked = true;
		try {
			await item.onselect?.(event);
		} catch {
			worked = false;
		}
		working = false;
		if (mine !== ticket) return;
		if (!worked) {
			close();
			return;
		}
		finished = index;
		timer = setTimeout(close, DONE_FOR);
	}

	function toggled(
		event: ToggleEvent & { currentTarget: EventTarget & HTMLDivElement },
	) {
		// The state now, not the event's: a menu shown again at once keeps its
		// new session.
		const showing = event.currentTarget.matches(":popover-open");
		open = showing;
		if (owner) expanded(owner, showing);
		if (!showing) {
			settle();
			// Light dismiss hid what held focus: return it to the anchor.
			const active = document.activeElement;
			if (!active || active === document.body) restore();
		}
		ontoggle?.(event);
	}

	$effect(() => {
		const wanted = open;
		const from = anchor;
		untrack(() => {
			if (!popover || pending) return;
			const showing = popover.matches(":popover-open");
			if (wanted && !showing) void show(from);
			else if (!wanted && showing) close();
		});
	});

	$effect(() => () => {
		ticket++;
		clearTimeout(timer);
		stop?.();
		if (owner) expanded(owner, false);
	});
</script>

{#snippet mark()}
	{#if check}{@render check()}{:else}<svg
			viewBox="0 0 16 16"
			aria-hidden="true"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg
		>{/if}
{/snippet}

{#snippet face(item: MenuItem, index: number, reason: string | undefined)}
	{#if finished === index}
		{@render mark()}{item.done}
	{:else}
		{@render item.icon?.()}
		{#if reason}
			<span class="kin-menu__text"
				>{item.label}<span
					class="kin-menu__reason"
					id={`${uid}-reason-${index}`}
					aria-hidden="true">{reason}</span
				></span
			>
		{:else}
			{item.label}
		{/if}
		{#if item.shortcut}<span class="kin-menu__shortcut">{item.shortcut}</span
			>{/if}
		{#if item.checked && item.href === undefined}<span class="kin-menu__check"
				>{@render mark()}</span
			>{/if}
	{/if}
{/snippet}

{#snippet entry(item: MenuItem, index: number)}
	{@const reason =
		typeof item.disabled === "string" ? item.disabled : undefined}
	{@const role =
		item.role ?? (item.checked === undefined ? "menuitem" : "menuitemcheckbox")}
	{#if item.href !== undefined && !item.disabled}
		<a
			class="kin-menu__item"
			role="menuitem"
			tabindex="-1"
			href={item.href}
			download={item.download === true ? "" : item.download || undefined}
			target={item.external ? "_blank" : undefined}
			rel={item.external ? "noreferrer" : undefined}
			data-tone={item.tone}
			onclick={(event) => void choose(item, index, event)}
			>{@render face(item, index, reason)}</a
		>
	{:else}
		<button
			type="button"
			class="kin-menu__item"
			{role}
			tabindex="-1"
			aria-checked={role === "menuitem" ? undefined : Boolean(item.checked)}
			aria-disabled={item.disabled ? "true" : undefined}
			aria-describedby={reason ? `${uid}-reason-${index}` : undefined}
			data-tone={item.tone}
			onclick={(event) => void choose(item, index, event)}
			>{@render face(item, index, reason)}</button
		>
	{/if}
{/snippet}

<div
	{...rest}
	id={menuId}
	class={["kin-popover", className]}
	data-padding="none"
	popover="auto"
	bind:this={popover}
	ontoggle={toggled}
>
	<ul
		class="kin-menu"
		id={`${menuId}-list`}
		role="menu"
		aria-label={label}
		tabindex="-1"
		bind:this={list}
		onkeydown={keydown}
	>
		{#each rows as row, position}
			{#if "separator" in row}
				<li role="none"><hr class="kin-menu__separator" /></li>
			{:else if "items" in row}
				<li
					role="group"
					aria-labelledby={row.group ? `${uid}-group-${position}` : undefined}
				>
					{#if row.group}
						<p
							class="kin-menu__label"
							id={`${uid}-group-${position}`}
							aria-hidden="true"
						>
							{row.group}
						</p>
					{/if}
					{#each row.items as { item, index } (index)}
						{@render entry(item, index)}
					{/each}
				</li>
			{:else}
				<li role="none">{@render entry(row.item, row.index)}</li>
			{/if}
		{/each}
	</ul>
	<span class="kin-sr-only" aria-live="polite" aria-atomic="true"
		>{finished >= 0 ? (flat[finished]?.item.done ?? "") : ""}</span
	>
</div>
