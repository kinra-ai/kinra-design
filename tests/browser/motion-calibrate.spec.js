import { test, expect } from "@playwright/test";
import { serve } from "./support.js";

// The calibration page (/motion/calibrate/) is where Blake sets values by eye,
// so B must run at exactly the value its sliders show, and the values to copy
// and the address must say the same. The journey page (/motion/journey/)
// plays the navigate term as real view transitions inside the lab's frames.

async function open(page, path) {
	const errors = [];
	page.on("pageerror", (error) => errors.push(String(error)));
	await serve(page);
	await page.goto(`http://design.test${path}`);
	return errors;
}

async function calibrate(page, query = "") {
	const errors = await open(page, `/motion/calibrate/${query}`);
	await expect(page.locator("[data-cal-copy]")).not.toHaveValue("");
	return errors;
}

const running = (page) =>
	page.evaluate(
		() =>
			document
				.getAnimations()
				.filter((animation) => animation.playState === "running").length,
	);

/** A computed style property of an element on one side of a specimen. */
const style = (page, id, side, selector, property) =>
	page.evaluate(
		([id, side, selector, property]) => {
			const root = document.querySelector(`#${id} [data-cal-side="${side}"]`);
			const element = selector ? root.querySelector(selector) : root;
			return getComputedStyle(element).getPropertyValue(property).trim();
		},
		[id, side, selector, property],
	);

test("the calibration page is still at load and each B starts at its token", async ({
	page,
}) => {
	const errors = await calibrate(page);
	expect(await running(page)).toBe(0);
	const specimens = await page.evaluate(() =>
		[...document.querySelectorAll("[data-cal-specimen]")].map((specimen) => ({
			id: specimen.id,
			register: specimen.dataset.calRegister,
			sides: [...specimen.querySelectorAll("[data-cal-side]")].map((side) => ({
				register: side.dataset.kinMotion,
				reading: side.querySelector("[data-cal-reading]").textContent,
			})),
		})),
	);
	// Five registered terms in each register, and nine fixed ones.
	expect(specimens).toHaveLength(19);
	for (const { id, register, sides } of specimens) {
		expect(sides, id).toHaveLength(2);
		const [a, b] = sides;
		expect.soft(b.reading, id).toBe(a.reading);
		expect.soft(a.reading, id).not.toBe("");
		if (register !== "fixed") {
			expect.soft(a.register, id).toBe(register);
			expect.soft(b.register, id).toBe(register);
		}
	}
	await expect(page.locator("[data-cal-copy]")).toHaveValue(/No changes/);
	expect(new URL(page.url()).search).toBe("");
	expect(errors).toEqual([]);
});

test("moving a slider updates the values to copy and the address", async ({
	page,
}) => {
	await calibrate(page);
	const copy = page.locator("[data-cal-copy]");
	const slider = page.locator("#S3P [data-cal-ms]");
	await slider.focus();
	await slider.press("ArrowRight");
	await expect(page.locator("#S3P [data-cal-ms-number]")).toHaveValue("190");
	await expect(copy).toHaveValue(
		/--kin-duration-appear: 190ms; \/\* S3P, was 180ms \*\//,
	);
	await expect(page).toHaveURL(/[?&]S3P\.ms=190(&|$)/);

	await page.locator("#S3P [data-cal-curve]").selectOption("standard");
	await expect(copy).toHaveValue(
		/:root,\n\[data-kin-motion\] \{\n\t--kin-motion-appear: var\(--kin-duration-appear\) var\(--kin-ease-standard\); \/\* S3P, was out; serves both registers \*\//,
	);
	await expect(page).toHaveURL(/[?&]S3P\.curve=standard(&|$)/);

	// The exit's comparison curve, as four custom points.
	await page.locator("#L3 [data-cal-preset]").click();
	await expect(copy).toHaveValue(
		/--kin-motion-exit: var\(--kin-duration-exit\) cubic-bezier\(0\.4, 0, 1, 1\); \/\* L3, was in \*\//,
	);
	await expect(page).toHaveURL(/[?&]L3\.curve=0\.4,0,1,1(&|$)/);

	// The address alone brings every value back.
	const text = await copy.inputValue();
	await page.reload();
	await expect(page.locator("#S3P [data-cal-ms-number]")).toHaveValue("190");
	await expect(page.locator("#S3P [data-cal-curve]")).toHaveValue("standard");
	await expect(page.locator("#L3 [data-cal-curve]")).toHaveValue("custom");
	await expect(copy).toHaveValue(text);
});

test("a slider moved many times a second keeps the address in step", async ({
	page,
}) => {
	// WebKit refuses a page that rewrites its address more than 100 times in
	// ten seconds, which a dragged slider would.
	const errors = await calibrate(page);
	const slider = page.locator("#S1E [data-cal-ms]");
	await slider.focus();
	for (let step = 0; step < 120; step++) await slider.press("ArrowRight");
	await expect(page.locator("#S1E [data-cal-ms-number]")).toHaveValue("2600");
	await expect(page.locator("[data-cal-copy]")).toHaveValue(
		/--kin-duration-settle: 2600ms; \/\* S1E, was 1400ms \*\//,
	);
	await expect(page).toHaveURL(/[?&]S1E\.ms=2600(&|$)/);
	expect(errors).toEqual([]);
});

test("B runs at its slider's value, written on its own register container", async ({
	page,
}) => {
	await calibrate(page);
	// A transition: the expressive hand settles over B's duration.
	await page.locator("#S1E [data-cal-ms-number]").fill("1000");
	expect(
		await style(page, "S1E", "b", "[data-cal-hand]", "transition-duration"),
	).toBe("1s");
	expect(
		await style(page, "S1E", "a", "[data-cal-hand]", "transition-duration"),
	).toBe("1.4s");
	// The duration and the pair are both written where B stands.
	expect(await style(page, "S1E", "b", "", "--kin-duration-settle")).toBe(
		"1000ms",
	);
	expect(await style(page, "S1E", "b", "", "--kin-motion-settle")).toMatch(
		/^1000ms /,
	);

	// An animation: a productive row appears over B's duration.
	await page.locator("#S3P [data-cal-ms-number]").fill("260");
	await page.locator("#S3P [data-cal-replay]").click();
	expect(await style(page, "S3P", "b", ".cal-rise", "animation-duration")).toBe(
		"0.26s",
	);
	expect(await style(page, "S3P", "a", ".cal-rise", "animation-duration")).toBe(
		"0.18s",
	);

	// A fixed term: the control answers over B's duration, on B's curve.
	await page.locator("#C1 [data-cal-ms-number]").fill("200");
	await page.locator("#C1 [data-cal-curve]").selectOption("linear");
	expect(
		await style(page, "C1", "b", "[data-cal-press]", "transition-duration"),
	).toBe("0.2s, 0.2s");
	expect(
		await style(
			page,
			"C1",
			"b",
			"[data-cal-press]",
			"transition-timing-function",
		),
	).toBe("linear, linear");
	expect(
		await style(page, "C1", "a", "[data-cal-press]", "transition-duration"),
	).toBe("0.12s, 0.12s");
});

test("one replay starts both sides, and blind hides which is which", async ({
	page,
}) => {
	await calibrate(page);
	await page.locator("#S1E [data-cal-ms-number]").fill("2000");
	await page.locator("#S1E [data-cal-replay]").click();
	const hands = await page.evaluate(() =>
		[...document.querySelectorAll("#S1E [data-cal-hand]")].map((hand) => ({
			angle: getComputedStyle(hand).getPropertyValue("--cal-angle"),
			duration: hand.getAnimations()[0]?.effect.getTiming().duration,
		})),
	);
	// Both hands set off for the same value, A on its token and B on its own.
	expect(hands[0].angle).toBe(hands[1].angle);
	expect(hands.map((hand) => hand.duration)).toEqual([1400, 2000]);

	const names = () => page.locator("#S1E [data-cal-name]").allTextContents();
	await page.locator("#S1E [data-cal-blind]").check();
	expect(await names()).toEqual(["Side 1", "Side 2"]);
	await expect(page.locator("#S1E [data-cal-reading]").first()).toBeHidden();
	await page.locator("#S1E [data-cal-reveal]").click();
	expect((await names()).sort()).toEqual(["A · tokens.css", "B · sliders"]);
	await expect(page.locator("#S1E [data-cal-reading]").first()).toBeVisible();
	await page.locator("#S1E [data-cal-blind]").uncheck();
	expect(await names()).toEqual(["A · tokens.css", "B · sliders"]);
});

test("work in flight runs only while its work does", async ({ page }) => {
	await calibrate(page);
	const loops = () =>
		page.evaluate(
			() =>
				document
					.getAnimations()
					.filter(
						(animation) =>
							animation.effect?.getTiming().iterations === Infinity &&
							animation.playState === "running",
					).length,
		);
	for (const id of ["W2", "W3", "W4"]) {
		await page.locator(`#${id} [data-cal-replay]`).click();
	}
	// On each side, sweep runs three placeholder bands and a bar, pulse a mark
	// and a marker, and pass one spinner.
	await expect.poll(loops).toBe(2 * (4 + 2 + 1));
	for (const id of ["W2", "W3", "W4"]) {
		await page.locator(`#${id} [data-cal-end]`).click();
	}
	await expect.poll(loops).toBe(0);
});

test("the page works by keyboard at 400px wide", async ({ page }) => {
	await page.setViewportSize({ width: 400, height: 800 });
	await calibrate(page);
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth),
	).toBeLessThanOrEqual(400);
	// Every control outside the inert specimens is native, named and
	// reachable by Tab.
	const unnamed = await page.evaluate(() =>
		[
			...document.querySelectorAll(
				"main :is(button, input, select, textarea, a[href])",
			),
		]
			.filter((control) => !control.closest("[inert]"))
			.filter((control) => {
				const name =
					[...(control.labels ?? [])]
						.map((label) => label.textContent)
						.join(" ")
						.trim() ||
					control.getAttribute("aria-label") ||
					control.textContent.trim();
				return !name || control.tabIndex < 0;
			})
			.map((control) => control.outerHTML.slice(0, 80)),
	);
	expect(unnamed).toEqual([]);
	await page.locator("#S3P [data-cal-ms]").focus();
	await page.keyboard.press("End");
	await expect(page.locator("#S3P [data-cal-ms-number]")).toHaveValue("1000");
	// Open and Return take turns, and hand focus to each other.
	await page.locator('#P1E [data-cal-way="open"]').focus();
	await page.keyboard.press("Enter");
	await expect(page.locator('#P1E [data-cal-way="return"]')).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(page.locator('#P1E [data-cal-way="open"]')).toBeFocused();
});

test("with less motion the page says so, and nothing moves", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	const errors = await calibrate(page);
	await expect(page.locator("[data-cal-os]")).toBeVisible();
	await expect(
		page.locator('#S1E [data-cal-side="a"] [data-cal-reading]'),
	).toHaveText("none");
	for (const id of ["S1E", "S3E", "C2", "L1", "W2"]) {
		await page.locator(`#${id} [data-cal-replay]`).click();
	}
	await page.locator('#P1E [data-cal-way="onward"]').click();
	await expect.poll(() => running(page)).toBe(0);
	expect(errors).toEqual([]);
});

// ------------------------------------------------------------------ Journey

/** Count every view transition the page starts. */
async function journey(page, query, options = {}) {
	if (options.reducedMotion) await page.emulateMedia(options);
	await page.addInitScript(() => {
		window.transitions = [];
		const start = document.startViewTransition?.bind(document);
		if (!start) return;
		document.startViewTransition = (update) => {
			const transition = start(update);
			window.transitions.push(transition);
			return transition;
		};
	});
	const errors = await open(page, `/motion/journey/${query}`);
	expect(await running(page)).toBe(0);
	return errors;
}

/** Go one way, and read the view transition's animations once it is ready. */
const go = (page, way, rate) =>
	page.evaluate(
		async ([way, rate]) => {
			if (rate) {
				await new Promise((resolve) => {
					addEventListener("message", resolve, { once: true });
					postMessage({ type: "kin-lab-speed", rate }, location.origin);
				});
			}
			const before = window.transitions?.length ?? 0;
			document.querySelector(`[data-journey-go="${way}"]`).click();
			const transition = window.transitions?.[before];
			if (!transition) return null;
			await transition.ready;
			return document
				.getAnimations()
				.filter((animation) =>
					animation.effect?.pseudoElement?.startsWith("::view-transition"),
				)
				.map((animation) => ({
					pseudo: animation.effect.pseudoElement,
					name: animation.animationName,
					duration: animation.effect.getTiming().duration,
					rate: animation.playbackRate,
				}));
		},
		[way, rate],
	);

const shown = (page) =>
	page.evaluate(
		() =>
			document.querySelector("[data-journey-room]:not([hidden])")?.dataset
				.journeyName ?? "detail",
	);

test("an expressive journey runs view transitions on the navigate term", async ({
	page,
}) => {
	const errors = await journey(page, "?register=expressive");
	test.skip(
		!(await page.evaluate(() => "startViewTransition" in document)),
		"No view transitions in this browser",
	);
	const onward = await go(page, "onward");
	expect(await shown(page)).toBe("Scale");
	const timing = Object.fromEntries(
		onward
			.filter((animation) => !animation.name.startsWith("-ua-mix-blend"))
			.map((animation) => [animation.pseudo, animation]),
	);
	expect(timing["::view-transition-old(root)"]).toMatchObject({
		name: "journey-leave-left",
		duration: 460,
	});
	expect(timing["::view-transition-new(root)"]).toMatchObject({
		name: "journey-enter-right",
		duration: 460,
	});
	expect(timing["::view-transition-group(root)"].duration).toBe(460);
	// The bar holds still.
	expect(timing["::view-transition-group(journey-bar)"].duration).toBe(0);

	await page.evaluate(() =>
		Promise.all(window.transitions.map((t) => t.finished)),
	);
	const opening = await go(page, "open");
	expect(await shown(page)).toBe("detail");
	expect(
		opening.find(
			(animation) => animation.pseudo === "::view-transition-new(root)",
		),
	).toMatchObject({ name: "journey-arrive", duration: 460 });
	expect(
		await page.evaluate(() =>
			document.documentElement.style.getPropertyValue("--journey-origin"),
		),
	).toMatch(/^[\d.]+% [\d.]+%$/);
	expect(errors).toEqual([]);
});

test("the lab's speed reaches a journey's view transition", async ({
	page,
}) => {
	await journey(page, "?register=expressive");
	test.skip(
		!(await page.evaluate(() => "startViewTransition" in document)),
		"No view transitions in this browser",
	);
	const animations = await go(page, "onward", 0.25);
	expect(animations.length).toBeGreaterThan(0);
	for (const animation of animations) expect(animation.rate).toBe(0.25);
});

test("a productive journey, or one with less motion, arrives at once", async ({
	browser,
}) => {
	for (const [query, options] of [
		["?register=productive", {}],
		["", {}],
		["?register=expressive", { reducedMotion: "reduce" }],
	]) {
		const page = await browser.newPage();
		const errors = await journey(page, query, options);
		expect(await go(page, "onward"), query).toBeNull();
		expect(await shown(page)).toBe("Scale");
		expect(await page.evaluate(() => window.transitions.length)).toBe(0);
		expect(await running(page)).toBe(0);
		expect(errors).toEqual([]);
		await page.close();
	}
});
