import { test, expect } from "@playwright/test";
import { serve } from "./support.js";

// The Svelte Shell carries "Behaviour each product writes" (docs/catalog.md);
// the demo is a whole application built from the layer alone.
const wide = { width: 1280, height: 900 };
const narrow = { width: 420, height: 860 };

async function open(page, size = wide) {
	const problems = [];
	page.on("console", (message) => {
		if (["error", "warning"].includes(message.type())) {
			problems.push(message.text());
		}
	});
	page.on("pageerror", (error) => problems.push(error.message));
	await page.setViewportSize(size);
	await serve(page, "");
	await page.goto("http://design.test/svelte/shell/");
	await page.waitForFunction(() =>
		[...document.querySelectorAll("astro-island")].every(
			(island) => !island.hasAttribute("ssr"),
		),
	);
	return problems;
}

const shell = (page) => page.locator(".kin-shell");
const fold = (page) => page.locator(".kin-shell__fold");
const menu = (page) => page.locator(".kin-shell__menu");
const sidebar = (page) => page.locator(".kin-shell__sidebar");
const panel = (page) => page.locator(".kin-shell__panel");
const focused = (page) =>
	page.evaluate(
		() =>
			document.activeElement?.getAttribute("aria-label") ??
			document.activeElement?.className ??
			"",
	);
// The platform's chord: ⌘ where the browser says it is a Mac, as WebKit does
// on every system, and Ctrl elsewhere.
async function chord(page, extra = "") {
	const mac = await page.evaluate(() =>
		/Mac|iPhone|iPad/.test(navigator.userAgent),
	);
	const other = mac ? "Control+" : "Meta+";
	await page.keyboard.press(
		`${mac ? "Meta" : "Control"}+${extra === "other" ? other : extra}b`,
	);
}

test("beside the page, the fold folds and hands focus out of the column", async ({
	page,
}) => {
	const problems = await open(page);
	await expect(shell(page)).not.toHaveAttribute("data-drawer", /./);
	await expect(fold(page)).toHaveAttribute("aria-expanded", "true");
	await expect(fold(page)).toHaveAttribute("aria-label", "Collapse sidebar");
	await expect(fold(page)).toHaveAttribute("aria-controls", "demo-navigation");
	await page.locator("#demo-column a").first().focus();
	await fold(page).evaluate((button) => button.click());
	await expect(shell(page)).toHaveAttribute("data-folded", "");
	await expect(fold(page)).toHaveAttribute("aria-label", "Expand sidebar");
	expect(await focused(page)).toBe("Expand sidebar");
	await expect(sidebar(page)).not.toHaveAttribute("inert", /.*/);
	expect(problems).toEqual([]);
});

test("the chord folds beside the page and never fires with another modifier", async ({
	page,
}) => {
	const problems = await open(page);
	await page.locator("#main").focus();
	await chord(page);
	await expect(shell(page)).toHaveAttribute("data-folded", "");
	await chord(page, "other");
	await expect(shell(page)).toHaveAttribute("data-folded", "");
	await chord(page, "Shift+");
	await expect(shell(page)).toHaveAttribute("data-folded", "");
	await chord(page);
	await expect(shell(page)).not.toHaveAttribute("data-folded", /.*/);
	expect(problems).toEqual([]);
});

test("as a drawer, it opens on the current item, keeps the page inert and closes back to the menu", async ({
	page,
}) => {
	const problems = await open(page, narrow);
	await expect(shell(page)).toHaveAttribute("data-drawer", "closed");
	await expect(sidebar(page)).toHaveAttribute("inert", "");
	await expect(menu(page)).toHaveAttribute(
		"aria-label",
		"Open navigation, 3 waiting on you",
	);
	await menu(page).click();
	await expect(shell(page)).toHaveAttribute("data-drawer", "open");
	await expect(panel(page)).toHaveAttribute("inert", "");
	await expect(sidebar(page)).not.toHaveAttribute("inert", /.*/);
	await expect(
		page.locator('.kin-shell__item[aria-current="page"]'),
	).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(shell(page)).toHaveAttribute("data-drawer", "closed");
	await expect(menu(page)).toBeFocused();
	// The backdrop closes it too.
	await menu(page).click();
	await page.mouse.click(narrow.width - 10, narrow.height / 2);
	await expect(shell(page)).toHaveAttribute("data-drawer", "closed");
	expect(problems).toEqual([]);
});

test("a link followed in the drawer closes it and the page takes focus", async ({
	page,
}) => {
	const problems = await open(page, narrow);
	await menu(page).click();
	await page
		.locator(".kin-shell__pages .kin-shell__item", { hasText: "Activity" })
		.click();
	await expect(shell(page)).toHaveAttribute("data-drawer", "closed");
	await expect(page.locator("#main")).toBeFocused();
	await expect(page.locator(".kin-page-head__title")).toHaveText("Activity");
	expect(problems).toEqual([]);
});

test("Escape closes a modal before the drawer", async ({ page }) => {
	const problems = await open(page, narrow);
	await menu(page).click();
	await page.evaluate(() => document.querySelector("#inspector")?.showModal());
	await page.keyboard.press("Escape");
	await expect(page.locator("#inspector")).not.toHaveAttribute("open", /.*/);
	await expect(shell(page)).toHaveAttribute("data-drawer", "open");
	expect(problems).toEqual([]);
});

test("crossing the breakpoint closes the drawer and moves focus to what shows", async ({
	page,
}) => {
	const problems = await open(page);
	await fold(page).focus();
	await page.setViewportSize(narrow);
	await expect(shell(page)).toHaveAttribute("data-drawer", "closed");
	await expect(menu(page)).toBeFocused();
	await expect(shell(page)).not.toHaveAttribute("data-resizing", /.*/);
	await page.setViewportSize(wide);
	await expect(shell(page)).not.toHaveAttribute("data-drawer", /.*/);
	await expect(fold(page)).toBeFocused();
	expect(problems).toEqual([]);
});

test("the shell writes its own first-paint guard for its breakpoint", async ({
	page,
}) => {
	await open(page, narrow);
	const guard = await page
		.locator("style[data-kin-shell-guard]")
		.evaluate((style) => style.textContent);
	expect(guard).toContain("@media (max-width: 48rem)");
	expect(guard).toContain(".kin-shell:not([data-drawer])>.kin-shell__sidebar");
	// Without the attribute, the sidebar waits off the page.
	const box = await page.evaluate(() => {
		const shellElement = document.querySelector(".kin-shell");
		shellElement?.removeAttribute("data-drawer");
		const rect = document
			.querySelector(".kin-shell__sidebar")
			?.getBoundingClientRect();
		return rect ? rect.right : NaN;
	});
	expect(box).toBeLessThanOrEqual(0);
});

test("the hairline follows the page's scroll", async ({ page }) => {
	const problems = await open(page, { width: 1280, height: 520 });
	const bar = page.locator(".kin-shell__bar");
	await expect(bar).not.toHaveAttribute("data-scrolled", /.*/);
	await page.locator("#main").evaluate((main) => main.scrollTo(0, 200));
	await expect(bar).toHaveAttribute("data-scrolled", "");
	await page.locator("#main").evaluate((main) => main.scrollTo(0, 0));
	await expect(bar).not.toHaveAttribute("data-scrolled", /.*/);
	expect(problems).toEqual([]);
});

test("Escape puts away a showing tip without moving focus", async ({
	page,
}) => {
	const problems = await open(page);
	const item = page
		.locator(".kin-shell__pages .kin-shell__item")
		.filter({ hasText: "Activity" });
	await item.hover();
	const tip = item.locator(".kin-shell__tip");
	await expect(tip).toBeVisible();
	await page.waitForFunction(
		(element) => Number(getComputedStyle(element).opacity) > 0.5,
		await tip.elementHandle(),
	);
	await page.keyboard.press("Escape");
	await expect(item).toHaveAttribute("data-tip", "hidden");
	await page.mouse.move(700, 600);
	await expect(item).not.toHaveAttribute("data-tip", /.*/);
	expect(problems).toEqual([]);
});

test("rail items carry their name, count and tip", async ({ page }) => {
	await open(page);
	const library = page
		.locator(".kin-shell__pages .kin-shell__item")
		.filter({ hasText: "Library" });
	await expect(library).toHaveAccessibleName(/^Library, 3 waiting on you/);
	await expect(library.locator(".kin-shell__badge")).toHaveText("3");
	await expect(library.locator(".kin-shell__badge")).toHaveAttribute(
		"aria-hidden",
		"true",
	);
});
