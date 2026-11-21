import { test, expect } from "@playwright/test";
import { serve } from "./support.js";
import { ms, table } from "./motion-table.js";

// The motion lab (/motion/) is where Blake judges motion by eye, so it must
// show what docs/motion.md says, be still until asked, show less motion as a
// reader who asks for it sees it, and keep its corrections true: each before
// breaks the rule its after keeps.

async function open(page) {
	const errors = [];
	page.on("pageerror", (error) => errors.push(String(error)));
	await serve(page);
	await page.goto("http://design.test/motion/");
	await expect(page.locator("[data-lab-status]")).not.toBeEmpty();
	return errors;
}

// Buttons are pressed from the keyboard. base.css scrolls smoothly, and under
// load in WebKit a pointer that lands while a button far down the lab is still
// gliding into view clicks nothing: K10's and K11's were lost that way at
// eight workers.
const press = (page, selector) => page.locator(selector).press("Enter");

const readings = (page) =>
	page.evaluate(() =>
		[...document.querySelectorAll("[data-lab-reading]")].map((element) => ({
			term: element.dataset.labReading,
			register: element.closest("[data-kin-motion]").dataset.kinMotion,
			text: element.textContent.trim(),
		})),
	);

const running = (page) =>
	page.evaluate(
		() =>
			document
				.getAnimations()
				.filter((animation) => animation.playState === "running").length,
	);

test("the lab is still at load and reads the doc's values", async ({
	page,
}) => {
	const errors = await open(page);
	expect(await running(page)).toBe(0);
	const terms = Object.fromEntries(
		table("values").map((row) => [row.Term, row]),
	);
	const shown = await readings(page);
	// Every term once, and content and place in both registers.
	expect(shown).toHaveLength(22);
	expect(new Set(shown.map((entry) => entry.term)).size).toBe(17);
	for (const { term, register, text } of shown) {
		const column = register === "expressive" ? "Expressive" : "Productive";
		const time = text.split(" ")[0];
		expect.soft(ms(time), `${term} ${register}`).toBe(ms(terms[term][column]));
	}
	expect(errors).toEqual([]);
});

test("simulated less motion shows what the system's shows", async ({
	browser,
}) => {
	const probes = [
		"[data-lab-hand]",
		".lab-meter > span",
		".lab-press",
		".kin-switch input",
		".lab-trace path[pathLength]",
	];
	const state = (page) =>
		page.evaluate((probes) => {
			const out = {};
			for (const selector of probes) {
				for (const [index, element] of [
					...document.querySelectorAll(`[data-lab] ${selector}`),
				].entries()) {
					const style = getComputedStyle(element);
					out[`${selector} ${index}`] =
						`${style.transitionDuration} ${style.animationName}`;
				}
			}
			return out;
		}, probes);
	const system = await browser.newPage({ reducedMotion: "reduce" });
	await open(system);
	const simulated = await browser.newPage();
	await open(simulated);
	await simulated.locator("[data-lab-less-toggle]").check();
	expect(await readings(simulated)).toEqual(await readings(system));
	expect(await state(simulated)).toEqual(await state(system));
	// Content and place have no time with less motion; work keeps its period.
	const less = await readings(simulated);
	for (const entry of less) {
		if (
			["settle", "draw", "appear", "stagger", "navigate"].includes(entry.term)
		) {
			expect.soft(entry.text, entry.term).toBe("none");
		}
	}
	await system.close();
	await simulated.close();
});

test("work in flight runs only while its work does", async ({ page }) => {
	await open(page);
	for (const id of ["W1", "W2", "W3", "W4"]) {
		await press(page, `#${id} [data-lab-work]`);
	}
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
	await expect.poll(loops).toBeGreaterThanOrEqual(4);
	for (const id of ["W1", "W2", "W3", "W4"]) {
		await press(page, `#${id} [data-lab-work]`);
	}
	await expect.poll(loops, { timeout: 5000 }).toBe(0);
});

test("each correction's before breaks its rule and its after keeps it", async ({
	page,
}) => {
	test.setTimeout(60000);
	await open(page);
	await press(page, "#K1 [data-lab-run]");
	await press(page, "#K3 [data-lab-run]");
	await press(page, "#K5 [data-lab-visit]");
	await press(page, "#K6 [data-lab-load]");
	await press(page, "#K2 [data-lab-run]");
	await press(page, "#K7 [data-lab-load]");
	await press(page, "#K9 [data-lab-dismiss]");
	await press(page, "#K10 [data-lab-run]");
	await press(page, "#K11 [data-lab-point]");
	// Long enough for the old page to dock itself and the old entry to finish.
	await page.waitForTimeout(3800);
	await press(page, "#K6 [data-lab-jump]");
	// K4 and K8 run frame loops, which stop off screen: each is watched in view.
	for (const id of ["K4", "K8"]) {
		await page.locator(`#${id}`).scrollIntoViewIfNeeded();
		await press(page, `#${id} [data-lab-run]`);
		await expect(
			page.locator(`#${id} [data-lab-check]`).first(),
			`${id} before`,
		).toHaveAttribute("data-kept", "false", { timeout: 10000 });
		await expect(
			page.locator(`#${id} [data-lab-check]`).last(),
			`${id} after`,
		).toHaveAttribute("data-kept", "true", { timeout: 10000 });
	}
	const ids = [
		"K1",
		"K2",
		"K3",
		"K4",
		"K5",
		"K6",
		"K7",
		"K8",
		"K9",
		"K10",
		"K11",
	];
	expect(await page.locator("[data-lab-correction]").count()).toBe(ids.length);
	for (const id of ids.filter((id) => id !== "K4" && id !== "K8")) {
		const [before, after] = [
			page.locator(`#${id} [data-lab-check]`).first(),
			page.locator(`#${id} [data-lab-check]`).last(),
		];
		await expect(before, `${id} before`).toHaveAttribute("data-kept", "false", {
			timeout: 10000,
		});
		await expect(after, `${id} after`).toHaveAttribute("data-kept", "true", {
			timeout: 10000,
		});
	}
});

test("one exit speed reads in ms, however the build writes it", async ({
	page,
}) => {
	await open(page);
	await press(page, "#K9 [data-lab-dismiss]");
	await expect(page.locator("#K9 [data-lab-check]").last()).toHaveText(
		/every layer leaves at 180ms/,
	);
});

test("the escapement beats on its own gait, and playback draws nothing once stopped", async ({
	page,
}) => {
	await open(page);
	await press(page, "#X2 [data-lab-run]");
	const hand = page.locator("[data-x2-hand]");
	// One minute-long animation of 181 keyframes, started from the clock.
	expect(
		await hand.evaluate((element) => {
			const [turn] = element.getAnimations();
			return [
				turn.effect.getKeyframes().length,
				turn.effect.getTiming().duration,
			];
		}),
	).toEqual([181, 60000]);
	await page.locator("#X3").scrollIntoViewIfNeeded();
	await press(page, "#X3 [data-lab-play]");
	await page.waitForTimeout(400);
	await press(page, "#X3 [data-lab-play]");
	await expect(page.locator("#X3 [data-lab-check]")).toHaveAttribute(
		"data-kept",
		"true",
		{ timeout: 5000 },
	);
	await expect(page.locator("#X3 [data-lab-check]")).toHaveText(
		/0 frames drawn since it stopped/,
	);
});
