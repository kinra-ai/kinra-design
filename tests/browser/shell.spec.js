import { test, expect } from "@playwright/test";
import { serve } from "./support.js";

// The application shell (src/styles/shell.css) with the catalog's reference
// behaviour (examples/reference/src/scripts/shell.ts), at /shell/demo/.
const desktop = { width: 1280, height: 800 };
const phone = { width: 390, height: 844 };
const rem = 16;

/** Opens the demo. Motion is reduced unless a check asks for it, so every
    state settles at once. */
async function open(
	page,
	query = "",
	{ viewport = desktop, motion = false } = {},
) {
	await serve(page);
	await page.setViewportSize(viewport);
	await page.emulateMedia({
		reducedMotion: motion ? "no-preference" : "reduce",
	});
	await page.goto(`http://design.test/shell/demo/${query ? `?${query}` : ""}`);
	await page.evaluate(() => document.fonts.ready);
}

const shell = (page) => page.locator(".kin-shell");
const sidebar = (page) => page.locator(".kin-shell__sidebar");
const panel = (page) => page.locator(".kin-shell__panel");
const item = (page, name) =>
	page.locator(`.kin-shell__pages .kin-shell__item[data-page="${name}"]`);
const inert = (locator) => locator.evaluate((element) => element.inert);
const centre = (box) => box.y + box.height / 2;

/** The chord's modifier as the page reads the platform: ⌘ on a Mac, Ctrl
    elsewhere. Playwright's WebKit reports a Mac on every host. */
async function chord(page, extra = "") {
	const mac = await page.evaluate(() =>
		/Mac|iPhone|iPad/.test(navigator.userAgent),
	);
	await page.keyboard.press(`${mac ? "Meta" : "Control"}+${extra}B`);
}

/** No sideways scroll: neither the document nor the page's own scroller. */
const fits = (page) =>
	page.evaluate(() => {
		const main = document.getElementById("main");
		return (
			document.documentElement.scrollWidth <= innerWidth &&
			(!main || main.scrollWidth <= main.clientWidth + 1)
		);
	});

test("the fold and its chord fold the sidebar to its rail and remember it", async ({
	page,
}) => {
	await open(page);
	const fold = page.locator(".kin-shell__fold");
	await expect(fold).toBeVisible();
	await expect(page.locator(".kin-shell__menu")).toBeHidden();
	await expect(fold).toHaveAttribute("aria-expanded", "true");
	await expect(fold).toHaveAccessibleName("Collapse sidebar");
	// Open is the fold's resting state: no pressed fill.
	await expect(fold).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
	expect((await sidebar(page).boundingBox()).width).toBeCloseTo(20.5 * rem, 0);
	await expect(page.locator(".kin-shell__column")).toBeVisible();
	await expect(page.locator(".kin-shell__marks")).toBeHidden();
	// The K stands on the bar's centre line.
	const mark = await page.locator(".kin-shell__home img").boundingBox();
	expect(
		Math.abs(centre(mark) - centre(await fold.boundingBox())),
	).toBeLessThan(1);

	await fold.click();
	await expect(shell(page)).toHaveAttribute("data-folded", "");
	await expect(fold).toHaveAttribute("aria-expanded", "false");
	await expect(fold).toHaveAccessibleName("Expand sidebar");
	expect((await sidebar(page).boundingBox()).width).toBeCloseTo(3.5 * rem, 0);
	await expect(page.locator(".kin-shell__column")).toBeHidden();
	await expect(page.locator(".kin-shell__marks")).toBeVisible();
	// Nothing in the rail moved.
	expect(await page.locator(".kin-shell__home img").boundingBox()).toEqual(
		mark,
	);

	await page.reload();
	await expect(shell(page)).toHaveAttribute("data-folded", "");
	await page.locator("#main").focus();
	await chord(page, "Shift+");
	await expect(shell(page)).toHaveAttribute("data-folded", "");
	await chord(page);
	await expect(shell(page)).not.toHaveAttribute("data-folded");
	await chord(page);
	await expect(shell(page)).toHaveAttribute("data-folded", "");
});

test("folding moves focus out of the column, and the chord yields to a modal", async ({
	page,
}) => {
	await open(page, "fold=open");
	await page.locator("#collection-search").focus();
	await chord(page);
	await expect(shell(page)).toHaveAttribute("data-folded", "");
	await expect(page.locator(".kin-shell__fold")).toBeFocused();
	await chord(page);
	await expect(shell(page)).not.toHaveAttribute("data-folded");

	await page.getByRole("button", { name: "New collection" }).click();
	const dialog = page.getByRole("dialog", { name: "New collection" });
	await expect(dialog).toBeVisible();
	await chord(page);
	await expect(shell(page)).not.toHaveAttribute("data-folded");
	await page.keyboard.press("Escape");
	await expect(dialog).toBeHidden();
});

test("rail items name themselves beside the rail, over the page", async ({
	page,
}) => {
	await open(page, "fold=folded");
	const inbox = item(page, "inbox");
	const tip = inbox.locator(".kin-shell__tip");
	await expect(tip).toHaveCSS("opacity", "0");
	await inbox.hover();
	await expect(tip).toHaveCSS("opacity", "1");
	const box = await tip.boundingBox();
	const own = await inbox.boundingBox();
	expect(box.x).toBeGreaterThan(own.x + own.width);
	expect(Math.abs(centre(box) - centre(own))).toBeLessThan(1);
	// It stands over the panel it reaches across, above anything there.
	expect(box.x + box.width).toBeGreaterThan(
		(await panel(page).boundingBox()).x,
	);
	const onTop = await tip.evaluate((element) => {
		const rect = element.getBoundingClientRect();
		element.style.pointerEvents = "auto";
		const hit = document.elementFromPoint(rect.right - 4, rect.top + 4);
		element.style.pointerEvents = "";
		return element.contains(hit);
	});
	expect(onTop).toBe(true);
	await page.mouse.move(900, 500);
	await expect(tip).toHaveCSS("opacity", "0");

	// The keyboard names it too.
	await item(page, "overview").focus();
	await page.keyboard.press("Tab");
	await expect(inbox).toBeFocused();
	await expect(tip).toHaveCSS("opacity", "1");

	// A count sits on its glyph's top end corner, and the name says it.
	const glyph = await inbox.locator(".kin-shell__glyph").boundingBox();
	const badge = await inbox.locator(".kin-shell__badge").boundingBox();
	expect(badge.x + badge.width).toBeGreaterThan(glyph.x + glyph.width);
	expect(badge.y).toBeLessThan(glyph.y);
	await expect(inbox).toHaveAccessibleName("Inbox, 3 waiting on you");

	// A control whose own popover is open drops its tip.
	const account = page.locator("#account-button");
	await account.click();
	const card = page.getByRole("dialog", { name: "Your account" });
	await expect(card).toBeVisible();
	await expect(account).toHaveAttribute("aria-expanded", "true");
	await expect(account.locator(".kin-shell__tip")).toBeHidden();
	await page.keyboard.press("Escape");
	await expect(card).toBeHidden();
	await expect(account).toHaveAttribute("aria-expanded", "false");
});

test("a tip can be hovered, and Escape puts it away without moving focus", async ({
	page,
}) => {
	await open(page, "fold=folded");
	const inbox = item(page, "inbox");
	const tip = inbox.locator(".kin-shell__tip");
	const shown = () =>
		tip.evaluate((element) => {
			const style = getComputedStyle(element);
			return style.display !== "none" && style.opacity === "1";
		});
	// The pointer crosses the gap onto the tip and rests there.
	await inbox.hover();
	expect(await shown()).toBe(true);
	const box = await tip.boundingBox();
	await page.mouse.move(box.x + box.width / 2, centre(box), { steps: 8 });
	expect(await shown()).toBe(true);
	// Escape puts it away, and neither the pointer nor focus moves.
	const before = await page.evaluate(() => document.activeElement?.className);
	await page.keyboard.press("Escape");
	expect(await shown()).toBe(false);
	expect(await page.evaluate(() => document.activeElement?.className)).toBe(
		before,
	);
	// It returns once the pointer has left its item.
	await page.mouse.move(900, 500);
	await expect(inbox).not.toHaveAttribute("data-tip");
	await inbox.hover();
	expect(await shown()).toBe(true);
	await page.mouse.move(900, 500);

	// Under the keyboard: Escape puts the name away and focus stays; the next
	// item names itself.
	await item(page, "overview").focus();
	await page.keyboard.press("Tab");
	await expect(inbox).toBeFocused();
	expect(await shown()).toBe(true);
	await page.keyboard.press("Escape");
	expect(await shown()).toBe(false);
	await expect(inbox).toBeFocused();
	await page.keyboard.press("Tab");
	await expect(inbox).not.toHaveAttribute("data-tip");
	await expect(item(page, "library").locator(".kin-shell__tip")).toHaveCSS(
		"opacity",
		"1",
	);
});

test("in the drawer, Escape closes it at once, its tips with it", async ({
	page,
}) => {
	await open(page, "", { viewport: phone });
	await chord(page);
	await expect(shell(page)).toHaveAttribute("data-drawer", "open");
	const overview = item(page, "overview");
	await expect(overview).toBeFocused();
	await expect(overview.locator(".kin-shell__tip")).toHaveCSS("opacity", "1");
	await page.keyboard.press("Escape");
	await expect(shell(page)).toHaveAttribute("data-drawer", "closed");
	await expect(page.locator(".kin-shell__menu")).toBeFocused();
	await expect(overview).not.toHaveAttribute("data-tip");
});

test("what the page raises stays beneath the rail's tips and the drawer", async ({
	page,
}) => {
	await open(page, "fold=folded");
	// A layer the page raises to the dialog layer, where the tips stand.
	await page.evaluate(() => {
		const layer = document.createElement("div");
		layer.id = "raised";
		layer.style.cssText =
			"position: fixed; inset-block: 0; inset-inline-start: 4rem; inline-size: 20rem; z-index: var(--kin-layer-dialog); background: rgb(200 0 0 / 0.3)";
		document.getElementById("main").append(layer);
	});
	await item(page, "inbox").hover();
	const tipOnTop = await item(page, "inbox")
		.locator(".kin-shell__tip")
		.evaluate((tip) => {
			const rect = tip.getBoundingClientRect();
			return tip.contains(
				document.elementFromPoint(rect.right - 6, rect.top + rect.height / 2),
			);
		});
	expect(tipOnTop).toBe(true);
	await page.mouse.move(900, 500);

	// The open drawer stands above it too. An inert page is skipped by hit
	// testing but still paints, so inertness is lifted only to ask.
	await page.setViewportSize(phone);
	await page.locator(".kin-shell__menu").click();
	await expect(shell(page)).toHaveAttribute("data-drawer", "open");
	const drawerOnTop = await sidebar(page).evaluate((drawer) => {
		const panel = document.querySelector(".kin-shell__panel");
		panel.inert = false;
		const rect = drawer.getBoundingClientRect();
		const hit = document.elementFromPoint(rect.right - 24, rect.top + 200);
		panel.inert = true;
		return drawer.contains(hit);
	});
	expect(drawerOnTop).toBe(true);
});

test("the rail's marks show only while it is folded", async ({ page }) => {
	await open(page, "fold=folded");
	await expect(page.locator(".kin-shell__marks")).toBeVisible();
	const mark = page.locator(".kin-shell__marks .kin-shell__item").nth(1);
	const glyph = await mark.locator(".kin-avatar").boundingBox();
	const state = await mark.locator(".kin-status").boundingBox();
	expect(state.x + state.width).toBeGreaterThan(glyph.x + glyph.width);
	expect(state.y).toBeLessThan(glyph.y);
	await mark.click();
	await expect(page.locator("#page-title")).toHaveText("Quarterly review");
	await expect(mark).toHaveAttribute("aria-current", "page");

	// The drawer ignores the fold and keeps it.
	await page.setViewportSize(phone);
	await expect(shell(page)).toHaveAttribute("data-drawer", "closed");
	await expect(shell(page)).not.toHaveAttribute("data-folded");
	await page.locator(".kin-shell__menu").click();
	await expect(page.locator(".kin-shell__column")).toBeVisible();
	await expect(page.locator(".kin-shell__marks")).toBeHidden();
	await page.keyboard.press("Escape");
	await page.setViewportSize(desktop);
	await expect(shell(page)).toHaveAttribute("data-folded", "");
});

test("focus leaves whatever a change hides", async ({ page }) => {
	await open(page, "fold=folded");
	const fold = page.locator(".kin-shell__fold");
	const menu = page.locator(".kin-shell__menu");
	// Unfolding hides the marks: focus on one goes to the fold.
	await page.locator(".kin-shell__marks .kin-shell__item").first().focus();
	await chord(page);
	await expect(shell(page)).not.toHaveAttribute("data-folded");
	await expect(fold).toBeFocused();
	await chord(page);
	await expect(shell(page)).toHaveAttribute("data-folded", "");

	// With a pinned collection open, the drawer layout hides the fold: focus on
	// it goes to the menu.
	await page.locator(".kin-shell__marks .kin-shell__item").nth(1).click();
	await expect(page.locator("#page-title")).toHaveText("Quarterly review");
	await fold.focus();
	await page.setViewportSize(phone);
	await expect(shell(page)).toHaveAttribute("data-drawer", "closed");
	await expect(menu).toBeFocused();

	// Opening the drawer passes over the collection's mark, which it hides,
	// for the column's own row.
	await menu.click();
	const row = page.locator(
		'.demo-collections [data-collection="quarterly-review"]',
	);
	await expect(row).toBeFocused();

	// Widening onto the remembered fold hides the column: focus goes to the
	// fold.
	await page.setViewportSize(desktop);
	await expect(shell(page)).toHaveAttribute("data-folded", "");
	await expect(fold).toBeFocused();
});

for (const motion of [false, true]) {
	test(`the drawer holds focus over an inert page and gives it back${motion ? ", with motion" : ""}`, async ({
		page,
	}) => {
		await open(page, "", { viewport: phone, motion });
		const menu = page.locator(".kin-shell__menu");
		await expect(shell(page)).toHaveAttribute("data-drawer", "closed");
		await expect(page.locator(".kin-shell__fold")).toBeHidden();
		await expect(menu).toBeVisible();
		await expect(menu).toHaveAccessibleName(
			"Open navigation, 3 waiting on you",
		);
		// Closed, it is hidden as well as inert.
		await expect(sidebar(page)).toBeHidden();
		expect(await inert(sidebar(page))).toBe(true);
		expect(await inert(panel(page))).toBe(false);

		await menu.click();
		await expect(shell(page)).toHaveAttribute("data-drawer", "open");
		await expect(sidebar(page)).toBeVisible();
		expect(await inert(sidebar(page))).toBe(false);
		expect(await inert(panel(page))).toBe(true);
		await expect(item(page, "overview")).toBeFocused();
		await expect
			.poll(async () => (await sidebar(page).boundingBox()).x)
			.toBe(0);
		await expect(menu).toHaveAttribute("aria-expanded", "true");

		await page.keyboard.press("Escape");
		await expect(shell(page)).toHaveAttribute("data-drawer", "closed");
		await expect(menu).toBeFocused();
		await expect(sidebar(page)).toBeHidden();

		await menu.click();
		await page.mouse.click(phone.width - 12, phone.height / 2);
		await expect(shell(page)).toHaveAttribute("data-drawer", "closed");
		await expect(menu).toBeFocused();

		// An open popover takes Escape before the drawer does.
		await menu.click();
		await page.locator("#account-button").click();
		const card = page.getByRole("dialog", { name: "Your account" });
		await expect(card).toBeVisible();
		await page.keyboard.press("Escape");
		await expect(card).toBeHidden();
		await expect(shell(page)).toHaveAttribute("data-drawer", "open");
		await page.keyboard.press("Escape");
		await expect(shell(page)).toHaveAttribute("data-drawer", "closed");

		// Following a link closes it, and the destination takes focus.
		await menu.click();
		await item(page, "library").click();
		await expect(shell(page)).toHaveAttribute("data-drawer", "closed");
		await expect(page.locator("#page-title")).toHaveText("Library");
		await expect(page.locator("#main")).toBeFocused();

		// The chord opens and closes the drawer as well.
		await chord(page);
		await expect(shell(page)).toHaveAttribute("data-drawer", "open");
		await expect(item(page, "library")).toBeFocused();
		await chord(page);
		await expect(shell(page)).toHaveAttribute("data-drawer", "closed");
		await expect(sidebar(page)).toBeHidden();
	});
}

test("beside a host's reset that only shortens transitions, the drawer still takes focus", async ({
	page,
}) => {
	// The shell loaded without base.css, beside the common reset that shortens
	// every transition under reduced motion rather than removing it.
	await serve(
		page,
		`<!doctype html><html lang="en"><head><link rel="stylesheet" href="/src/styles/shell.css"><style>@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: 0.01ms !important; } }</style></head><body><div class="kin-shell" data-drawer="closed"><aside class="kin-shell__sidebar" inert><nav class="kin-shell__pages"><ul><li><a class="kin-shell__item" id="first" href="#first">First</a></li></ul></nav></aside><div class="kin-shell__panel"><header class="kin-shell__bar"><button class="kin-shell__menu" type="button">Menu</button></header><main class="kin-shell__page">Page</main></div></div></body></html>`,
	);
	await page.setViewportSize(phone);
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("http://design.test/fixture");
	const focused = await page.evaluate(() => {
		document.querySelector(".kin-shell").dataset.drawer = "open";
		document.querySelector(".kin-shell__sidebar").inert = false;
		document.getElementById("first").focus();
		return document.activeElement?.id;
	});
	expect(focused).toBe("first");
});

test("crossing the breakpoint closes the drawer and moves focus out of it", async ({
	page,
}) => {
	await open(page, "fold=open", { viewport: phone, motion: true });
	await page.locator(".kin-shell__menu").click();
	await expect(shell(page)).toHaveAttribute("data-drawer", "open");
	await page.setViewportSize(desktop);
	await expect(shell(page)).not.toHaveAttribute("data-drawer");
	expect(await inert(sidebar(page))).toBe(false);
	expect(await inert(panel(page))).toBe(false);

	await item(page, "inbox").focus();
	await page.setViewportSize(phone);
	await expect(shell(page)).toHaveAttribute("data-drawer", "closed");
	await expect(page.locator(".kin-shell__menu")).toBeFocused();
	expect(await inert(sidebar(page))).toBe(true);
	// It settles without travelling across the new width.
	expect(
		await sidebar(page).evaluate((element) => element.getAnimations().length),
	).toBe(0);
	await expect(sidebar(page)).toBeHidden();
});

test("the bar draws its hairline only while the page is scrolled beneath it", async ({
	page,
}) => {
	await open(page, "fold=open");
	const bar = page.locator(".kin-shell__bar");
	const main = page.locator("#main");
	await expect(bar).not.toHaveAttribute("data-scrolled");
	await expect(bar).toHaveCSS("box-shadow", "none");
	await main.evaluate((element) => element.scrollTo(0, 200));
	await expect(bar).toHaveAttribute("data-scrolled", "");
	await expect(bar).not.toHaveCSS("box-shadow", "none");
	// The page scrolls inside the panel; the document holds still.
	expect(await page.evaluate(() => document.scrollingElement.scrollTop)).toBe(
		0,
	);
	await main.evaluate((element) => element.scrollTo(0, 0));
	await expect(bar).not.toHaveAttribute("data-scrolled");
	// A new page begins at its top.
	await main.evaluate((element) => element.scrollTo(0, 200));
	await item(page, "activity").click();
	await expect(bar).not.toHaveAttribute("data-scrolled");
});

test("a page that scrolls with the document keeps its bar and its hairline", async ({
	page,
}) => {
	await open(page, "scroll=document", { viewport: phone });
	const bar = page.locator(".kin-shell__bar");
	await page.evaluate(() => window.scrollTo(0, 300));
	await expect(bar).toHaveAttribute("data-scrolled", "");
	expect((await bar.boundingBox()).y).toBe(0);
	await page.locator(".kin-shell__menu").click();
	await expect(page.locator("html")).toHaveCSS("overflow-y", "hidden");
	await page.keyboard.press("Escape");
	await expect(page.locator("html")).not.toHaveCSS("overflow-y", "hidden");
	await page.evaluate(() => window.scrollTo(0, 0));
	await expect(bar).not.toHaveAttribute("data-scrolled");
});

test("in document scroll, the bar's controls never move the reader", async ({
	page,
}) => {
	await open(page, "scroll=document", {
		viewport: { width: 390, height: 700 },
	});
	await page.evaluate(() => {
		const main = document.getElementById("main");
		for (let i = 0; i < 30; i += 1)
			main.insertAdjacentHTML("beforeend", `<p id="row-${i}">Row ${i}</p>`);
	});
	const y = () => page.evaluate(() => Math.round(scrollY));
	await page.evaluate(() => scrollTo(0, 900));
	const start = await y();
	expect(start).toBeGreaterThan(400);
	// Escape gives focus back to the menu where it stands.
	await page.locator(".kin-shell__menu").click();
	await page.keyboard.press("Escape");
	await expect(page.locator(".kin-shell__menu")).toBeFocused();
	expect(await y()).toBe(start);
	// Shift+Tab from the page into the bar.
	await page.evaluate(() =>
		document.getElementById("main").focus({ preventScroll: true }),
	);
	await page.keyboard.press("Shift+Tab");
	expect(
		await page.evaluate(() =>
			document
				.querySelector(".kin-shell__bar")
				.contains(document.activeElement),
		),
	).toBe(true);
	expect(await y()).toBe(start);
	// An address in the page still stops below the bar.
	const clear = await page.evaluate(() => {
		location.hash = "#row-12";
		const bar = document
			.querySelector(".kin-shell__bar")
			.getBoundingClientRect();
		return (
			document.getElementById("row-12").getBoundingClientRect().top - bar.bottom
		);
	});
	expect(clear).toBeGreaterThanOrEqual(0);
});

for (const direction of ["ltr", "rtl"]) {
	for (const scroll of ["panel", "document"]) {
		test(`no sideways scroll at 320px, ${direction}, scrolling in the ${scroll}`, async ({
			page,
		}) => {
			const query = [
				direction === "rtl" && "dir=rtl",
				scroll === "document" && "scroll=document",
			]
				.filter(Boolean)
				.join("&");
			await open(page, query, { viewport: { width: 320, height: 640 } });
			expect(await fits(page)).toBe(true);
			await page.locator(".kin-shell__menu").click();
			await expect(shell(page)).toHaveAttribute("data-drawer", "open");
			expect(await fits(page)).toBe(true);
			const box = await sidebar(page).boundingBox();
			expect(box.x).toBeGreaterThanOrEqual(0);
			expect(box.x + box.width).toBeLessThanOrEqual(320.5);
			await page.keyboard.press("Escape");
			expect(await fits(page)).toBe(true);
		});
	}
}

test("right to left, the sidebar, its tips and its drawer mirror", async ({
	page,
}) => {
	await open(page, "dir=rtl&fold=open");
	const box = await sidebar(page).boundingBox();
	expect(box.x + box.width).toBeCloseTo(desktop.width, 0);
	expect((await panel(page).boundingBox()).x).toBeCloseTo(0.5 * rem, 0);
	const inbox = item(page, "inbox");
	await inbox.hover();
	const tip = await inbox.locator(".kin-shell__tip").boundingBox();
	expect(tip.x + tip.width).toBeLessThan((await inbox.boundingBox()).x);
	const glyph = await inbox.locator(".kin-shell__glyph").boundingBox();
	const badge = await inbox.locator(".kin-shell__badge").boundingBox();
	expect(badge.x).toBeLessThan(glyph.x);

	await page.setViewportSize(phone);
	await page.locator(".kin-shell__menu").click();
	await expect(shell(page)).toHaveAttribute("data-drawer", "open");
	const drawer = await sidebar(page).boundingBox();
	expect(drawer.x + drawer.width).toBeCloseTo(phone.width, 0);
});

test("a labelled drawer names its pages beneath their glyphs", async ({
	page,
}) => {
	await open(page, "labels&drawer=open", { viewport: phone });
	const inbox = item(page, "inbox");
	const label = inbox.locator(".kin-shell__label");
	await expect(label).toBeVisible();
	await expect(inbox.locator(".kin-shell__tip")).toBeHidden();
	expect((await label.boundingBox()).y).toBeGreaterThan(
		(await inbox.locator(".kin-shell__glyph").boundingBox()).y,
	);
	expect((await inbox.boundingBox()).width).toBeCloseTo(3.5 * rem, 0);
	// What carries no label keeps its tip.
	await expect(page.locator("#account-button .kin-shell__tip")).toHaveCSS(
		"display",
		"block",
	);
	await page.keyboard.press("Escape");
	await page.setViewportSize(desktop);
	await expect(label).toBeHidden();
});

test("a short window scrolls the sidebar to its foot, never the shell", async ({
	page,
}) => {
	await open(page, "fold=open", { viewport: { width: 1280, height: 280 } });
	await page.locator("#account-button").focus();
	const placed = await page.evaluate(() => {
		const account = document.getElementById("account-button");
		const rect = account.getBoundingClientRect();
		return {
			shell: document.querySelector(".kin-shell").scrollTop,
			bar: document.querySelector(".kin-shell__bar").getBoundingClientRect()
				.top,
			top: rect.top,
			bottom: rect.bottom,
			height: innerHeight,
		};
	});
	expect(placed.shell).toBe(0);
	expect(placed.bar).toBeGreaterThanOrEqual(0);
	expect(placed.top).toBeGreaterThanOrEqual(0);
	expect(placed.bottom).toBeLessThanOrEqual(placed.height);
	await expect(sidebar(page)).toHaveCSS("overflow-y", "auto");
	// Folded under a pointer that hovers, the rail keeps its tips reaching
	// over the page.
	await chord(page);
	await expect(shell(page)).toHaveAttribute("data-folded", "");
	await expect(sidebar(page)).toHaveCSS("overflow-y", "visible");
});

test("the drawer is as tall as the shell", async ({ page }) => {
	await open(page, "", { viewport: phone });
	await shell(page).evaluate((element) =>
		element.style.setProperty("--kin-shell-height", "500px"),
	);
	await page.locator(".kin-shell__menu").click();
	await expect(shell(page)).toHaveAttribute("data-drawer", "open");
	const box = await sidebar(page).boundingBox();
	expect(box.y).toBe(0);
	expect(box.height).toBe(500);
});

for (const scheme of ["dark", "light"]) {
	test(`open, folded and drawer states in ${scheme === "dark" ? "graphite" : "paper"}`, async ({
		page,
	}, testInfo) => {
		const states = [
			["open", desktop, "fold=open&scrolled&tip=inbox"],
			["folded", desktop, "fold=folded"],
			["drawer", phone, "drawer=open"],
		];
		for (const [state, viewport, query] of states) {
			await open(page, `scheme=${scheme}&${query}`, { viewport });
			const tone = (locator) =>
				locator.evaluate(
					(element) => getComputedStyle(element).backgroundColor,
				);
			const surface = await page.evaluate(() => {
				const probe = document.createElement("div");
				probe.style.background = "var(--kin-color-surface)";
				document.body.append(probe);
				const colour = getComputedStyle(probe).backgroundColor;
				probe.remove();
				return colour;
			});
			// The page stands apart from the shelf, and the open item takes
			// the inset panel's tone.
			expect(await tone(sidebar(page))).not.toBe(await tone(panel(page)));
			expect(await tone(item(page, "overview"))).toBe(surface);
			if (state !== "drawer") expect(await tone(panel(page))).toBe(surface);
			expect(await fits(page)).toBe(true);
			await page.screenshot({
				path: testInfo.outputPath(`shell-${state}-${scheme}.png`),
			});
		}
	});
}

test("the fold moves at layer speed, and settles at once under reduced motion", async ({
	page,
}) => {
	await open(page, "fold=open", { motion: true });
	const duration = () =>
		sidebar(page).evaluate((element) =>
			parseFloat(getComputedStyle(element).transitionDuration),
		);
	expect(await duration()).toBeCloseTo(0.32, 2);
	await page.locator(".kin-shell__fold").click();
	expect(
		await sidebar(page).evaluate((element) => element.getAnimations().length),
	).toBeGreaterThan(0);
	await page.emulateMedia({ reducedMotion: "reduce" });
	expect(await duration()).toBeLessThanOrEqual(0.00001);
	await page.locator(".kin-shell__fold").click();
	await expect(shell(page)).not.toHaveAttribute("data-folded");
	expect((await sidebar(page).boundingBox()).width).toBeCloseTo(20.5 * rem, 0);
});

test("forced colours draw the edges that tone and shadow drew", async ({
	page,
}) => {
	await open(page, "fold=open&scrolled");
	await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
	test.skip(
		!(await page.evaluate(() => matchMedia("(forced-colors: active)").matches)),
		"This engine does not emulate forced colours.",
	);
	await expect(panel(page)).toHaveCSS("outline-style", "solid");
	await expect(item(page, "overview")).toHaveCSS("outline-style", "solid");
	await expect(page.locator(".kin-shell__fold")).toHaveCSS(
		"outline-style",
		"none",
	);
	// The scrolled bar draws its edge; at rest it draws none.
	const bar = page.locator(".kin-shell__bar");
	await expect(bar).toHaveAttribute("data-scrolled", "");
	await expect(bar).toHaveCSS("border-bottom-style", "solid");
	await page.locator("#main").evaluate((element) => element.scrollTo(0, 0));
	await expect(bar).not.toHaveAttribute("data-scrolled");
	await expect(bar).toHaveCSS("border-bottom-style", "none");

	await page.setViewportSize(phone);
	await page.locator(".kin-shell__menu").click();
	await expect(sidebar(page)).toHaveCSS("outline-style", "solid");
});

test("under a finger the rail keeps its targets", async ({ browser }) => {
	const context = await browser.newContext({
		hasTouch: true,
		viewport: phone,
		reducedMotion: "reduce",
		serviceWorkers: "block",
	});
	const page = await context.newPage();
	await serve(page);
	await page.goto("http://design.test/shell/demo/");
	expect(
		await page.evaluate(() => matchMedia("(pointer: coarse)").matches),
	).toBe(true);
	await page.locator(".kin-shell__menu").tap();
	await expect(shell(page)).toHaveAttribute("data-drawer", "open");
	for (const target of await page
		.locator(
			".kin-shell__pages .kin-shell__item, .kin-shell__foot .kin-shell__item",
		)
		.all())
		expect((await target.boundingBox()).height).toBeGreaterThanOrEqual(44);
	await expect(page.locator(".kin-shell__menu")).toHaveCSS(
		"min-height",
		"44px",
	);
	await context.close();
});

for (const width of [1440, 390]) {
	test(`the shell catalog page at ${width}px`, async ({ page }) => {
		await serve(page);
		await page.setViewportSize({ width, height: 900 });
		await page.goto("http://design.test/shell/");
		const frames = page.locator(".shell-frame iframe");
		expect(await frames.count()).toBeGreaterThan(4);
		for (const frame of await frames.all())
			expect(await frame.getAttribute("title")).toBeTruthy();
		await expect(
			page.frameLocator(".shell-frame iframe >> nth=0").locator(".kin-shell"),
		).toBeVisible();
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
		).toBe(true);
	});
}
