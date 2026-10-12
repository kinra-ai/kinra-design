/*
 * The shell demo's own behaviour: sample routing, the colour scheme control,
 * the account card's placement and the frame parameters. Everything here is
 * reference-only, the way each product owns its own. The shell's behaviour
 * contract is ./shell.ts.
 */
import { connectShell } from "./shell";

type Scheme = "dark" | "light" | "auto";
const schemes: Record<Scheme, { label: string; next: Scheme }> = {
	dark: { label: "Graphite", next: "light" },
	light: { label: "Paper", next: "auto" },
	auto: { label: "Auto, as the system", next: "dark" },
};
const FOLD = "kin-shell-demo-fold";
const SCHEME = "kin-scheme";

function read(key: string) {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function write(key: string, value: string) {
	try {
		localStorage.setItem(key, value);
	} catch {
		// Private browsing keeps the choice for this visit only.
	}
}

export function run() {
	const params = new URLSearchParams(location.search);
	const root = document.documentElement;
	const element = document.querySelector<HTMLElement>(".kin-shell");
	if (!element) return;
	// A frame that names a state shows it, and never writes the choice the
	// full-screen demo and the catalog remember.
	const pinnedFold = params.has("fold");
	const pinnedScheme = params.has("scheme");
	const at = params.get("at");
	if (params.has("labels")) element.dataset.labels = "drawer";

	const shell = connectShell(element, {
		drawer: `(max-width: ${at && /^\d+(\.\d+)?$/.test(at) ? at : "48"}rem)`,
		documentScroll: params.get("scroll") === "document",
		folded: pinnedFold
			? params.get("fold") === "folded"
			: read(FOLD) === "folded",
		open: params.get("drawer") === "open",
		onfold: (folded) => {
			if (!pinnedFold) write(FOLD, folded ? "folded" : "open");
		},
		menuName: (open) =>
			open ? "Close navigation" : "Open navigation, 3 waiting on you",
	});

	/* Sample routing: a rail page or a collection becomes the page in view.
	   The shell's own handler has already closed a drawer and given focus to
	   the page. */
	const title = document.getElementById("page-title");
	const summary = document.getElementById("page-summary");
	const crumbs = document.getElementById("crumbs");
	function show(kind: "page" | "collection", id: string) {
		for (const link of document.querySelectorAll<HTMLElement>(
			".kin-shell__item[data-page], [data-collection]",
		)) {
			const here =
				kind === "page"
					? link.dataset.page === id
					: link.dataset.collection === id;
			if (here) link.setAttribute("aria-current", "page");
			else link.removeAttribute("aria-current");
		}
		const source = document.querySelector<HTMLElement>(
			kind === "page"
				? `.kin-shell__item[data-page="${CSS.escape(id)}"]`
				: `.demo-collections [data-collection="${CSS.escape(id)}"]`,
		);
		const name =
			source?.querySelector(
				kind === "page" ? ".kin-shell__label" : ".demo-row__name",
			)?.textContent ?? "";
		if (title) title.textContent = name;
		if (summary)
			summary.textContent =
				kind === "page"
					? (source?.dataset.summary ?? "")
					: (source?.querySelector(".demo-row__caption")?.textContent ?? "");
		if (crumbs) {
			crumbs.replaceChildren();
			if (kind === "collection") {
				const item = document.createElement("li");
				const link = document.createElement("a");
				link.href = "#library";
				link.dataset.page = "library";
				link.textContent = "Library";
				item.append(link);
				crumbs.append(item);
			}
			const item = document.createElement("li");
			const current = document.createElement("span");
			current.setAttribute("aria-current", "page");
			current.textContent = name;
			item.append(current);
			crumbs.append(item);
		}
		document.title = `${name} · Shell demo`;
		// A new page begins at its top.
		shell.scroller().scrollTop = 0;
		shell.settle();
	}
	document.addEventListener("click", (event) => {
		if (
			event.button ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		)
			return;
		const link = (event.target as Element).closest<HTMLElement>(
			"a[data-page], a[data-collection]",
		);
		if (!link) return;
		event.preventDefault();
		if (link.dataset.page) show("page", link.dataset.page);
		else if (link.dataset.collection)
			show("collection", link.dataset.collection);
	});

	/* The colour scheme: three states, as a product might offer them. A frame
	   that names its scheme keeps it; otherwise the demo follows the catalog's
	   choice and remembers its own. */
	const toggle = document.getElementById("scheme-toggle");
	const hint = document.getElementById("scheme-hint");
	function paint(scheme: Scheme) {
		root.dataset.kinScheme = scheme;
		const { label, next } = schemes[scheme];
		toggle?.setAttribute("aria-label", `Colour scheme: ${label}`);
		if (hint) hint.textContent = `${label}. Press for ${schemes[next].label}.`;
		for (const glyph of toggle?.querySelectorAll<SVGElement>(
			"svg[data-icon]",
		) ?? [])
			glyph.toggleAttribute("hidden", glyph.dataset.icon !== scheme);
	}
	const current = (): Scheme => {
		const scheme = root.dataset.kinScheme;
		return scheme === "light" || scheme === "auto" ? scheme : "dark";
	};
	paint(current());
	toggle?.addEventListener("click", () => {
		const next = schemes[current()].next;
		paint(next);
		if (!pinnedScheme) write(SCHEME, next);
	});
	window.addEventListener("storage", (event) => {
		const scheme = event.newValue;
		if (pinnedScheme || event.key !== SCHEME) return;
		if (scheme === "dark" || scheme === "light" || scheme === "auto")
			paint(scheme);
	});

	/* The account card opens beside its control at the rail's foot, toward
	   the page, whichever way the line runs. Its control's tip steps aside
	   while the card is open. */
	const account = document.getElementById("demo-account");
	const accountButton = document.getElementById("account-button");
	account?.addEventListener("beforetoggle", (event) => {
		if ((event as ToggleEvent).newState !== "open" || !accountButton) return;
		const box = accountButton.getBoundingClientRect();
		const rtl = getComputedStyle(accountButton).direction === "rtl";
		const gap = 8;
		account.style.insetInlineStart = `${rtl ? innerWidth - box.left + gap : box.right + gap}px`;
		account.style.insetBlockEnd = `${Math.max(gap, innerHeight - box.bottom)}px`;
	});
	account?.addEventListener("toggle", (event) => {
		accountButton?.setAttribute(
			"aria-expanded",
			String((event as ToggleEvent).newState === "open"),
		);
	});

	const dialog = document.getElementById("new-collection-dialog");
	document
		.getElementById("new-collection")
		?.addEventListener("click", () =>
			dialog instanceof HTMLDialogElement ? dialog.showModal() : undefined,
		);

	/* Frame parameters: a tip shown at rest, and a page already scrolled
	   beneath its bar. */
	const tip = params.get("tip");
	if (tip)
		document
			.querySelector(`.kin-shell__item[data-page="${CSS.escape(tip)}"]`)
			?.classList.add("demo-tip");
	if (params.has("scrolled")) {
		shell.scroller().scrollTop = 240;
		shell.settle();
	}
}
