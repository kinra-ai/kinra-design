<!--
@component
The application shell (`shell.css`): a rail of the product's pages beside a
column of its work, and the page on one raised panel with a bar above it.
Below `breakpoint` the sidebar is a drawer. The component carries the
behaviour the catalog lists under "Behaviour each product writes": layout
and its first-paint guard, fold, chord, focus, inert, Escape, tips, links,
the breakpoint, the hairline and the scroller. The product fills it and
remembers the fold.

```svelte
<Shell bind:folded onfold={save} path={page.url.pathname}>
	{#snippet home()}<a class="kin-shell__home" href="/">…</a>{/snippet}
	{#snippet pages()}<ul><li><ShellItem href="/" label="Home" current>…</ShellItem></li></ul>{/snippet}
	{#snippet column()}…{/snippet}
	{#snippet crumbs()}<li><span aria-current="page">Home</span></li>{/snippet}
	…the page…
</Shell>
```

In SvelteKit, call `settle()` from `afterNavigate` as well, since the router
moves focus after the page has changed.
-->
<script lang="ts">
	import { flushSync, tick, untrack, type Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { chordLabel, isChord, setShellState } from "./shell-context.js";
	import { focusable } from "./focus.js";
	import type { ShellState } from "./shell-context.js";

	interface Props extends HTMLAttributes<HTMLDivElement> {
		/** The product's own breakpoint: below it the sidebar is a drawer. */
		breakpoint?: string;
		/** The rail alone beside the page. Remember it in `onfold`. */
		folded?: boolean;
		/** The drawer is open. */
		open?: boolean;
		/** Below the breakpoint, read only. */
		narrow?: boolean;
		/** As a drawer, the page scrolls with the document under a sticky bar. */
		scroll?: "panel" | "document";
		/** As a drawer, items that carry a label show it, on a wider rail. */
		labels?: boolean;
		/** The sidebar's id, which the fold and the menu control. */
		sidebarId?: string;
		/** The sidebar's name. */
		label?: string;
		pagesLabel?: string;
		marksLabel?: string;
		crumbsLabel?: string;
		/** The page's id, for a skip link. */
		mainId?: string;
		/** The fold control's name for each state. */
		foldLabel?: (folded: boolean) => string;
		/** The drawer control's name, which may count what waits. */
		menuLabel?: (open: boolean) => string;
		/** Whether the shell answers ⌘B or Ctrl+B itself. */
		chord?: boolean;
		/** The page's location; a change measures the hairline again. */
		path?: string | undefined;
		/** The element the page scrolls in, when it is not the page itself. */
		scroller?: (() => Element | null) | undefined;
		onfold?: (folded: boolean) => void;
		ondrawer?: (open: boolean) => void;
		/** The K, the way home, in the rail's head. */
		home?: Snippet;
		/** The primary pages: a `ul` of `ShellItem`s. */
		pages?: Snippet;
		/** What the folded rail keeps from the column. */
		marks?: Snippet;
		/** The product's standing work beside the rail. */
		column?: Snippet;
		/** The rail's foot: the scheme and the account. */
		foot?: Snippet;
		/** Anything else the sidebar holds, such as a splitter. */
		sidebar?: Snippet;
		/** The crumbs' `li`s. */
		crumbs?: Snippet;
		/** The end of the bar. */
		end?: Snippet;
		/** Replaces the crumbs and the end with a bar of the product's own. */
		bar?: Snippet;
		foldIcon?: Snippet;
		menuIcon?: Snippet;
		/** A badge or status in the menu's glyph. */
		menuGlyph?: Snippet;
		/** The page. */
		children: Snippet;
	}

	let {
		breakpoint = "(max-width: 48rem)",
		folded = $bindable(false),
		open = $bindable(false),
		narrow = $bindable(false),
		scroll = "panel",
		labels = false,
		sidebarId = "navigation",
		label = "Navigation",
		pagesLabel = "Pages",
		marksLabel = "Kept close",
		crumbsLabel = "Where you are",
		mainId = "main",
		foldLabel = (folded: boolean) =>
			folded ? "Expand sidebar" : "Collapse sidebar",
		menuLabel = (open: boolean) =>
			open ? "Close navigation" : "Open navigation",
		chord = true,
		path,
		scroller: pageScroller,
		onfold,
		ondrawer,
		home,
		pages,
		marks,
		column,
		foot,
		sidebar,
		crumbs,
		end,
		bar,
		foldIcon,
		menuIcon,
		menuGlyph,
		children,
		class: className,
		...rest
	}: Props = $props();

	let shell = $state<HTMLDivElement>();
	let aside = $state<HTMLElement>();
	let page = $state<HTMLElement>();
	let foldButton = $state<HTMLButtonElement>();
	let menuButton = $state<HTMLButtonElement>();
	let columnPart = $state<HTMLElement>();
	let marksPart = $state<HTMLElement>();
	let resizing = $state(false);
	let scrolled = $state(false);
	let chordName = $state("");
	let owesPage = false;

	/** The element the page scrolls in now. */
	function scrollingElement(): Element | null {
		const own = pageScroller?.();
		if (own) return own;
		if (narrow && scroll === "document") {
			return document.scrollingElement ?? document.documentElement;
		}
		return page ?? null;
	}

	/* A change that hides what holds focus hands it to the fold or the menu,
	   whichever shows: folding hides the column, unfolding the marks, the
	   drawer layout the fold, and leaving it the menu and a closed drawer. */
	function rescue(active: Element | null, next = { narrow, folded, open }) {
		if (!active || !shell?.contains(active)) return;
		const hidden =
			(active === foldButton && next.narrow) ||
			(active === menuButton && !next.narrow) ||
			(!next.narrow && next.folded && !!columnPart?.contains(active)) ||
			(!!marksPart?.contains(active) && (next.narrow || !next.folded)) ||
			(next.narrow && !next.open && !!aside?.contains(active));
		if (hidden) {
			(next.narrow ? menuButton : foldButton)?.focus({ preventScroll: true });
		}
	}

	/* Folding takes the column away, and unfolding the marks; focus left in
	   either goes to the fold first. */
	function setFold(next: boolean) {
		if (narrow || next === folded) return;
		rescue(document.activeElement, { narrow, folded: next, open });
		folded = next;
		onfold?.(folded);
	}

	/* Opening hands the keyboard to the drawer, at the current page's item or
	   else the first that takes focus, never a mark; closing gives it back to
	   the drawer's control, or to the page when a link was followed. */
	async function setDrawer(next: boolean, restore: "menu" | "page" = "menu") {
		if (!narrow || next === open) return;
		open = next;
		ondrawer?.(open);
		await tick();
		if (open) {
			const shown = ":not(.kin-shell__marks *)";
			const start =
				aside?.querySelector<HTMLElement>(`[aria-current="page"]${shown}`) ??
				aside?.querySelector<HTMLElement>(`:is(${focusable})${shown}`);
			start?.focus();
		} else if (restore === "page") {
			owesPage = true;
			page?.focus({ preventScroll: true });
		} else {
			menuButton?.focus({ preventScroll: true });
		}
	}

	/* The hairline: the page is scrolled beneath the bar. */
	function measure() {
		const element = scrollingElement();
		scrolled = !!element && element.scrollTop > 0;
	}

	function settle() {
		measure();
		if (owesPage) {
			owesPage = false;
			page?.focus({ preventScroll: true });
		}
	}

	function toggle() {
		if (narrow) void setDrawer(!open);
		else setFold(!folded);
	}

	/* Beside the page, Escape puts away a tip that is showing, without moving
	   focus or the pointer, until the pointer or focus leaves its item. */
	function dismissTip() {
		if (!shell) return false;
		const owner = [
			...shell.querySelectorAll<HTMLElement>(
				":is(.kin-shell__item, .kin-shell__home):is(:hover, :focus-visible)",
			),
		].find((item) => {
			const tip = item.querySelector(":scope > .kin-shell__tip");
			if (!tip) return false;
			const style = getComputedStyle(tip);
			return style.display !== "none" && Number(style.opacity) > 0;
		});
		if (!owner) return false;
		owner.dataset.tip = "hidden";
		const away = new AbortController();
		const back = () => {
			delete owner.dataset.tip;
			away.abort();
		};
		owner.addEventListener("pointerleave", back, { signal: away.signal });
		owner.addEventListener("focusout", back, { signal: away.signal });
		return true;
	}

	function keydown(event: KeyboardEvent) {
		if (event.defaultPrevented) return;
		if (event.key === "Escape") {
			// The top layer owns Escape first: a popover that Escape closes, or
			// a modal. A manual popover, such as a toast, does not hold it.
			if (
				document.querySelector(
					':popover-open:not([popover="manual"]), dialog:modal',
				)
			)
				return;
			if (!open) {
				dismissTip();
				return;
			}
			event.preventDefault();
			void setDrawer(false);
			return;
		}
		if (!chord || !isChord(event)) return;
		event.preventDefault();
		toggle();
	}

	// Layout: the breakpoint's query, read once mounted and on every change.
	// Crossing it closes the drawer, moves focus out of what the new layout
	// hides, and settles without moving.
	$effect(() => {
		const query = matchMedia(breakpoint);
		untrack(() => {
			chordName = chordLabel();
			narrow = query.matches;
			if (!narrow) open = false;
			measure();
		});
		const relayout = () => {
			const active = document.activeElement;
			const wasOpen = open;
			resizing = true;
			open = false;
			if (wasOpen) ondrawer?.(false);
			narrow = query.matches;
			flushSync();
			rescue(active);
			void shell?.offsetWidth;
			resizing = false;
			flushSync();
			measure();
		};
		query.addEventListener("change", relayout);
		return () => query.removeEventListener("change", relayout);
	});

	// A new page: measure the hairline, and deliver focus a link owed it.
	$effect(() => {
		void path;
		void tick().then(settle);
	});

	setShellState({
		get narrow() {
			return narrow;
		},
		get folded() {
			return folded;
		},
		get open() {
			return open;
		},
		fold: setFold,
		drawer: (next, restore) => void setDrawer(next, restore),
		toggle,
		settle,
		scroller: scrollingElement,
	});

	export function fold(next: boolean) {
		setFold(next);
	}
	export function drawer(next: boolean, restore?: "menu" | "page") {
		void setDrawer(next, restore);
	}
	export { toggle, settle };
	export function scroller() {
		return scrollingElement();
	}

	// The first-paint guard: below the breakpoint, a sidebar not yet a drawer
	// waits where a closed drawer does, so the page never lays out beside it.
	const guard = $derived(
		`<style data-kin-shell-guard>@media ${breakpoint}{.kin-shell:not([data-drawer])>.kin-shell__sidebar{inset-inline-start:0;position:fixed;translate:calc(-100% * var(--kin-flow, 1)) 0}}</style>`,
	);
</script>

<svelte:head>{@html guard}</svelte:head>

<svelte:window
	onkeydown={keydown}
	onscroll={() => {
		if (narrow && scroll === "document") measure();
	}}
/>

<div
	{...rest}
	bind:this={shell}
	class={["kin-shell", className]}
	data-folded={folded && !narrow ? "" : undefined}
	data-drawer={narrow ? (open ? "open" : "closed") : undefined}
	data-scroll={scroll === "document" ? "document" : undefined}
	data-labels={labels ? "drawer" : undefined}
	data-resizing={resizing ? "" : undefined}
>
	<div
		class="kin-shell__backdrop"
		aria-hidden="true"
		onclick={() => void setDrawer(false)}
	></div>
	<!-- A delegated listener: a link's Enter fires click as well. -->
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<aside
		class="kin-shell__sidebar"
		id={sidebarId}
		aria-label={label}
		inert={narrow && !open}
		bind:this={aside}
		onclick={(event) => {
			const target = (event.target as Element).closest(
				"a[href], [data-navigates]",
			);
			if (open && target && aside?.contains(target)) {
				void setDrawer(false, "page");
			}
		}}
	>
		{#if home}<div class="kin-shell__head">{@render home()}</div>{/if}
		{#if pages}
			<nav class="kin-shell__pages" aria-label={pagesLabel}>
				{@render pages()}
			</nav>
		{/if}
		{#if marks}
			<nav
				class="kin-shell__marks"
				aria-label={marksLabel}
				bind:this={marksPart}
			>
				{@render marks()}
			</nav>
		{/if}
		{#if column}
			<div class="kin-shell__column" bind:this={columnPart}>
				{@render column()}
			</div>
		{/if}
		{#if foot}<div class="kin-shell__foot">{@render foot()}</div>{/if}
		{@render sidebar?.()}
	</aside>
	<div class="kin-shell__panel" inert={narrow && open}>
		<header class="kin-shell__bar" data-scrolled={scrolled ? "" : undefined}>
			<button
				type="button"
				class="kin-button kin-button--ghost kin-button--icon kin-shell__fold"
				data-size="compact"
				aria-controls={sidebarId}
				aria-expanded={!folded}
				aria-label={foldLabel(folded)}
				title={chordName
					? `${foldLabel(folded)} · ${chordName}`
					: foldLabel(folded)}
				bind:this={foldButton}
				onclick={() => setFold(!folded)}
			>
				{#if foldIcon}{@render foldIcon()}{:else}
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.75"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
						><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><path
							d="M9.5 4.5v15"
						/></svg
					>
				{/if}
			</button>
			<button
				type="button"
				class="kin-button kin-button--ghost kin-button--icon kin-shell__menu"
				data-size="compact"
				aria-controls={sidebarId}
				aria-expanded={open}
				aria-label={menuLabel(open)}
				bind:this={menuButton}
				onclick={() => void setDrawer(!open)}
			>
				<span class="kin-shell__glyph">
					{#if menuIcon}{@render menuIcon()}{:else}
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.75"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"><path d="M4.5 7h15M4.5 12h15M4.5 17h15" /></svg
						>
					{/if}
					{@render menuGlyph?.()}
				</span>
			</button>
			{#if bar}
				{@render bar()}
			{:else}
				{#if crumbs}
					<nav
						class="kin-breadcrumb kin-shell__crumbs"
						aria-label={crumbsLabel}
					>
						<ol>{@render crumbs()}</ol>
					</nav>
				{/if}
				{#if end}<div class="kin-shell__end">{@render end()}</div>{/if}
			{/if}
		</header>
		<main
			class="kin-shell__page"
			id={mainId}
			tabindex="-1"
			bind:this={page}
			onscrollcapture={measure}
		>
			{@render children()}
		</main>
	</div>
</div>
