import { test, expect } from "@playwright/test";
import { serve } from "./support.js";

// Each small shape means one thing (principles, "Layers are soft, marks are
// exact"): a still block's tone is a bar set in from its start, never the live
// edge's line round its corners, and a switch takes a control's corners.
const body = `
<div class="kin-notice" id="notice" data-tone="warning"><p class="kin-notice__title">Warning</p><p class="kin-notice__body">The import kept three rows it could not read.</p></div>
<div class="kin-notice" id="compact" data-tone="error" data-density="compact"><p>The connection closed.</p></div>
<div class="kin-card"><div class="kin-card__body"><div class="kin-notice" id="nested" data-tone="success"><p>Saved inside a card.</p></div></div></div>
<div class="kin-notice" id="rtl" dir="rtl" data-tone="primary"><p>ملاحظة</p></div>
<div class="kin-toast" id="toast" data-tone="reason" style="position: static"><p class="kin-toast__title">Saved</p><p class="kin-toast__body">Your draft is kept.</p></div>
<label class="kin-switch"><input id="switch" type="checkbox" role="switch" checked> Keep in sync</label>`;
const page = (scheme = "dark") =>
	`<!doctype html><html lang="en" data-kin-surface="application" data-kin-scheme="${scheme}"><head><link rel="stylesheet" href="/src/styles/index.css"></head><body style="padding: 24px">${body}</body></html>`;

async function bar(page, id) {
	return page.evaluate((id) => {
		const host = document.getElementById(id);
		const own = getComputedStyle(host);
		const mark = getComputedStyle(host, "::before");
		const box = host.getBoundingClientRect();
		const left = parseFloat(mark.left);
		const width = parseFloat(mark.width);
		return {
			width,
			top: parseFloat(mark.top),
			bottom: parseFloat(mark.bottom),
			// Distance from the padding edge at the block's start.
			start: own.direction === "rtl" ? parseFloat(mark.right) : left,
			radius: parseFloat(mark.borderTopLeftRadius),
			mask: mark.maskImage || mark.webkitMaskImage,
			background: mark.backgroundColor,
			signal: own.getPropertyValue("--kin-notice-signal").trim(),
			hostRadius: parseFloat(own.borderTopLeftRadius),
			height: box.height,
		};
	}, id);
}

for (const scheme of ["dark", "light"]) {
	test(`a still notice and toast draw their tone as an inset bar on ${scheme}`, async ({
		page: browser,
	}) => {
		await serve(browser, page(scheme));
		await browser.goto("http://design.test/fixture");
		for (const id of ["notice", "compact", "nested", "rtl", "toast"]) {
			const mark = await bar(browser, id);
			expect.soft(mark.width, id).toBe(3);
			expect.soft(mark.start, id).toBe(4);
			expect.soft(mark.top, id).toBe(8);
			expect.soft(mark.bottom, id).toBe(8);
			// Round ends, and no mask cutting a line round the corners.
			expect.soft(mark.radius, id).toBeGreaterThanOrEqual(1.5);
			expect.soft(mark.mask, id).toBe("none");
			// The bar stands clear of the corner it sits beside.
			expect.soft(mark.top, id).toBeGreaterThanOrEqual(0);
			expect.soft(mark.height - mark.top - mark.bottom, id).toBeGreaterThan(8);
		}
		// The tone still names the state.
		const warning = await bar(browser, "notice");
		const toned = await browser.evaluate(() => {
			const probe = document.createElement("span");
			probe.style.color = "var(--kin-color-warning)";
			document.getElementById("notice").append(probe);
			const colour = getComputedStyle(probe).color;
			probe.remove();
			return colour;
		});
		expect(warning.background).toBe(toned);
		// A notice in a card still steps its own radius down.
		expect((await bar(browser, "nested")).hostRadius).toBeLessThan(
			(await bar(browser, "notice")).hostRadius,
		);
	});
}

test("forced colours keep the tone bar in Highlight", async ({
	page: browser,
}) => {
	await browser.emulateMedia({ forcedColors: "active" });
	await serve(browser, page());
	await browser.goto("http://design.test/fixture");
	const highlight = await browser.evaluate(() => {
		const probe = document.createElement("span");
		probe.style.color = "Highlight";
		document.body.append(probe);
		return getComputedStyle(probe).color;
	});
	for (const id of ["notice", "toast"]) {
		const mark = await bar(browser, id);
		expect.soft(mark.background, id).toBe(highlight);
		expect.soft(mark.width, id).toBe(3);
	}
});

test("a switch takes a control's corners and its thumb nests inside them", async ({
	page: browser,
}) => {
	await serve(browser, page());
	await browser.goto("http://design.test/fixture");
	const shape = await browser.evaluate(() => {
		const input = document.getElementById("switch");
		const track = getComputedStyle(input);
		const thumb = getComputedStyle(input, "::before");
		const control = document.createElement("span");
		control.style.borderRadius = "var(--kin-control-radius)";
		document.body.append(control);
		const radius = parseFloat(getComputedStyle(control).borderTopLeftRadius);
		control.remove();
		return {
			control: radius,
			track: parseFloat(track.borderTopLeftRadius),
			thumb: parseFloat(thumb.borderTopLeftRadius),
			// The thumb's offset from the track's outer edge.
			inset: parseFloat(thumb.top) + parseFloat(track.borderTopWidth),
		};
	});
	expect(shape.track).toBe(shape.control);
	expect(shape.track).toBe(6);
	expect(shape.thumb).toBe(shape.track - shape.inset);
});
