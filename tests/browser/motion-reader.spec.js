import { test, expect } from "@playwright/test";
import { serve } from "./support.js";

// @kinra/web/motion in a page: every term is read from the element it moves,
// so its register holds, and with less motion every term but a loop's period
// reads 0ms. The module is served from source, as a consumer bundles it.
const fixture = (stylesheet) => `<!doctype html><html lang="en"><head>
${stylesheet ? '<link rel="stylesheet" href="/src/styles/tokens.css">' : ""}
<style>
	@media (prefers-reduced-motion: no-preference) {
		#seconds { --kin-duration-appear: 0.5s; }
	}
</style>
<script type="module">
	import * as reader from "/src/motion/motion.js";
	window.reader = reader;
</script>
</head><body>
<div id="root"></div>
<section data-kin-motion="expressive">
	<div id="expressive"></div>
	<div data-kin-motion="productive"><div id="nested"></div></div>
	<div id="seconds" data-kin-motion="expressive"></div>
</section>
</body></html>`;

async function open(
	page,
	{ reducedMotion = "no-preference", stylesheet = true } = {},
) {
	await page.emulateMedia({ reducedMotion });
	await serve(page, fixture(stylesheet));
	await page.goto("http://design.test/fixture");
	await page.waitForFunction(() => "reader" in window);
}

// Reads a term at each element, as script would before it moves that element.
const read = (page, term, ids) =>
	page.evaluate(
		([term, ids]) =>
			ids.map((id) => {
				const { ms, easing, ease } = window.reader.motion(
					term,
					id === "root" ? undefined : document.getElementById(id),
				);
				return { ms, easing: easing.replace(/\s+/g, ""), quarter: ease(0.25) };
			}),
		[term, ids],
	);

const out = "cubic-bezier(0.16,1,0.3,1)";

test("appear follows the register where the element stands", async ({
	page,
}) => {
	await open(page);
	const [root, expressive, nested, seconds] = await read(page, "appear", [
		"root",
		"expressive",
		"nested",
		"seconds",
	]);
	expect(root.ms).toBe(180);
	expect(expressive.ms).toBe(360);
	expect(nested.ms).toBe(180);
	// A duration written in seconds reads in milliseconds.
	expect(seconds.ms).toBe(500);
	for (const reading of [root, expressive, nested, seconds]) {
		expect(reading.easing).toBe(out);
		expect(reading.quarter).toBeGreaterThan(0.82);
	}
	// The easing is ready for the Web Animations API as it stands.
	const timing = await page.evaluate(() => {
		const { ms, easing } = window.reader.motion("appear");
		const animation = document
			.getElementById("root")
			.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms, easing });
		const { duration, easing: applied } = animation.effect.getTiming();
		animation.cancel();
		return { duration, easing: applied.replace(/\s+/g, "") };
	});
	expect(timing).toEqual({ duration: 180, easing: out });
});

test("with less motion appear reads 0ms in every register", async ({
	page,
}) => {
	await open(page, { reducedMotion: "reduce" });
	const readings = await read(page, "appear", ["root", "expressive", "nested"]);
	expect(readings.map(({ ms }) => ms)).toEqual([0, 0, 0]);
	// The curve is still there for whatever runs the change at once.
	expect(readings.map(({ easing }) => easing)).toEqual([out, out, out]);
	expect(await page.evaluate(() => window.reader.reduced())).toBe(true);
});

test("control reads 120ms in either register, and 0ms with less motion", async ({
	page,
}) => {
	await open(page);
	const readings = await read(page, "control", ["root", "expressive"]);
	expect(readings).toEqual([
		expect.objectContaining({ ms: 120, easing: "cubic-bezier(0.4,0,0.2,1)" }),
		expect.objectContaining({ ms: 120, easing: "cubic-bezier(0.4,0,0.2,1)" }),
	]);
	expect(await page.evaluate(() => window.reader.reduced())).toBe(false);
	await open(page, { reducedMotion: "reduce" });
	const less = await read(page, "control", ["root", "expressive"]);
	expect(less.map(({ ms }) => ms)).toEqual([0, 0]);
});

for (const reducedMotion of ["no-preference", "reduce"]) {
	test(`a loop's period is never 0 (${reducedMotion})`, async ({ page }) => {
		await open(page, { reducedMotion });
		const periods = await page.evaluate(() => ({
			trace: window.reader.period("trace"),
			expressive: window.reader.period(
				"trace",
				document.getElementById("expressive"),
			),
			pass: window.reader.period("pass"),
		}));
		expect(periods).toEqual({ trace: 1600, expressive: 1600, pass: 1050 });
		// The loop itself, run by script, lands at once with less motion.
		const ms = await page.evaluate(() => window.reader.motion("trace").ms);
		expect(ms).toBe(reducedMotion === "reduce" ? 0 : 1600);
	});
}

test("stagger steps only in the expressive register", async ({ page }) => {
	await open(page);
	const steps = await page.evaluate(() => [
		window.reader.stagger(),
		window.reader.stagger(document.getElementById("expressive")),
		window.reader.stagger(document.getElementById("nested")),
	]);
	expect(steps).toEqual([0, 45, 0]);
	await open(page, { reducedMotion: "reduce" });
	expect(
		await page.evaluate(() =>
			window.reader.stagger(document.getElementById("expressive")),
		),
	).toBe(0);
});

test("without the stylesheet, reading names the missing token", async ({
	page,
}) => {
	await open(page, { stylesheet: false });
	const errors = await page.evaluate(() =>
		[
			() => window.reader.motion("appear"),
			() => window.reader.period("trace"),
			() => window.reader.stagger(),
		].map((read) => {
			try {
				read();
				return "no error";
			} catch (error) {
				return error.message;
			}
		}),
	);
	expect(errors[0]).toContain("--kin-motion-appear");
	expect(errors[1]).toContain("--kin-duration-trace");
	expect(errors[2]).toContain("--kin-duration-stagger");
	for (const message of errors) expect(message).toContain("tokens.css");
});

test("a term the vocabulary lacks is refused by name", async ({ page }) => {
	await open(page);
	const errors = await page.evaluate(() =>
		[
			() => window.reader.motion("fade"),
			() => window.reader.motion("stagger"),
			() => window.reader.motion("appear", null),
		].map((read) => {
			try {
				read();
				return "no error";
			} catch (error) {
				return error.message;
			}
		}),
	);
	expect(errors[0]).toContain("--kin-motion-fade");
	expect(errors[1]).toContain("stagger(element)");
	expect(errors[2]).toContain("needs an element");
});

test("onReduced hears the preference change until it unsubscribes", async ({
	page,
}) => {
	await open(page);
	await page.evaluate(() => {
		window.heard = [];
		window.unsubscribe = window.reader.onReduced((less) =>
			window.heard.push(less),
		);
	});
	await page.emulateMedia({ reducedMotion: "reduce" });
	await expect.poll(() => page.evaluate(() => window.heard)).toEqual([true]);
	expect(await page.evaluate(() => window.reader.reduced())).toBe(true);
	expect(await page.evaluate(() => window.reader.motion("appear").ms)).toBe(0);
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await expect
		.poll(() => page.evaluate(() => window.heard))
		.toEqual([true, false]);
	await page.evaluate(() => window.unsubscribe());
	await page.emulateMedia({ reducedMotion: "reduce" });
	expect(await page.evaluate(() => window.reader.reduced())).toBe(true);
	expect(await page.evaluate(() => window.heard)).toEqual([true, false]);
});

test("a duration set below a boundary, or computed, reads as the pair runs", async ({
	page,
}) => {
	await open(page);
	const read = await page.evaluate(() => {
		const loose = document.createElement("div");
		// Set without a register of its own: the pair, and so a transition
		// naming it, keeps the expressive 360ms.
		loose.style.setProperty("--kin-duration-appear", "900ms");
		document.querySelector("#expressive").append(loose);
		const computed = document.createElement("div");
		computed.dataset.kinMotion = "expressive";
		computed.style.setProperty("--kin-duration-appear", "calc(120ms * 3)");
		document.body.append(computed);
		loose.style.transition = "opacity var(--kin-motion-appear)";
		return {
			loose: window.reader.motion("appear", loose).ms,
			runs: getComputedStyle(loose).transitionDuration,
			typed: typeof CSSNumericValue !== "undefined",
			computed:
				typeof CSSNumericValue !== "undefined"
					? window.reader.motion("appear", computed).ms
					: null,
		};
	});
	expect(read.loose).toBe(360);
	expect(read.runs).toBe("0.36s");
	if (read.typed) expect(read.computed).toBe(360);
});
