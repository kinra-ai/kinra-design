import { test, expect } from "@playwright/test";
import { serve } from "./support.js";

// The Svelte layer renders the catalog's markup on the server and hydrates it
// (docs/svelte.md). These cases read the built catalog page.
async function open(page) {
	const problems = [];
	page.on("console", (message) => {
		if (["error", "warning"].includes(message.type())) {
			problems.push(message.text());
		}
	});
	page.on("pageerror", (error) => problems.push(error.message));
	await serve(page, "");
	await page.goto("http://design.test/svelte/controls/");
	await page.waitForFunction(() =>
		[...document.querySelectorAll("astro-island")].every(
			(island) => !island.hasAttribute("ssr"),
		),
	);
	return problems;
}

test("buttons never submit by accident and keep their names", async ({
	page,
}) => {
	const problems = await open(page);
	await expect(page.locator("#press")).toHaveAttribute("type", "button");
	await expect(page.locator("#inside-form")).toHaveAttribute("type", "button");
	await page.click("#press");
	await expect(page.locator("#press")).toHaveText("Pressed 1");
	const link = page.locator("#button-link");
	await expect(link).toHaveJSProperty("tagName", "A");
	await expect(link).toHaveClass("kin-button");
	const icon = page.locator("#icon-button");
	await expect(icon).toHaveAttribute("aria-label", "Close");
	await expect(icon).toHaveClass(
		"kin-button kin-button--icon kin-button--ghost",
	);
	expect(problems).toEqual([]);
});

test("chips toggle and remove", async ({ page }) => {
	const problems = await open(page);
	const chip = page.locator("#chip-open");
	await expect(chip).toHaveAttribute("aria-pressed", "true");
	await chip.click();
	await expect(chip).toHaveAttribute("aria-pressed", "false");
	const remove = page.getByRole("button", { name: "Remove author filter" });
	await expect(remove).toHaveClass("kin-chip__remove");
	await remove.click();
	await expect(page.locator(".kin-chip", { hasText: "author:" })).toHaveCount(
		0,
	);
	expect(problems).toEqual([]);
});

test("a field names its control and wires its hint and error", async ({
	page,
}) => {
	const problems = await open(page);
	const input = page.getByLabel("Repository name");
	const id = await input.getAttribute("id");
	expect(id).toBeTruthy();
	await expect(input).toHaveAttribute("required", "");
	await expect(input).toHaveAttribute("aria-describedby", `${id}-hint`);
	await expect(input).not.toHaveAttribute("aria-invalid", /./);
	await expect(page.locator(`#${id}-hint`)).toHaveText(
		"Use a short, durable project name.",
	);
	await expect(page.locator("#field-name .kin-field__required")).toHaveText(
		"Required",
	);
	await input.fill("Bad Name");
	await expect(input).toHaveAttribute("aria-invalid", "true");
	await expect(input).toHaveAttribute(
		"aria-describedby",
		`${id}-hint ${id}-error`,
	);
	await expect(input).toHaveAccessibleDescription(
		"Use a short, durable project name. Use lowercase letters, figures and hyphens.",
	);
	await input.fill("good-name");
	await expect(input).not.toHaveAttribute("aria-invalid", /./);
	await expect(page.getByLabel("Branch")).not.toHaveAttribute("required", "");
	await expect(page.getByLabel("Visibility")).toHaveClass("kin-select");
	await expect(page.getByLabel("Notes")).toHaveAccessibleDescription(
		"What should a reviewer know?",
	);
	// A control the field cannot reach takes its attributes from the snippet.
	await expect(page.getByLabel("Custom control")).toHaveAttribute(
		"id",
		"custom-control",
	);
	expect(problems).toEqual([]);
});

test("choices bind and keep native semantics", async ({ page }) => {
	const problems = await open(page);
	const state = page.locator("#field-state");
	await expect(state).toHaveText("README · normal · no sync · comfortable");
	await page.getByLabel("Create the repository with a README").uncheck();
	await page.getByLabel("Fast").check();
	const sync = page.getByRole("switch", { name: "Keep in sync" });
	await sync.check();
	const group = page.getByRole("radiogroup", { name: "Density" });
	await expect(group).toHaveClass("kin-segmented");
	await group.getByLabel("Comfortable").focus();
	await page.keyboard.press("ArrowRight");
	await expect(state).toHaveText("No README · fast · sync · compact");
	await expect(group.getByLabel("Compact")).toBeChecked();
	expect(problems).toEqual([]);
});

test("messages render their parts and the disclosure binds", async ({
	page,
}) => {
	const problems = await open(page);
	const notice = page.locator("#notice");
	await expect(notice).toHaveAttribute("data-tone", "reason");
	expect(
		await notice.evaluate((element) =>
			[...element.children].map((child) => child.className),
		),
	).toEqual(["kin-notice__title", "kin-notice__body", "kin-notice__actions"]);
	await expect(page.locator("#empty-full > .kin-empty__title")).toHaveText(
		"No release candidates",
	);
	await expect(page.locator("#empty-compact > *")).toHaveCount(0);
	const state = page.locator("#disclosure-state");
	await expect(state).toHaveText("Advanced is closed");
	await page.locator("#disclosure > summary").click();
	await expect(state).toHaveText("Advanced is open");
	expect(problems).toEqual([]);
});

test("a notice's paragraphs keep one rhythm inside its body", async ({
	page,
}) => {
	await open(page);
	const margins = await page
		.locator(".kin-notice[data-density] .kin-notice__body > p")
		.evaluateAll((paragraphs) =>
			paragraphs.map((p) => {
				const style = getComputedStyle(p);
				return [style.marginTop, style.marginBottom];
			}),
		);
	expect(margins[0][0]).toBe("0px");
	expect(margins.at(-1)[1]).toBe("0px");
});
