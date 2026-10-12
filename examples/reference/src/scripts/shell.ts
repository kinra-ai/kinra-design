/*
 * Reference behaviour for the application shell (docs/catalog.md,
 * "Application shell"). The catalog's demo runs it. It is not exported: a
 * product writes the same behaviour where its state already lives, in its
 * own framework, and keeps the fold wherever it keeps preferences. Each rule
 * below is a line of the catalog's behaviour checklist.
 */

export type ShellOptions = {
	/** The product's own breakpoint: below it the sidebar is a drawer. */
	drawer: string;
	/** Whether, as a drawer, the page scrolls with the document. */
	documentScroll?: boolean;
	/** The remembered fold. */
	folded?: boolean;
	/** Starts with the drawer open without moving focus: a specimen, or a
	    state the product restores. */
	open?: boolean;
	/** Remembers the fold; where is the product's choice. */
	onfold?: (folded: boolean) => void;
	/** The drawer control's name, which may count what waits. */
	menuName?: (open: boolean) => string;
};

export type Shell = {
	fold(folded: boolean): void;
	drawer(open: boolean): void;
	/** Measures the page's scroller again, after navigation. */
	settle(): void;
	/** The element the page scrolls in now: the page, or the document. */
	scroller(): Element;
	disconnect(): void;
};

/** ⌘ on a Mac, whose Ctrl+B moves the caret in a field; Ctrl elsewhere. */
export const mac = /Mac|iPhone|iPad/.test(navigator.userAgent);
export const chordLabel = mac ? "⌘B" : "Ctrl+B";

const focusable =
	'a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function connectShell(shell: HTMLElement, options: ShellOptions): Shell {
	const part = <T extends HTMLElement = HTMLElement>(name: string) =>
		shell.querySelector<T>(`.kin-shell__${name}`);
	const sidebar = part("sidebar");
	const panel = part("panel");
	if (!sidebar || !panel)
		throw new Error("A shell needs a sidebar and a panel.");
	const column = part("column");
	const marks = part("marks");
	const bar = part("bar");
	const page = part("page");
	const fold = part<HTMLButtonElement>("fold");
	const menu = part<HTMLButtonElement>("menu");
	const backdrop = part("backdrop");
	const narrow = matchMedia(options.drawer);
	const listening = new AbortController();
	const { signal } = listening;
	let folded = !!options.folded;
	let open = !!options.open && narrow.matches;
	let scrolled = false;

	if (options.documentScroll) shell.dataset.scroll = "document";

	const scroller = () =>
		narrow.matches && options.documentScroll
			? (document.scrollingElement ?? document.documentElement)
			: (page ?? panel);

	/* State reaches the page as attributes the stylesheet reads, and as the
	   inertness of whichever of the sidebar and the panel is behind. The fold
	   applies only beside the page; a drawer ignores it and keeps it. */
	function render() {
		const drawer = narrow.matches;
		shell.toggleAttribute("data-folded", folded && !drawer);
		if (drawer) shell.dataset.drawer = open ? "open" : "closed";
		else delete shell.dataset.drawer;
		sidebar!.inert = drawer && !open;
		panel!.inert = drawer && open;
		if (fold) {
			const verb = folded ? "Expand" : "Collapse";
			fold.setAttribute("aria-expanded", String(!folded));
			fold.setAttribute("aria-label", `${verb} sidebar`);
			fold.title = `${verb} sidebar · ${chordLabel}`;
		}
		if (menu) {
			menu.setAttribute("aria-expanded", String(open));
			menu.setAttribute(
				"aria-label",
				options.menuName?.(open) ??
					(open ? "Close navigation" : "Open navigation"),
			);
		}
	}

	/* A change that hides what holds focus hands focus to the control that
	   changes the sidebar, the fold or the menu, whichever shows: folding
	   hides the column, unfolding the marks, the drawer layout the fold, and
	   leaving it the menu and a closed drawer. */
	function rescue(active: Element | null) {
		if (!active || !shell.contains(active)) return;
		const drawer = narrow.matches;
		const hidden =
			(active === fold && drawer) ||
			(active === menu && !drawer) ||
			(!drawer && folded && !!column?.contains(active)) ||
			(!!marks?.contains(active) && (drawer || !folded)) ||
			(drawer && !open && sidebar!.contains(active));
		if (hidden) (drawer ? menu : fold)?.focus({ preventScroll: true });
	}

	/* Folding takes the column away, and unfolding the marks; focus left in
	   either goes to the fold first. */
	function setFold(next: boolean) {
		if (narrow.matches || next === folded) return;
		folded = next;
		rescue(document.activeElement);
		options.onfold?.(folded);
		render();
	}

	/* Opening hands the keyboard to the drawer, at the current page's item or
	   else the first that takes focus, never a mark, which the drawer hides,
	   and makes the page inert. Closing by Escape or the backdrop gives focus
	   back to the drawer's control; a link followed in the drawer gives it to
	   the destination. */
	function setDrawer(next: boolean, restore: "menu" | "page" = "menu") {
		if (!narrow.matches || next === open) return;
		open = next;
		render();
		if (open) {
			const shown = ":not(.kin-shell__marks *)";
			const start =
				sidebar!.querySelector<HTMLElement>(`[aria-current="page"]${shown}`) ??
				sidebar!.querySelector<HTMLElement>(`:is(${focusable})${shown}`);
			start?.focus();
		} else if (restore === "page") page?.focus({ preventScroll: true });
		else menu?.focus();
	}

	/* The hairline says the page is scrolled beneath the bar: measured on the
	   scroller the page actually moves in, on scroll and after navigation. */
	function measure() {
		const next = scroller().scrollTop > 0;
		if (next === scrolled) return;
		scrolled = next;
		bar?.toggleAttribute("data-scrolled", next);
	}

	/* ⌘B on a Mac and Ctrl+B elsewhere, never both, without Alt, Shift or a
	   held key's repeats. Native modals and rich text keep the chord. Beside
	   the page it folds; as a drawer it opens and closes. */
	function chord(event: KeyboardEvent) {
		if (event.repeat || event.altKey || event.shiftKey) return false;
		if (mac ? !event.metaKey || event.ctrlKey : !event.ctrlKey || event.metaKey)
			return false;
		if (event.key.toLowerCase() !== "b") return false;
		if (document.querySelector("dialog:modal")) return false;
		return !(
			event.target instanceof HTMLElement && event.target.isContentEditable
		);
	}

	/* Beside the page, Escape puts away a tip that is showing, without moving
	   focus or the pointer, until the pointer or focus leaves its item. The
	   key itself makes focus visible, so a focused item's tip counts. */
	function dismissTip() {
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
			// The top layer owns Escape first: an open popover or modal closes
			// before anything here. An open drawer closes next, its tips with
			// it; beside the page, a tip that is showing goes.
			if (document.querySelector(":popover-open, dialog:modal")) return;
			if (!open) {
				dismissTip();
				return;
			}
			event.preventDefault();
			setDrawer(false);
			return;
		}
		if (!chord(event)) return;
		event.preventDefault();
		if (narrow.matches) setDrawer(!open);
		else setFold(!folded);
	}

	/* Crossing the breakpoint closes the drawer, moves focus out of whatever
	   the new layout hides, and settles it without moving: transitions are
	   off for the one reflow. */
	function relayout() {
		const active = document.activeElement;
		shell.toggleAttribute("data-resizing", true);
		open = false;
		render();
		rescue(active);
		void shell.offsetWidth;
		shell.toggleAttribute("data-resizing", false);
		measure();
	}

	fold?.addEventListener("click", () => setFold(!folded), { signal });
	menu?.addEventListener("click", () => setDrawer(!open), { signal });
	backdrop?.addEventListener("click", () => setDrawer(false), { signal });
	sidebar.addEventListener(
		"click",
		(event) => {
			const link = (event.target as Element).closest("a[href]");
			if (open && link && sidebar.contains(link)) setDrawer(false, "page");
		},
		{ signal },
	);
	page?.addEventListener("scroll", measure, { passive: true, signal });
	window.addEventListener("scroll", measure, { passive: true, signal });
	window.addEventListener("keydown", keydown, { signal });
	narrow.addEventListener("change", relayout, { signal });
	render();
	measure();

	return {
		fold: setFold,
		drawer: (next) => setDrawer(next),
		settle: measure,
		scroller,
		disconnect: () => listening.abort(),
	};
}
