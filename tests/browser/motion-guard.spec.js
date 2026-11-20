import { test, expect } from "@playwright/test";
import { serve } from "./support.js";

/*
 * The motion guard (docs/motion.md, "Checking it"). It checks a running page
 * against the motion rules a stylesheet scan cannot see: at rest only the
 * page's declared motion runs, content is whole with every animation
 * cancelled, less motion leaves nothing running, loops move only what the
 * compositor can, and a frame loop stops off screen.
 *
 * Read rather than import: a product copies this file at the Design tag it
 * pins and changes only the ADAPT block, which here describes Design's own
 * reference catalog.
 */

// ---- Adapt: how to open a page, and each page's declared motion. ----------
const ADAPT = {
	/** Open a route the way the product's tests do. */
	async open(page, route) {
		await serve(page);
		await page.goto(`http://design.test${route}`);
		await page.waitForLoadState("load");
	},
	routes: {
		// Nothing on the motion page moves until it is asked.
		"/motion/": { budget: [], whole: [".lab-specimen", ".lab-curve"] },
		// Specimens of work in flight loop to show their loops.
		"/feedback/": {
			budget: [
				".kin-spinner",
				".kin-skeleton",
				".kin-progress",
				".kin-status",
				".kin-log__entry",
			],
			whole: [".kin-notice", ".kin-toast"],
		},
		"/overlays/": { budget: [], whole: [".kin-menu", ".kin-tooltip"] },
		"/components/": { budget: [".kin-status"], whole: [".kin-card"] },
		"/data/": {
			budget: [".kin-log__entry", ".kin-status"],
			whole: [".kin-list"],
		},
		// The refresh page shows the live edge and the corner key working.
		"/refresh/": {
			budget: [".kin-pattern-live-edge", ".kin-pattern-corner-key"],
			whole: [".kin-list__item"],
		},
	},
	/** Elements whose own motion stays with less motion (steps, say). */
	reducedExceptions: [],
	/** Frame loops that must stop off screen: how to start one, and leave it. */
	offscreen: [
		{
			route: "/motion/",
			start: async (page) => {
				await page.locator("#X3").scrollIntoViewIfNeeded();
				await page.locator("#X3 [data-lab-play]").click();
			},
			leave: async (page) => page.evaluate(() => window.scrollTo(0, 0)),
		},
	],
};
// ---- End of the adapt block. ----------------------------------------------

// What a loop may never animate: layout, which reruns on every frame. A loop
// moves transforms and opacity, or a small mark's paint (rule 11).
const LAYOUT =
	/^(width|height|(min|max)(Width|Height)|(block|inline)Size|top|right|bottom|left|inset.*|margin.*|padding.*|border.*Width|fontSize|lineHeight|letterSpacing|flex.*|grid.*|gap|rowGap|columnGap|aspectRatio)$/;

function running(page) {
	return page.evaluate(() =>
		document
			.getAnimations()
			.filter((animation) => animation.playState === "running")
			.map((animation) => {
				const effect = animation.effect;
				const target = effect?.target;
				return {
					infinite: effect?.getTiming().iterations === Infinity,
					target: target
						? `${target.tagName.toLowerCase()}${target.id ? `#${target.id}` : ""}.${[...target.classList].join(".")}`
						: "",
					properties: [
						...new Set(
							(effect?.getKeyframes() ?? []).flatMap((frame) =>
								Object.keys(frame),
							),
						),
					],
					name: animation.animationName ?? animation.transitionProperty ?? "",
				};
			}),
	);
}

for (const [route, { budget }] of Object.entries(ADAPT.routes)) {
	test(`${route}: at rest, only its declared motion runs`, async ({ page }) => {
		await ADAPT.open(page, route);
		await page.waitForTimeout(600);
		const undeclared = await page.evaluate((budget) => {
			return document
				.getAnimations()
				.filter(
					(animation) =>
						animation.playState === "running" &&
						animation.effect?.getTiming().iterations === Infinity,
				)
				.map((animation) => animation.effect.target)
				.filter(
					(target) => !budget.some((selector) => target.closest(selector)),
				)
				.map((target) => target.outerHTML.slice(0, 120));
		}, budget);
		expect(undeclared, "infinite animations outside the page's budget").toEqual(
			[],
		);
	});

	test(`${route}: no loop moves layout`, async ({ page }) => {
		await ADAPT.open(page, route);
		await page.waitForTimeout(300);
		for (const animation of await running(page)) {
			if (!animation.infinite) continue;
			const layout = animation.properties.filter((name) => LAYOUT.test(name));
			expect(layout, `${animation.target} ${animation.name}`).toEqual([]);
		}
	});
}

for (const [route, { whole }] of Object.entries(ADAPT.routes)) {
	test(`${route}: content is whole with every animation cancelled`, async ({
		page,
	}) => {
		await ADAPT.open(page, route);
		const faint = await page.evaluate((whole) => {
			for (const animation of document.getAnimations()) animation.cancel();
			return whole.flatMap((selector) =>
				[...document.querySelectorAll(selector)]
					.filter((element) => element.getClientRects().length)
					.filter((element) => Number(getComputedStyle(element).opacity) < 0.99)
					.map((element) => `${selector}: ${element.outerHTML.slice(0, 80)}`),
			);
		}, whole);
		expect(faint, "content hidden once its animation is gone").toEqual([]);
	});

	test(`${route}: with less motion, nothing is left running`, async ({
		browser,
	}) => {
		const context = await browser.newContext({ reducedMotion: "reduce" });
		const page = await context.newPage();
		await ADAPT.open(page, route);
		await page.waitForTimeout(300);
		const left = await page.evaluate((exceptions) => {
			return document
				.getAnimations()
				.filter((animation) => animation.playState === "running")
				.filter(
					(animation) =>
						!exceptions.some((selector) =>
							animation.effect?.target?.closest(selector),
						),
				)
				.map(
					(animation) =>
						`${animation.effect?.target?.outerHTML.slice(0, 80)} ${animation.animationName ?? animation.transitionProperty ?? ""}`,
				);
		}, ADAPT.reducedExceptions);
		expect(left, "animations still running with less motion").toEqual([]);
		await context.close();
	});
}

for (const loop of ADAPT.offscreen) {
	test(`${loop.route}: a frame loop stops off screen`, async ({ page }) => {
		await page.addInitScript(() => {
			const native = window.requestAnimationFrame.bind(window);
			window.__frames = 0;
			window.requestAnimationFrame = (callback) =>
				native((time) => {
					window.__frames++;
					callback(time);
				});
		});
		await ADAPT.open(page, loop.route);
		await loop.start(page);
		await page.waitForTimeout(300);
		const playing = await page.evaluate(() => window.__frames);
		expect(playing, "the loop draws while it is seen").toBeGreaterThan(5);
		await loop.leave(page);
		await page.waitForTimeout(300);
		const before = await page.evaluate(() => window.__frames);
		await page.waitForTimeout(500);
		const after = await page.evaluate(() => window.__frames);
		expect(after - before, "frames drawn while off screen").toBe(0);
	});
}
