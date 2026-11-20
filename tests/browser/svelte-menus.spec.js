import { test, expect } from "@playwright/test";
import { serve } from "./support.js";

// Menus, context menus and tips from the Svelte layer (docs/svelte.md), read
// from the built catalog page.
async function open(page) {
	const problems = [];
	page.on("console", (message) => {
		if (["error", "warning"].includes(message.type())) {
			problems.push(message.text());
		}
	});
	page.on("pageerror", (error) => problems.push(error.message));
	await serve(page, "");
	await page.goto("http://design.test/svelte/menus/");
	await page.waitForFunction(() =>
		[...document.querySelectorAll("astro-island")].every(
			(island) => !island.hasAttribute("ssr"),
		),
	);
	return problems;
}

// A layer's box once its arrival has finished, since the arrival moves it.
const box = (locator) =>
	locator.evaluate(async (element) => {
		// A transition cut short rejects its promise; it has still ended.
		await Promise.all(
			element
				.getAnimations()
				.map((animation) => animation.finished.catch(() => {})),
		);
		const { left, top, right, bottom } = element.getBoundingClientRect();
		return { left, top, right, bottom };
	});

/** Scrolls the page at once so the element's top stands `y` pixels down. */
const standAt = (locator, y) =>
	locator.evaluate((element, y) => {
		const top = element.getBoundingClientRect().top;
		window.scrollTo({ top: window.scrollY + top - y, behavior: "instant" });
	}, y);

const viewport = (page) =>
	page.evaluate(() => ({
		width: document.documentElement.clientWidth,
		height: document.documentElement.clientHeight,
	}));

/** Escape that reaches the window after a menu handled it. */
const watchEscape = (page) =>
	page.evaluate(() => {
		window.escapes = 0;
		window.addEventListener("keydown", (event) => {
			if (event.key === "Escape") window.escapes++;
		});
	});

test("a menu button keeps its popup state and returns focus on Escape", async ({
	page,
}) => {
	const problems = await open(page);
	await watchEscape(page);
	const trigger = page.locator("#actions-trigger");
	const menu = page.getByRole("menu", { name: "Session actions" });
	await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
	await expect(trigger).toHaveAttribute("aria-expanded", "false");
	await expect(trigger).toHaveAccessibleName("Session actions");
	const controls = await trigger.getAttribute("aria-controls");
	await expect(menu).toBeHidden();
	await trigger.click();
	await expect(menu).toBeVisible();
	await expect(trigger).toHaveAttribute("aria-expanded", "true");
	// It names the menu itself, whose popover holds it.
	await expect(page.locator(`#${controls}`)).toHaveAttribute("role", "menu");
	const popover = page.locator(`#${controls}`).locator("xpath=..");
	await expect(popover).toHaveClass("kin-popover");
	await expect(popover).toHaveAttribute("popover", "auto");
	await expect(popover.locator("> ul.kin-menu")).toHaveAttribute(
		"role",
		"menu",
	);
	await expect(page.getByRole("menuitem", { name: "Open" })).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(menu).toBeHidden();
	await expect(trigger).toHaveAttribute("aria-expanded", "false");
	await expect(trigger).toBeFocused();
	// Only the menu closed: the Escape went no further.
	expect(await page.evaluate(() => window.escapes)).toBe(0);
	expect(problems).toEqual([]);
});

test("the keyboard wraps, jumps, types ahead and leaves with Tab", async ({
	page,
}) => {
	const problems = await open(page);
	await page.locator("#actions-trigger").click();
	await expect(page.getByRole("menuitem", { name: "Open" })).toBeFocused();
	await page.keyboard.press("ArrowUp");
	await expect(
		page.getByRole("menuitem", { name: "Stop session" }),
	).toBeFocused();
	await page.keyboard.press("ArrowDown");
	await expect(page.getByRole("menuitem", { name: "Open" })).toBeFocused();
	await page.keyboard.press("ArrowDown");
	await expect(page.getByRole("menuitem", { name: "Copy link" })).toBeFocused();
	await page.keyboard.press("End");
	await expect(
		page.getByRole("menuitem", { name: "Stop session" }),
	).toBeFocused();
	await page.keyboard.press("Home");
	await expect(page.getByRole("menuitem", { name: "Open" })).toBeFocused();
	// A letter moves to the next item it starts, and again to the one after.
	await page.keyboard.press("r");
	await expect(page.getByRole("menuitem", { name: "Rename" })).toBeFocused();
	await page.keyboard.press("r");
	await expect(
		page.getByRole("menuitem", { name: "Read the guide" }),
	).toBeFocused();
	// An item that cannot be used is still reached.
	await page.keyboard.press("m");
	await expect(
		page.getByRole("menuitem", { name: "Move", exact: true }),
	).toBeFocused();
	// The items of a group are reached in order.
	await page.keyboard.press("k");
	await expect(
		page.getByRole("menuitem", { name: "Kinra on GitHub" }),
	).toBeFocused();
	// Tab closes the menu and moves on from the trigger.
	await page.keyboard.press("Tab");
	await expect(page.getByRole("menu")).toHaveCount(0);
	await expect(page.locator("#sort-trigger")).toBeFocused();
	await expect(page.locator("#actions-trigger")).toHaveAttribute(
		"aria-expanded",
		"false",
	);
	expect(problems).toEqual([]);
});

test("arrow keys on the trigger open on the first and last item", async ({
	page,
}) => {
	const problems = await open(page);
	const trigger = page.locator("#actions-trigger");
	await trigger.focus();
	await page.keyboard.press("ArrowUp");
	await expect(
		page.getByRole("menuitem", { name: "Stop session" }),
	).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(trigger).toBeFocused();
	await page.keyboard.press("ArrowDown");
	await expect(page.getByRole("menuitem", { name: "Open" })).toBeFocused();
	await page.keyboard.press("Escape");
	await page.keyboard.press("Enter");
	await expect(page.getByRole("menuitem", { name: "Open" })).toBeFocused();
	expect(problems).toEqual([]);
});

test("an item that cannot be used says why and does nothing", async ({
	page,
}) => {
	const problems = await open(page);
	await page.locator("#actions-trigger").click();
	const move = page.getByRole("menuitem", { name: "Move", exact: true });
	await expect(move).toHaveAttribute("aria-disabled", "true");
	await expect(move).toHaveAccessibleName("Move");
	await expect(move).toHaveAccessibleDescription(
		"Only the owner can move a session.",
	);
	await expect(move.locator(".kin-menu__reason")).toBeVisible();
	await move.click({ force: true });
	await expect(page.getByRole("menu")).toBeVisible();
	await expect(page.locator("#menu-state")).toHaveText(/^Nothing chosen/);
	expect(problems).toEqual([]);
});

test("checkbox and radio items say their state and update it", async ({
	page,
}) => {
	const problems = await open(page);
	const state = page.locator("#menu-state");
	await expect(state).toHaveText(
		"Nothing chosen · pinned · newest · sort menu closed",
	);
	await page.locator("#actions-trigger").click();
	const pinned = page.getByRole("menuitemcheckbox", { name: "Pinned" });
	await expect(pinned).toHaveAttribute("aria-checked", "true");
	await expect(pinned.locator(".kin-menu__check svg")).toBeVisible();
	const group = page.getByRole("group", { name: "Elsewhere" });
	await expect(group.getByRole("menuitem")).toHaveCount(3);
	await expect(group.getByRole("menuitem").nth(1)).toHaveAttribute(
		"target",
		"_blank",
	);
	await expect(group.getByRole("menuitem").nth(2)).toHaveAttribute(
		"download",
		"session.svg",
	);
	await pinned.click();
	await expect(page.getByRole("menu")).toHaveCount(0);
	await expect(state).toHaveText(
		"Nothing chosen · not pinned · newest · sort menu closed",
	);
	await page.locator("#actions-trigger").click();
	await expect(
		page.getByRole("menuitemcheckbox", { name: "Pinned" }),
	).toHaveAttribute("aria-checked", "false");
	await page.keyboard.press("Escape");

	// The product's own trigger, with the menu's open state bound. Opening
	// focuses the checked radio.
	const sort = page.locator("#sort-trigger");
	await expect(sort).toHaveAttribute("aria-haspopup", "menu");
	await sort.click();
	await expect(state).toHaveText(/sort menu open$/);
	await expect(sort).toHaveAttribute("aria-expanded", "true");
	await expect(page.getByRole("group", { name: "Sort" })).toBeVisible();
	await expect(
		page.getByRole("menuitemradio", { name: "Newest first" }),
	).toBeFocused();
	await page.keyboard.press("ArrowDown");
	await page.keyboard.press("ArrowDown");
	await expect(
		page.getByRole("menuitemradio", { name: "By name" }),
	).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(sort).toHaveText("By name");
	await expect(state).toHaveText(/name · sort menu closed$/);
	await expect(sort).toBeFocused();
	await sort.click();
	await expect(
		page.getByRole("menuitemradio", { name: "By name" }),
	).toBeFocused();
	await expect(
		page.getByRole("menuitemradio", { name: "By name" }),
	).toHaveAttribute("aria-checked", "true");
	await page.keyboard.press("Escape");

	// Setting the bound `open` opens it at its trigger, from anywhere.
	await page.locator("#sort-from-script").click();
	await expect(state).toHaveText(/sort menu open$/);
	await expect(sort).toHaveAttribute("aria-expanded", "true");
	await expect(
		page.getByRole("menuitemradio", { name: "By name" }),
	).toBeFocused();
	expect(
		Math.abs(
			(
				await box(
					page
						.locator(`#${await sort.getAttribute("aria-controls")}`)
						.locator("xpath=.."),
				)
			).left - (await box(sort)).left,
		),
	).toBeLessThanOrEqual(1);
	await page.keyboard.press("Escape");
	await expect(sort).toBeFocused();
	await expect(state).toHaveText(/sort menu closed$/);
	expect(problems).toEqual([]);
});

test("a done item says it worked, then closes", async ({ page }) => {
	const problems = await open(page);
	const trigger = page.locator("#actions-trigger");
	await trigger.click();
	const copy = page.getByRole("menu").getByRole("menuitem").nth(1);
	await expect(copy).toHaveAccessibleName("Copy link");
	await copy.click();
	await expect(copy).toHaveText("Copied");
	await expect(copy.locator("svg")).toHaveCount(1);
	await expect(
		page
			.locator(`#${await trigger.getAttribute("aria-controls")}`)
			.locator("xpath=..")
			.locator("[aria-live]"),
	).toHaveText("Copied");
	await expect(page.getByRole("menu")).toBeVisible();
	await expect(page.getByRole("menu")).toHaveCount(0, { timeout: 3000 });
	await expect(trigger).toBeFocused();
	await expect(page.locator("#menu-state")).toHaveText(/^Copied the link/);
	// Open again, it reads as before.
	await trigger.click();
	await expect(page.getByRole("menuitem", { name: "Copy link" })).toHaveText(
		"Copy link",
	);
	expect(problems).toEqual([]);
});

test("a done item whose action fails closes at once", async ({ page }) => {
	const problems = await open(page);
	const more = page.getByRole("button", { name: "Actions for notes.md" });
	await more.click();
	const send = page.getByRole("menuitem", { name: "Send to printer" });
	await send.click();
	await expect(page.locator("#menu-state")).toHaveText(
		/^The printer is offline/,
	);
	await expect(page.getByRole("menu")).toHaveCount(0);
	await expect(page.getByText("Sent", { exact: true })).toHaveCount(0);
	await expect(more).toBeFocused();
	expect(problems).toEqual([]);
});

test("a press on the trigger that dismisses the menu does not reopen it", async ({
	page,
}) => {
	const problems = await open(page);
	const trigger = page.locator("#actions-trigger");
	const menu = page.getByRole("menu", { name: "Session actions" });
	await trigger.click();
	await expect(menu).toBeVisible();
	await trigger.click();
	await expect(menu).toBeHidden();
	await expect(trigger).toHaveAttribute("aria-expanded", "false");
	await trigger.click();
	await expect(menu).toBeVisible();
	// A press elsewhere light-dismisses it.
	await page.mouse.click(5, 5);
	await expect(menu).toBeHidden();
	await expect(trigger).toHaveAttribute("aria-expanded", "false");
	expect(problems).toEqual([]);
});

test("closing leaves focus alone when the trigger has gone inert", async ({
	page,
}) => {
	const problems = await open(page);
	const trigger = page.locator("#actions-trigger");
	await trigger.click();
	await trigger.evaluate((element) => (element.inert = true));
	await page.keyboard.press("Escape");
	await expect(page.getByRole("menu")).toHaveCount(0);
	await expect(trigger).not.toBeFocused();
	expect(problems).toEqual([]);
});

test("the menu opens beneath its trigger and keeps inside the window", async ({
	page,
}) => {
	const problems = await open(page);
	const trigger = page.locator("#actions-trigger");
	const popover = page
		.locator(`#${await trigger.getAttribute("aria-controls")}`)
		.locator("xpath=..");
	await standAt(trigger, 120);
	await trigger.click();
	// Beneath it, at its inline start, 6px off.
	await expect
		.poll(async () => (await box(popover)).left - (await box(trigger)).left)
		.toBeCloseTo(0, 0);
	await expect
		.poll(async () => (await box(popover)).top - (await box(trigger)).bottom)
		.toBeCloseTo(6, 0);
	// It follows its trigger as the page scrolls.
	await page.evaluate(() => window.scrollBy({ top: 40, behavior: "instant" }));
	await expect
		.poll(async () => (await box(popover)).top - (await box(trigger)).bottom)
		.toBeCloseTo(6, 0);
	// Too tall for the room beneath and above, it keeps to its trigger and
	// scrolls rather than covering it.
	await page.setViewportSize({ width: 1280, height: 360 });
	await standAt(trigger, 140);
	await expect
		.poll(async () => (await box(popover)).top - (await box(trigger)).bottom)
		.toBeCloseTo(6, 0);
	expect(
		await popover.evaluate(
			(element) => element.scrollHeight > element.clientHeight,
		),
	).toBe(true);
	expect((await box(popover)).bottom).toBeLessThanOrEqual(360 - 12 + 1);
	await page.keyboard.press("Escape");
	await page.setViewportSize({ width: 1280, height: 720 });

	// A trigger in the window's bottom-right corner: the menu flips above it
	// and keeps 12px from the edges.
	await trigger.evaluate((element) => {
		element.style.position = "fixed";
		element.style.right = "4px";
		element.style.bottom = "4px";
	});
	await trigger.click();
	const view = await viewport(page);
	const anchor = await box(trigger);
	const layer = await box(popover);
	expect(layer.right).toBeLessThanOrEqual(view.width - 12 + 1);
	expect(layer.bottom).toBeLessThanOrEqual(anchor.top - 6 + 1);
	expect(layer.left).toBeGreaterThanOrEqual(12 - 1);
	expect(layer.top).toBeGreaterThanOrEqual(12 - 1);
	expect(problems).toEqual([]);
});

test("right to left, the menu lines up with its trigger's right edge", async ({
	page,
}) => {
	const problems = await open(page);
	const trigger = page.locator("#rtl-trigger");
	const popover = page
		.locator(`#${await trigger.getAttribute("aria-controls")}`)
		.locator("xpath=..");
	await trigger.click();
	await expect(page.getByRole("menuitem", { name: "فتح" })).toBeFocused();
	const anchor = await box(trigger);
	const layer = await box(popover);
	expect(Math.abs(layer.right - anchor.right)).toBeLessThanOrEqual(1);
	expect(
		await popover.evaluate((element) => getComputedStyle(element).direction),
	).toBe("rtl");
	expect(problems).toEqual([]);
});

test("a context menu opens at the pointer and stays open", async ({ page }) => {
	const problems = await open(page);
	const row = page.locator("#files .kin-list__main").first();
	await row.evaluate((element) =>
		element.scrollIntoView({ block: "center", behavior: "instant" }),
	);
	const area = await box(row);
	const x = Math.round(area.left + 40);
	const y = Math.round(area.top + 10);
	await page.mouse.click(x, y, { button: "right" });
	const menu = page.getByRole("menu", { name: "File actions" });
	await expect(menu).toBeVisible();
	await expect(page.getByRole("menuitem", { name: "Open" })).toBeFocused();
	const layer = await box(page.locator("#file-menu"));
	expect(Math.abs(layer.left - x)).toBeLessThanOrEqual(1);
	expect(Math.abs(layer.top - y)).toBeLessThanOrEqual(1);
	// The right button's release did not dismiss it.
	await page.waitForTimeout(300);
	await expect(menu).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(menu).toBeHidden();
	await expect(row).toBeFocused();

	// Near the window's right edge it opens toward the pointer's other side.
	await page.setViewportSize({ width: 480, height: 640 });
	await row.evaluate((element) =>
		element.scrollIntoView({ block: "center", behavior: "instant" }),
	);
	const narrow = await box(row);
	const view = await viewport(page);
	const end = Math.round(Math.min(narrow.right, view.width) - 8);
	await page.mouse.click(end, Math.round(narrow.top + 10), { button: "right" });
	await expect(menu).toBeVisible();
	const flipped = await box(page.locator("#file-menu"));
	expect(Math.abs(flipped.right - end)).toBeLessThanOrEqual(1);
	expect(flipped.left).toBeGreaterThanOrEqual(12 - 1);
	expect(problems).toEqual([]);
});

test("a context menu opened from a control keeps its aria-expanded", async ({
	page,
}) => {
	const problems = await open(page);
	const more = page.getByRole("button", { name: "Actions for plan.md" });
	await expect(more).toHaveAttribute("aria-expanded", "false");
	await more.click();
	await expect(more).toHaveAttribute("aria-expanded", "true");
	await expect
		.poll(
			async () =>
				(await box(page.locator("#file-menu"))).top - (await box(more)).bottom,
		)
		.toBeCloseTo(6, 0);
	await page.getByRole("menuitem", { name: "Open" }).click();
	await expect(page.locator("#menu-state")).toHaveText(/^Opened plan\.md/);
	await expect(more).toHaveAttribute("aria-expanded", "false");
	await expect(more).toBeFocused();
	expect(problems).toEqual([]);
});

const chip = (page) => page.locator("body > .kin-tooltip");

test("a tip waits, describes its control and goes when the pointer leaves", async ({
	page,
}) => {
	const problems = await open(page);
	const undo = page.locator("#tip-undo");
	// The control keeps its own name; its tip adds only the hint.
	await expect(undo).toHaveAccessibleName("Undo");
	await expect(undo).toHaveAccessibleDescription("Your last change");
	await expect(page.locator("#tip-publish")).toHaveAccessibleDescription(
		"Publish the draft to the team",
	);
	await undo.hover();
	await page.waitForTimeout(250);
	await expect(chip(page)).toBeHidden();
	await expect(chip(page)).toBeVisible();
	await expect(chip(page)).toHaveText("UndoYour last change");
	await expect(chip(page).locator(".kin-tooltip__hint")).toHaveText(
		"Your last change",
	);
	await expect(chip(page)).toHaveAttribute("role", "tooltip");
	await expect(chip(page)).toHaveAttribute("popover", "manual");
	await expect(chip(page)).toHaveCSS("pointer-events", "none");
	// Above its target, 6px off, centred on it.
	const target = await box(undo);
	const tip = await box(chip(page));
	expect(Math.abs(tip.bottom - (target.top - 6))).toBeLessThanOrEqual(1);
	expect(
		Math.abs((tip.left + tip.right) / 2 - (target.left + target.right) / 2),
	).toBeLessThanOrEqual(1);
	await expect(chip(page)).toHaveAttribute("data-side", "above");
	await page.mouse.move(5, 5);
	await expect(chip(page)).toBeHidden();
	expect(problems).toEqual([]);
});

test("the next tip follows at once, and a press, a scroll and Escape put tips away", async ({
	page,
}) => {
	const problems = await open(page);
	await watchEscape(page);
	const undo = page.locator("#tip-undo");
	const publish = page.locator("#tip-publish");
	await undo.hover();
	await expect(chip(page)).toBeVisible();
	// Moving straight on, the next tip shows without the wait.
	await publish.hover();
	await expect(chip(page)).toHaveText("Publish the draft to the team", {
		timeout: 300,
	});
	await page.mouse.down();
	await expect(chip(page)).toBeHidden();
	await page.mouse.up();
	await page.mouse.move(5, 5);

	await undo.hover();
	await expect(chip(page)).toBeVisible();
	await page.evaluate(() => window.scrollBy(0, 20));
	await expect(chip(page)).toBeHidden();
	await page.mouse.move(5, 5);

	// The keyboard shows a tip too; Escape puts it away without moving focus,
	// and still reaches the page.
	await undo.focus();
	await page.keyboard.press("Shift+Tab");
	await page.keyboard.press("Tab");
	await expect(undo).toBeFocused();
	await expect(chip(page)).toHaveText("UndoYour last change");
	await page.keyboard.press("Escape");
	await expect(chip(page)).toBeHidden();
	await expect(undo).toBeFocused();
	expect(await page.evaluate(() => window.escapes)).toBe(1);
	expect(problems).toEqual([]);
});

test("a told mark takes focus and carries its words", async ({ page }) => {
	const problems = await open(page);
	const held = page.locator("#tip-held");
	await expect(held).toHaveAttribute("tabindex", "0");
	await expect(held).toHaveAccessibleDescription(
		"Held for review. A person decides whether to release.",
	);
	// A plain tip on words takes no focus of its own.
	await expect(page.locator("#tip-time")).not.toHaveAttribute("tabindex", /./);
	await held.focus();
	await page.keyboard.press("Shift+Tab");
	await page.keyboard.press("Tab");
	await expect(held).toBeFocused();
	await expect(chip(page)).toHaveText(
		"Held for reviewA person decides whether to release.",
	);
	expect(problems).toEqual([]);
});

test("a tip on a menu trigger stays away while its menu shows", async ({
	page,
}) => {
	const problems = await open(page);
	const trigger = page.locator("#rtl-trigger");
	await trigger.hover();
	await expect(chip(page)).toHaveText("إجراءات");
	await trigger.click();
	await expect(chip(page)).toBeHidden();
	await page.mouse.move(5, 5);
	await trigger.hover();
	await page.waitForTimeout(700);
	await expect(chip(page)).toBeHidden();
	expect(problems).toEqual([]);
});

test("tips clean up when they are detached", async ({ page }) => {
	const problems = await open(page);
	const undo = page.locator("#tip-undo");
	await undo.focus();
	await page.keyboard.press("Shift+Tab");
	await page.keyboard.press("Tab");
	await expect(chip(page)).toBeVisible();
	// Detach every tip on the page without a press, which would hide it.
	await page.locator("#tips-on").evaluate((input) => input.click());
	await expect(chip(page)).toHaveCount(0);
	await expect(undo).not.toHaveAttribute("aria-describedby", /./);
	await expect(undo).toHaveAccessibleName("Undo");
	await expect(page.locator("#tip-held")).not.toHaveAttribute("tabindex", /./);
	expect(
		await page.evaluate(
			() => document.querySelectorAll("body > div[hidden]").length,
		),
	).toBe(0);
	await undo.hover();
	await page.waitForTimeout(700);
	await expect(chip(page)).toHaveCount(0);
	// Attached again, they work as before.
	await page.locator("#tips-on").evaluate((input) => input.click());
	await page.mouse.move(5, 5);
	await undo.hover();
	await expect(chip(page)).toBeVisible();
	expect(problems).toEqual([]);
});

test("a tip's arrival yields to reduced motion", async ({ page }) => {
	await open(page);
	await page.locator("#tip-undo").hover();
	await expect(chip(page)).toBeVisible();
	expect(
		await chip(page).evaluate(
			(element) => getComputedStyle(element).animationName,
		),
	).toBe("kin-tooltip-arrive");
	await page.mouse.move(5, 5);
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.locator("#tip-undo").hover();
	await expect(chip(page)).toBeVisible();
	expect(
		await chip(page).evaluate(
			(element) => getComputedStyle(element).animationName,
		),
	).toBe("none");
});

test.describe("on a touch screen", () => {
	test.use({ hasTouch: true });

	test("a tap on words toggles their tip; a tap on a control does not", async ({
		page,
	}) => {
		const problems = await open(page);
		const time = page.locator("#tip-time");
		await time.tap();
		await expect(chip(page)).toHaveText("20 November 2026");
		await time.tap();
		await expect(chip(page)).toBeHidden();
		await time.tap();
		await expect(chip(page)).toBeVisible();
		await page.locator("#tip-undo").tap();
		await page.waitForTimeout(700);
		await expect(chip(page)).toBeHidden();
		expect(problems).toEqual([]);
	});
});

// Regression cases from the review of menus and tips.

test("a menu that scrolls brings the focused item into view, and keeps its place as the page scrolls", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1280, height: 360 });
	const problems = await open(page);
	const trigger = page.locator("#actions-trigger");
	const popover = page
		.locator(`#${await trigger.getAttribute("aria-controls")}`)
		.locator("xpath=..");
	await standAt(trigger, 140);
	await trigger.click();
	await page.keyboard.press("End");
	const shown = () =>
		page.evaluate(() => {
			const item = document.activeElement;
			const menu = item?.closest(".kin-popover");
			if (!item || !menu) return false;
			const a = item.getBoundingClientRect();
			const b = menu.getBoundingClientRect();
			return a.top >= b.top - 1 && a.bottom <= b.bottom + 1;
		});
	expect(await shown()).toBe(true);
	const before = await popover.evaluate((element) => element.scrollTop);
	expect(before).toBeGreaterThan(0);
	await page.evaluate(() => window.scrollBy(0, 2));
	await page.waitForTimeout(100);
	expect(await popover.evaluate((element) => element.scrollTop)).toBe(before);
	await page.keyboard.press("Home");
	expect(await shown()).toBe(true);
	expect(problems).toEqual([]);
});

test("a tip whose words change keeps showing, and its control keeps focus", async ({
	page,
}) => {
	const problems = await open(page);
	const copy = page.locator("#tip-copy");
	await copy.focus();
	await page.keyboard.press("Shift+Tab");
	await page.keyboard.press("Tab");
	const chip = page.locator(".kin-tooltip[popover]");
	await expect(chip).toHaveText("Copy the link");
	await page.keyboard.press("Enter");
	await expect(chip).toHaveText("Copied");
	await expect(chip).toBeVisible();
	await expect(copy).toBeFocused();
	await expect(copy).toHaveAccessibleDescription("Copied");
	expect(problems).toEqual([]);
});

test("a tip keeps its description when the product rewrites aria-describedby", async ({
	page,
}) => {
	const problems = await open(page);
	const archive = page.locator("#tip-described");
	await expect(archive).toHaveAccessibleDescription("Archive the session");
	await page.locator("#describe-switch").check();
	await expect(archive).toHaveAttribute(
		"aria-describedby",
		/described-note.*kin-tip-|kin-tip-.*described-note/,
	);
	await page.locator("#describe-switch").uncheck();
	await expect(archive).toHaveAccessibleDescription("Archive the session");
	expect(problems).toEqual([]);
});

test("Escape puts a tip away before it closes the dialog it is in", async ({
	page,
}) => {
	const problems = await open(page);
	await page.locator("#open-tip-dialog").click();
	const dialog = page.locator("#tip-dialog");
	await expect(dialog).toHaveAttribute("open", "");
	await page.keyboard.press("Tab");
	await page.keyboard.press("Shift+Tab");
	const target = page.locator("#tip-in-dialog");
	await target.focus();
	await page.keyboard.press("Tab");
	await page.keyboard.press("Shift+Tab");
	const chip = page.locator(".kin-tooltip[popover]");
	await expect(chip).toHaveText("Explains itself");
	await page.keyboard.press("Escape");
	await expect(chip).toBeHidden();
	await expect(dialog).toHaveAttribute("open", "");
	await expect(target).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(dialog).not.toHaveAttribute("open", /.*/);
	expect(problems).toEqual([]);
});

test("right to left, a shortcut stands at the item's end", async ({ page }) => {
	const problems = await open(page);
	await page.locator("#rtl-trigger").click();
	const item = page.getByRole("menuitem", { name: /فتح/ });
	const [itemBox, shortcutBox] = await Promise.all([
		box(item),
		box(item.locator(".kin-menu__shortcut")),
	]);
	// The item's end is its left edge right to left.
	expect(shortcutBox.left - itemBox.left).toBeLessThan(24);
	await expect(item.locator(".kin-menu__shortcut")).toHaveText("⌘O");
	expect(problems).toEqual([]);
});
