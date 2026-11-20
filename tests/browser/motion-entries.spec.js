import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { serve } from "./support.js";

// The entries candidate (registry/patterns/entries): an instrument's entries
// wait until it is first seen and start in the frame it is, and a frame loop
// runs only on screen and in a shown tab. Its own example is the instrument.
const example = readFileSync(
	path.join(process.cwd(), "registry/patterns/entries/entries.html"),
	"utf8",
);

const fixture = (body, script) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8">
<link rel="stylesheet" href="/src/styles/tokens.css">
<link rel="stylesheet" href="/registry/patterns/entries/entries.css">
<style>
	body { margin: 0; }
	.away { height: 150vh; }
	svg { display: block; width: 240px; height: 80px; }
</style>
<script type="module">
	import * as entries from "/registry/patterns/entries/entries.js";
	${script}
	window.ready = true;
</script>
</head><body>
<div class="away"></div>
${body}
<div class="away"></div>
</body></html>`;

const instrument = fixture(
	example,
	'window.release = entries.inview(document.querySelector("figure"));',
);

// What a frame shows of the instrument: the trace's offset, the band's and
// the marks' opacity, and every animation on the page.
function shown() {
	const styles = (selector) =>
		[...document.querySelectorAll(selector)].map((node) =>
			getComputedStyle(node),
		);
	return {
		waiting: document.querySelector("figure").getAttribute("data-inview"),
		trace: styles(".kin-pattern-entry-draw").map((style) =>
			parseFloat(style.strokeDashoffset),
		),
		band: styles(".kin-pattern-entry-fade").map((style) => style.opacity),
		marks: styles(".kin-pattern-entry-appear").map((style) => style.opacity),
		animations: document.getAnimations().map((animation) => {
			const timing = animation.effect.getComputedTiming();
			// To the microsecond, since calc() of times carries float error.
			const round = (ms) => Math.round(ms * 1000) / 1000;
			return {
				name: animation.animationName,
				duration: round(timing.duration),
				delay: round(timing.delay),
				state: animation.playState,
			};
		}),
	};
}

// Brings the instrument into view, and reads what the next frame paints.
function seeIt() {
	return new Promise((resolve) => {
		document
			.querySelector("figure")
			.scrollIntoView({ block: "center", behavior: "instant" });
		requestAnimationFrame(() => resolve(window.shown()));
	});
}

const whole = { trace: [0], band: ["1"], marks: ["1", "1", "1"] };

async function open(page, html, reducedMotion = "no-preference") {
	await page.emulateMedia({ reducedMotion });
	await page.addInitScript(`window.shown = ${shown};`);
	await serve(page, html);
	await page.goto("http://design.test/fixture");
	await page.waitForFunction(() => window.ready === true);
}

test("a waiting instrument has no animations and is whole", async ({
	page,
}) => {
	await open(page, instrument);
	const state = await page.evaluate(() => window.shown());
	expect(state.waiting).toBe("waiting");
	expect(state.animations).toEqual([]);
	expect(state).toMatchObject(whole);
	// The words that state the reading are there from the start.
	await expect(page.locator("figcaption")).toHaveText(/within 2 µs/);
});

test("scrolling it into view starts its entry with the first painted frame hidden", async ({
	page,
}) => {
	await open(page, instrument);
	// The scroll's own event releases the entry before the frame paints, so
	// the first frame that shows the instrument shows each entry at its start.
	const first = await page.evaluate(seeIt);
	expect(first.waiting).toBeNull();
	expect(first.trace).toEqual([1]);
	expect(first.band).toEqual(["0"]);
	expect(first.marks).toEqual(["0", "0", "0"]);
	// The band fades with the trace; the marks wait for half of it, in turn.
	expect(first.animations.map(({ state, ...entry }) => entry)).toEqual([
		{ name: "kin-fade", duration: 1400, delay: 0 },
		{ name: "kin-draw", duration: 1400, delay: 0 },
		{ name: "kin-appear", duration: 360, delay: 700 },
		{ name: "kin-appear", duration: 360, delay: 745 },
		{ name: "kin-appear", duration: 360, delay: 790 },
	]);
	// Each entry ends on the element's own style.
	await page.evaluate(() =>
		Promise.all(
			document.getAnimations().map((animation) => animation.finished),
		),
	);
	expect(await page.evaluate(() => window.shown())).toMatchObject(whole);
	// Seen again, it does not play again.
	await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
	const again = await page.evaluate(seeIt);
	expect(again.waiting).toBeNull();
	expect(again.animations.map(({ state }) => state)).toEqual(
		Array(5).fill("finished"),
	);
	expect(again).toMatchObject(whole);
});

test("with less motion there are no entries", async ({ page }) => {
	await open(page, instrument, "reduce");
	const before = await page.evaluate(() => window.shown());
	// Nothing waits, and nothing takes time.
	expect(before.waiting).toBeNull();
	expect(before.animations).toEqual([]);
	expect(before).toMatchObject(whole);
	const seen = await page.evaluate(seeIt);
	expect(seen.animations).toEqual([]);
	expect(seen).toMatchObject(whole);
});

test("a frame loop runs only on screen and in a shown tab", async ({
	page,
}) => {
	await open(
		page,
		fixture(
			'<div id="loop" style="height: 4rem"></div>',
			// One stream, in order: each start and stop, and each frame's step.
			`window.log = { frames: 0, events: [] };
	window.stop = entries.frames(
		document.getElementById("loop"),
		(now, dt) => { log.frames++; log.events.push(dt); },
		{ running: (on) => log.events.push(on) },
	);`,
		),
	);
	const states = () =>
		page.evaluate(() =>
			window.log.events.filter((event) => typeof event === "boolean"),
		);
	// A few frames run, and the count says whether the loop asked for them.
	const moving = () =>
		page.evaluate(
			() =>
				new Promise((resolve) => {
					const before = window.log.frames;
					let left = 4;
					const tick = () =>
						--left
							? requestAnimationFrame(tick)
							: resolve(window.log.frames > before);
					requestAnimationFrame(tick);
				}),
		);
	const hide = (hidden) =>
		page.evaluate((hidden) => {
			Object.defineProperty(document, "hidden", {
				configurable: true,
				get: () => hidden,
			});
			document.dispatchEvent(new Event("visibilitychange"));
		}, hidden);
	const scroll = (where) =>
		page.evaluate((where) => {
			if (where === "away") scrollTo({ top: 0, behavior: "instant" });
			else
				document
					.getElementById("loop")
					.scrollIntoView({ block: "center", behavior: "instant" });
		}, where);

	// Off screen from the start, it never begins.
	expect(await moving()).toBe(false);
	expect(await states()).toEqual([]);

	await scroll("into view");
	await expect.poll(states).toEqual([true]);
	expect(await moving()).toBe(true);

	await hide(true);
	expect(await states()).toEqual([true, false]);
	expect(await moving()).toBe(false);
	await hide(false);
	expect(await states()).toEqual([true, false, true]);
	expect(await moving()).toBe(true);

	await scroll("away");
	await expect.poll(states).toEqual([true, false, true, false]);
	expect(await moving()).toBe(false);

	await scroll("into view");
	await expect.poll(states).toEqual([true, false, true, false, true]);
	expect(await moving()).toBe(true);
	await page.evaluate(() => window.stop());
	expect(await states()).toEqual([true, false, true, false, true, false]);
	expect(await moving()).toBe(false);

	// The first step after each start is 0, and no step is longer than maxDt.
	const events = await page.evaluate(() => window.log.events);
	const firstSteps = events.flatMap((event, index) =>
		event === true ? [events[index + 1]] : [],
	);
	expect(firstSteps).toEqual([0, 0, 0]);
	const steps = events.filter((event) => typeof event === "number");
	expect(Math.max(...steps)).toBeLessThanOrEqual(0.1);
});
