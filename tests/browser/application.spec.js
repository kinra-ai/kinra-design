import { test, expect } from "@playwright/test";
import { serve } from "./support.js";

const sample = `<p id="plain">Ordinary application text</p><h1 class="kin-title">Title</h1><h2 class="kin-headline">Section</h2><button class="kin-button">Continue</button><input class="kin-input" aria-label="Name"><figure class="kin-code"><pre><code>a !== b</code></pre></figure><p class="kin-body">Reading text</p><section data-kin-voice="serif"><h2 class="kin-headline">Editorial aside</h2><button class="kin-button">Still application UI</button></section>`;
function fixture(where, overrides = "", recipe = "application") {
	const attribute = `data-kin-surface="${recipe}"`;
	return `<!doctype html><html lang="en" ${where === "html" ? attribute : ""}><head><link rel="stylesheet" href="/src/styles/index.css"><style>${overrides}</style></head><body ${where === "body" ? attribute : ""}>${where === "section" ? `<section ${attribute}>${sample}</section>` : sample}</body></html>`;
}
async function font(locator, family) {
	await expect(locator).toHaveCSS(
		"font-family",
		new RegExp(`^"?Kinra ${family}`),
	);
}
for (const where of ["html", "body", "section"]) {
	test(`application selects sans on ${where}, retaining code and regional voice`, async ({
		page,
	}) => {
		await serve(page, fixture(where));
		await page.goto("http://design.test/fixture");
		for (const selector of [
			"#plain",
			".kin-title",
			".kin-headline:first-of-type",
			".kin-button",
			".kin-input",
		]) {
			await font(page.locator(selector).first(), "Sans");
		}
		await font(page.locator(".kin-code code"), "Mono");
		await font(page.locator(".kin-body"), "Sans");
		await font(page.locator('[data-kin-voice="serif"] .kin-headline'), "Serif");
		await font(page.locator('[data-kin-voice="serif"] .kin-button'), "Sans");
		await expect(page.locator(".kin-title")).toHaveCSS("font-weight", "620");
		await expect(page.locator("body")).toHaveCSS("font-size", "16px");
	});
	test(`explicit mono application override on ${where}`, async ({ page }) => {
		await serve(
			page,
			fixture(
				where,
				`[data-kin-surface="application"] { --kin-font-ui: var(--kin-font-mono); --kin-font-heading: var(--kin-font-mono); --kin-font-display: var(--kin-font-mono); }`,
			),
		);
		await page.goto("http://design.test/fixture");
		await font(page.locator("#plain"), "Mono");
		await font(page.locator(".kin-title"), "Mono");
		await font(page.locator(".kin-button").first(), "Mono");
		await font(page.locator(".kin-body"), "Sans");
	});
}
test("heading-only voice does not replace application UI", async ({ page }) => {
	await serve(
		page,
		fixture("body").replace(
			'<body data-kin-surface="application">',
			'<body data-kin-surface="application" data-kin-voice="mono">',
		),
	);
	await page.goto("http://design.test/fixture");
	await font(page.locator(".kin-title"), "Mono");
	await font(page.locator("#plain"), "Sans");
	await font(page.locator(".kin-button").first(), "Sans");
});

for (const recipe of ["editorial", "documentation", "learning", "operations"]) {
	test(`${recipe} document keeps its existing voice`, async ({ page }) => {
		await serve(page, fixture("body", "", recipe));
		await page.goto("http://design.test/fixture");
		await font(page.locator("#plain"), "Mono");
		await font(
			page.locator(".kin-title"),
			recipe === "editorial" ? "Serif" : "Mono",
		);
		await font(
			page.locator(".kin-body"),
			recipe === "learning" ? "Mono" : "Sans",
		);
	});
}

for (const width of [1440, 390]) {
	for (const scheme of ["dark", "light"]) {
		test(`application examples at ${width}px in ${scheme}`, async ({
			page,
		}, testInfo) => {
			await serve(page);
			await page.setViewportSize({ width, height: 1000 });
			await page.goto("http://design.test/applications/");
			await page.evaluate(
				(value) => (document.documentElement.dataset.kinScheme = value),
				scheme,
			);
			await font(page.locator("#collection-title"), "Sans");
			await font(page.locator("#work-title"), "Sans");
			await font(page.locator("#application-details code"), "Mono");
			await page.evaluate(() => document.fonts.ready);
			await expect(page.locator(".application-example")).toHaveCount(2);
			const fits = () =>
				page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
			expect(await fits()).toBe(true);
			await page.screenshot({
				path: testInfo.outputPath("applications.png"),
				fullPage: true,
			});
			await page.locator("#library-query").fill("no matching entry");
			await expect(page.locator("#library-empty")).toBeVisible();
			await page
				.getByRole("button", { name: "Clear filters", exact: true })
				.click();
			await expect(page.locator("#library-query")).toBeFocused();
			const inspect = page.getByRole("button", {
				name: "Inspect Reading foundations",
				exact: true,
			});
			await inspect.focus();
			await page.keyboard.press("Enter");
			await expect(page.getByRole("dialog")).toBeVisible();
			await font(
				page.getByRole("dialog").locator(".kin-dialog__title"),
				"Sans",
			);
			await expect(
				page.getByRole("dialog").getByRole("button", { name: "Done" }),
			).toBeFocused();
			await page.keyboard.press("Escape");
			await expect(inspect).toBeFocused();
			await expect(inspect).toHaveCSS("outline-style", "solid");
			for (const state of ["loading", "empty", "error"]) {
				await page.locator("#application-state").selectOption(state);
				await expect(
					page.locator(`[data-sample-state="${state}"]`),
				).toBeVisible();
			}
			await page.getByRole("button", { name: "Try again" }).click();
			await expect(page.locator('[data-sample-state="ready"]')).toBeVisible();
			await expect(page.locator("#application-state")).toBeFocused();
			// Narrow work regions, long labels, RTL and enlarged text must not
			// require the Space shell's geometry to keep their content reachable.
			await page.evaluate(() => {
				document.documentElement.dir = "rtl";
				document.documentElement.style.fontSize = "24px";
				document.querySelector("#work-title").textContent =
					"Review a deliberately long application title with additional context";
			});
			expect(await fits()).toBe(true);
		});
	}
}

test("reduced motion and forced colours preserve example state and focus", async ({
	page,
}) => {
	await serve(page);
	await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
	await page.goto("http://design.test/applications/");
	await page.locator("#application-state").selectOption("loading");
	await expect(page.locator('[data-sample-state="loading"]')).toBeVisible();
	const duration = await page
		.locator('[data-sample-state="loading"] .kin-skeleton')
		.first()
		.evaluate((element) =>
			parseFloat(getComputedStyle(element).animationDuration),
		);
	expect(duration).toBeLessThanOrEqual(0.00001);
	await page.locator("#application-state").focus();
	await expect(page.locator("#application-state")).toHaveCSS(
		"outline-style",
		"solid",
	);
	if (
		await page.evaluate(() => matchMedia("(forced-colors: active)").matches)
	) {
		await expect(page.locator(".application-example").first()).toHaveCSS(
			"outline-style",
			"solid",
		);
	}
});

for (const dir of ["ltr", "rtl"]) {
	test(`drawers and a dialog's close keep to the line ${dir === "rtl" ? "right to left" : "left to right"}`, async ({
		page,
	}) => {
		await serve(
			page,
			`<!doctype html><html lang="en" dir="${dir}"><head><link rel="stylesheet" href="/src/styles/index.css"></head><body><dialog class="kin-drawer" id="end" aria-label="End"><p>End</p></dialog><dialog class="kin-drawer" data-side="start" id="start" aria-label="Start"><p>Start</p></dialog><dialog class="kin-dialog" id="dialog" aria-label="Dialog"><header class="kin-dialog__header"><h2 class="kin-dialog__title">Title</h2><button class="kin-button kin-dialog__close" type="button" aria-label="Close">×</button></header></dialog></body></html>`,
		);
		await page.setViewportSize({ width: 1024, height: 768 });
		await page.emulateMedia({ reducedMotion: "no-preference" });
		await page.goto("http://design.test/fixture");
		const placed = await page.evaluate(() => {
			const placed = {};
			for (const id of ["end", "start"]) {
				const drawer = document.getElementById(id);
				drawer.showModal();
				// Where it arrives from: its first frame, held.
				const [arrival] = drawer.getAnimations();
				arrival.pause();
				arrival.currentTime = 0;
				const from = parseFloat(getComputedStyle(drawer).translate);
				arrival.finish();
				const box = drawer.getBoundingClientRect();
				const style = getComputedStyle(drawer);
				placed[id] = {
					edge:
						box.left === 0 ? "left" : box.right === innerWidth ? "right" : "",
					rounded: parseFloat(style.borderTopLeftRadius) > 0 ? "left" : "right",
					from: Math.sign(from) < 0 ? "left" : "right",
				};
				drawer.close();
			}
			const dialog = document.getElementById("dialog");
			dialog.showModal();
			const close = getComputedStyle(
				dialog.querySelector(".kin-dialog__close"),
			);
			placed.close = parseFloat(close.marginLeft) < 0 ? "left" : "right";
			return placed;
		});
		// The drawer stands at the line's end and a start drawer at its start;
		// each arrives from its own edge and rounds the corners facing the page.
		// The close reaches into the header's end corner.
		const [start, end] = dir === "ltr" ? ["left", "right"] : ["right", "left"];
		expect(placed).toEqual({
			end: { edge: end, rounded: start, from: end },
			start: { edge: start, rounded: end, from: start },
			close: end,
		});
	});
}

test("reduced motion lands a change in the frame that makes it", async ({
	page,
}) => {
	// A panel shown by its own visibility, one shown through an inherited one,
	// and a fade: none may hold its old value for a frame, or focus sent into a
	// panel just opened finds it still hidden.
	await serve(
		page,
		`<!doctype html><html lang="en"><head><link rel="stylesheet" href="/src/styles/index.css"></head><body><div id="eased" style="visibility: hidden; transition: visibility 200ms"><button id="act">Act</button></div><div id="inherited" style="visibility: hidden"><nav><ul><li><a id="link" href="#one">One</a></li></ul></nav></div><p id="fade" style="opacity: 0; transition: opacity 200ms">Faded</p></body></html>`,
	);
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("http://design.test/fixture");
	const landed = await page.evaluate(() => {
		const focus = (panel, target) => {
			document.getElementById(panel).style.visibility = "visible";
			document.getElementById(target).focus();
			return document.activeElement?.id;
		};
		const fade = document.getElementById("fade");
		fade.style.opacity = "1";
		return {
			eased: focus("eased", "act"),
			inherited: focus("inherited", "link"),
			opacity: getComputedStyle(fade).opacity,
		};
	});
	expect(landed).toEqual({ eased: "act", inherited: "link", opacity: "1" });
});

test("coarse pointer keeps application control targets", async ({
	browser,
}) => {
	const context = await browser.newContext({
		hasTouch: true,
		viewport: { width: 390, height: 844 },
		serviceWorkers: "block",
	});
	const page = await context.newPage();
	await serve(page, fixture("body"));
	await page.goto("http://design.test/fixture");
	expect(
		await page.evaluate(() => matchMedia("(pointer: coarse)").matches),
	).toBe(true);
	await expect(page.locator(".kin-button").first()).toHaveCSS(
		"min-height",
		"44px",
	);
	await expect(page.locator(".kin-input")).toHaveCSS("font-size", "16px");
	// A toolbar's fields stand at its buttons' height, so a filter row is level.
	await page.evaluate(() =>
		document.body.insertAdjacentHTML(
			"beforeend",
			'<div class="kin-toolbar" id="filters"><button class="kin-button">Filter</button><select class="kin-select" aria-label="Owner"><option>All</option></select><input class="kin-input" aria-label="Find"></div>',
		),
	);
	const heights = await page
		.locator("#filters > *")
		.evaluateAll((nodes) =>
			nodes.map((node) => node.getBoundingClientRect().height),
		);
	expect(heights).toEqual([44, 44, 44]);
	await context.close();
});
