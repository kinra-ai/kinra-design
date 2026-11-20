import { test, expect } from "@playwright/test";
import { serve } from "./support.js";

// Regression cases from the Svelte layer's review (/svelte/cases/).
async function open(page, { clock = false } = {}) {
	const problems = [];
	page.on("console", (message) => {
		if (["error", "warning"].includes(message.type())) {
			problems.push(message.text());
		}
	});
	page.on("pageerror", (error) => problems.push(error.message));
	if (clock) await page.clock.install();
	await serve(page, "");
	await page.goto("http://design.test/svelte/cases/");
	await page.waitForFunction(() =>
		[...document.querySelectorAll("astro-island")].every(
			(island) => !island.hasAttribute("ssr"),
		),
	);
	return problems;
}

const focusedId = (page) => page.evaluate(() => document.activeElement?.id);

test("a guarded dialog asks at every Escape and closes only when allowed", async ({
	page,
}) => {
	const problems = await open(page);
	await page.locator("#open-guarded").click();
	const dialog = page.locator("#guarded");
	await expect(dialog).toHaveAttribute("open", "");
	for (const count of [1, 2, 3]) {
		await page.keyboard.press("Escape");
		await expect(page.locator("#guard-asked")).toHaveText(
			`Asked ${count} times`,
		);
		await expect(dialog).toHaveAttribute("open", "");
	}
	await page.locator("#may-close").check();
	await page.keyboard.press("Escape");
	await expect(dialog).not.toHaveAttribute("open", /.*/);
	await expect(page.locator("#open-guarded")).toBeFocused();
	expect(problems).toEqual([]);
});

test("a busy form keeps focus, refuses a second submit and gives focus back", async ({
	page,
}) => {
	const problems = await open(page, { clock: true });
	await page.locator("#open-busy").click();
	const note = page.getByLabel("Note", { exact: true });
	await expect(note).toBeFocused();
	await note.fill("Tide at six");
	await page.keyboard.press("Enter");
	const dialog = page.locator("#busy");
	await expect(dialog).toHaveAttribute("aria-busy", "true");
	// The title holds focus while the fields wait.
	expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("H2");
	// Pressing Escape while busy closes nothing, however often.
	await page.keyboard.press("Escape");
	await page.keyboard.press("Escape");
	await expect(dialog).toHaveAttribute("open", "");
	await page.locator("#busy-submit").evaluate((button) => button.click());
	await page.locator("#busy-submit").evaluate((button) => button.click());
	await page.clock.runFor(400);
	await expect(page.locator("#busy-saves")).toHaveText("Saved 1 times");
	await expect(dialog).not.toHaveAttribute("aria-busy", /.*/);
	await expect(note).toBeFocused();
	expect(problems).toEqual([]);
});

test("a dialog removed while open gives focus back and says it closed", async ({
	page,
}) => {
	const problems = await open(page);
	await page.locator("#open-removable").click();
	await page.locator("#remove-dialog").click();
	await expect(page.locator("#removable")).toHaveCount(0);
	await expect(page.locator("#removed-says")).toHaveText("Closed");
	expect(await focusedId(page)).toBe("open-removable");
	expect(problems).toEqual([]);
});

test("a confirmation replaced while the reader is on its action starts on the way back", async ({
	page,
}) => {
	const problems = await open(page, { clock: true });
	await page.locator("#confirm-twice").click();
	const first = page.getByRole("alertdialog", { name: "Delete the draft?" });
	await expect(first).toBeVisible();
	await page.getByRole("button", { name: "Delete draft" }).focus();
	await page.clock.runFor(500);
	const second = page.getByRole("alertdialog", {
		name: "Delete the whole library?",
	});
	await expect(second).toBeVisible();
	await expect(second).toHaveAccessibleDescription(
		"Every entry goes, and its history with it.",
	);
	await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(page.locator("#answers")).toHaveText(
		"draft false, library false",
	);
	await expect(second).toHaveCount(0);
	expect(await focusedId(page)).toBe("confirm-twice");
	expect(problems).toEqual([]);
});

test("the toast region is a polite live region before any toast arrives", async ({
	page,
}) => {
	await open(page);
	const region = page.getByRole("region", { name: "Notifications" });
	await expect(region).toHaveAttribute("aria-live", "polite");
	await expect(region.locator(".kin-toast")).toHaveCount(0);
});

test("focus holds a toast though the pointer comes and goes", async ({
	page,
}) => {
	const problems = await open(page, { clock: true });
	await page.locator("#raise-one").click();
	const toast = page.locator(".kin-toast").filter({ hasText: "Only" });
	await toast.getByRole("button", { name: "Dismiss" }).focus();
	await toast.hover();
	await page.mouse.move(10, 10);
	await page.clock.runFor(9000);
	await expect(toast).toBeVisible();
	expect(problems).toEqual([]);
});

test("a toast dismissed from the keyboard hands focus on", async ({ page }) => {
	const problems = await open(page);
	await page.locator("#raise-two").focus();
	await page.keyboard.press("Enter");
	const first = page.locator(".kin-toast").filter({ hasText: "First" });
	const second = page.locator(".kin-toast").filter({ hasText: "Second" });
	await first.getByRole("button", { name: "Dismiss" }).focus();
	await page.keyboard.press("Enter");
	await expect(second.getByRole("button", { name: "Dismiss" })).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(page.locator("#raise-two")).toBeFocused();
	await expect(page.locator(".kin-toast")).toHaveCount(0);
	expect(problems).toEqual([]);
});

test("a row that only reads lays its title over its caption", async ({
	page,
}) => {
	await page.setViewportSize({ width: 420, height: 900 });
	const problems = await open(page);
	const row = page.locator("#reading-row");
	const boxes = await row.evaluate((element) => {
		const box = (selector) =>
			element.querySelector(selector)?.getBoundingClientRect();
		const title = element.querySelector(".kin-list__title");
		return {
			title: box(".kin-list__title"),
			caption: box(".kin-list__meta"),
			after: box(".kin-list__after"),
			body: box(".kin-list__body"),
			ellipsis: title
				? title.scrollWidth > title.clientWidth && title.clientWidth > 0
				: false,
		};
	});
	expect(boxes.caption.top).toBeGreaterThanOrEqual(boxes.title.bottom - 1);
	expect(boxes.after.top).toBeGreaterThanOrEqual(boxes.body.bottom - 1);
	expect(boxes.ellipsis).toBe(true);
	expect(problems).toEqual([]);
});

test("a loading shape says what it waits for through a status that stays", async ({
	page,
}) => {
	const problems = await open(page);
	const status = page.locator(".kin-sr-only[role=status]");
	await expect(status).toHaveAttribute("role", "status");
	await expect(status).toHaveText("Reading the library");
	await page.locator("#loading-switch").uncheck();
	await expect(page.locator("#loading")).toHaveCount(0);
	await expect(status).toHaveText("");
	expect(problems).toEqual([]);
});
