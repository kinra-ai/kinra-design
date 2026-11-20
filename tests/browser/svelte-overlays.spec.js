import { test, expect } from "@playwright/test";
import { serve } from "./support.js";

// Page anatomy, rows, dialogs, confirmations and toasts from the Svelte
// layer, read in the whole-application demo.
async function open(page) {
	const problems = [];
	page.on("console", (message) => {
		if (["error", "warning"].includes(message.type())) {
			problems.push(message.text());
		}
	});
	page.on("pageerror", (error) => problems.push(error.message));
	await page.setViewportSize({ width: 1280, height: 900 });
	await serve(page, "");
	await page.goto("http://design.test/svelte/shell/");
	await page.waitForFunction(() =>
		[...document.querySelectorAll("astro-island")].every(
			(island) => !island.hasAttribute("ssr"),
		),
	);
	return problems;
}

test("a page head and its sections keep the catalog's parts and outline", async ({
	page,
}) => {
	const problems = await open(page);
	const head = page.locator(".kin-page-head");
	expect(
		await head.evaluate((element) =>
			[...element.children].map((child) => [child.tagName, child.className]),
		),
	).toEqual([
		["H1", "kin-page-head__title"],
		["P", "kin-page-head__summary"],
		["DIV", "kin-page-head__actions"],
		["P", "kin-page-head__description"],
	]);
	const entries = page.getByRole("region", { name: "Entries" });
	await expect(entries).toHaveClass("kin-section");
	await expect(entries.locator("h2.kin-section-head__title")).toHaveText(
		"Entries",
	);
	// The section's actions are compact; the page head's are not.
	const heights = await page.evaluate(() => [
		document.querySelector("#new-entry")?.getBoundingClientRect().height,
		document.querySelector("#inspect")?.getBoundingClientRect().height,
	]);
	expect(heights[0]).toBeGreaterThan(heights[1] ?? 0);
	// The page head stands a step further from its work than a section head.
	const gaps = await page.evaluate(() => {
		const pageHead = document.querySelector(".kin-page-head");
		const section = document.querySelector(".kin-section");
		const sectionHead = section?.querySelector(".kin-section-head");
		const after = sectionHead?.nextElementSibling;
		return [
			(section?.getBoundingClientRect().top ?? 0) -
				(pageHead?.getBoundingClientRect().bottom ?? 0),
			(after?.getBoundingClientRect().top ?? 0) -
				(sectionHead?.getBoundingClientRect().bottom ?? 0),
		];
	});
	expect(gaps).toEqual([20, 16]);
	expect(problems).toEqual([]);
});

test("a row's main control and trail are siblings, and either lights the row", async ({
	page,
}) => {
	const problems = await open(page);
	const row = page.locator('[data-entry="1"]');
	const main = row.locator("> .kin-list__main");
	await expect(main).toHaveJSProperty("tagName", "BUTTON");
	await expect(main).toHaveAttribute("type", "button");
	await expect(row.locator(".kin-list__main button")).toHaveCount(0);
	const paint = () =>
		row.evaluate((element) => getComputedStyle(element).backgroundColor);
	// A colour that has stopped moving: two reads a frame apart agree.
	const settled = async () => {
		let last = "";
		await expect
			.poll(async () => {
				const now = await paint();
				const same = now === last;
				last = now;
				return same;
			})
			.toBe(true);
		return last;
	};
	const rest = await settled();
	await row.locator(".kin-list__trail button").hover();
	const lit = await settled();
	expect(lit).not.toBe(rest);
	await main.hover();
	expect(await settled()).toBe(lit);
	await main.click();
	await expect(main).toHaveAttribute("aria-current", "true");
	await expect(row.locator(".kin-list__after .kin-caption")).toBeVisible();
	// A row in a tone draws the still bar at its start.
	const bar = await page.locator('[data-entry="2"]').evaluate((element) => {
		const mark = getComputedStyle(element, "::before");
		return [mark.width, mark.left, mark.top];
	});
	expect(bar).toEqual(["3px", "4px", "8px"]);
	expect(problems).toEqual([]);
});

test("a dialog focuses its first field, submits as a form and gives focus back", async ({
	page,
}) => {
	const problems = await open(page);
	await page.locator("#new-entry").click();
	const dialog = page.locator("#create-dialog");
	await expect(dialog).toHaveAttribute("open", "");
	await expect(dialog).toHaveAccessibleName("New entry");
	await expect(dialog).toHaveAccessibleDescription(
		"It joins the library at once.",
	);
	await expect(page.locator("#entry-name")).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(dialog).not.toHaveAttribute("open", /.*/);
	await expect(page.locator("#new-entry")).toBeFocused();

	await page.locator("#new-entry").click();
	await page.locator("#entry-name").fill("Harbour charts");
	await page.keyboard.press("Enter");
	// While it saves, the dialog says so and its fields wait.
	await page.waitForFunction(() => {
		const element = document.querySelector("#create-dialog");
		return (
			element?.getAttribute("aria-busy") === "true" &&
			element.querySelector("fieldset")?.disabled === true
		);
	});
	await expect(dialog).not.toHaveAttribute("open", /.*/);
	await expect(page.locator("#new-entry")).toBeFocused();
	await expect(page.locator("#entries")).toContainText("Harbour charts");
	const toast = page.locator(".kin-toast").filter({ hasText: "Entry added" });
	await expect(toast).toHaveAttribute("role", "status");
	expect(problems).toEqual([]);
});

test("a confirmation starts on the way back and answers no to Escape", async ({
	page,
}) => {
	const problems = await open(page);
	const trigger = page.getByRole("button", { name: "Delete Tide tables" });
	await trigger.click();
	const dialog = page.getByRole("dialog", { name: "Delete Tide tables?" });
	await expect(dialog).toBeVisible();
	await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
	await expect(
		dialog.getByRole("button", { name: "Delete entry" }),
	).toHaveClass(/kin-button--danger/);
	await page.keyboard.press("Escape");
	await expect(dialog).toHaveCount(0);
	await expect(trigger).toBeFocused();
	await expect(page.locator('[data-entry="1"]')).toHaveCount(1);

	await trigger.click();
	await page.getByRole("button", { name: "Delete entry" }).click();
	await expect(page.locator('[data-entry="1"]')).toHaveCount(0);
	await expect(
		page.locator(".kin-toast").filter({ hasText: "Entry deleted" }),
	).toBeVisible();
	expect(problems).toEqual([]);
});

test("a drawer closes from its backdrop", async ({ page }) => {
	const problems = await open(page);
	await page.locator("#inspect").click();
	const drawer = page.locator("#inspector");
	await expect(drawer).toHaveClass("kin-drawer");
	await expect(drawer).toHaveAttribute("open", "");
	await expect(drawer).toContainText("wide, unfolded");
	await page.mouse.click(40, 450);
	await expect(drawer).not.toHaveAttribute("open", /.*/);
	await expect(page.locator("#inspect")).toBeFocused();
	expect(problems).toEqual([]);
});

test("a toast waits while it is pointed at, then leaves", async ({ page }) => {
	await page.clock.install();
	const problems = await open(page);
	await page.getByRole("button", { name: "Delete Tide tables" }).click();
	await page.getByRole("button", { name: "Delete entry" }).click();
	const toast = page.locator(".kin-toast").filter({ hasText: "Entry deleted" });
	await expect(toast).toBeVisible();
	await toast.hover();
	await page.clock.runFor(8000);
	await expect(toast).toBeVisible();
	await page.mouse.move(600, 400);
	await page.clock.runFor(6000);
	await expect(toast).toHaveCount(0);
	expect(problems).toEqual([]);
});

test("a toast's dismiss button removes it", async ({ page }) => {
	const problems = await open(page);
	await page.getByRole("button", { name: "Delete Tide tables" }).click();
	await page.getByRole("button", { name: "Delete entry" }).click();
	const toast = page.locator(".kin-toast").filter({ hasText: "Entry deleted" });
	await toast.getByRole("button", { name: "Dismiss" }).click();
	await expect(toast).toHaveCount(0);
	expect(problems).toEqual([]);
});
