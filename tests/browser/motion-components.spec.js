import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { serve } from "./support.js";
import { compact, curve, ms, table } from "./motion-table.js";

// Design's own components move by the terms of docs/motion.md: each computes
// its term's duration and curve, each loop keeps its still form with less
// motion, every layer stands whole with no animation, and a dialog, drawer or
// popover leaves the way it came, faster.

const keySource = readFileSync(
	path.join(process.cwd(), "registry/patterns/corner-key/corner-key.html"),
	"utf8",
).replace(/^<!--.*?-->\s*/s, "");

const key = keySource.replace(
	'data-face="rest"',
	'data-face="working" data-trace="live" id="key"',
);

const edge = (state, extra = "") =>
	`<li class="kin-list__item" style="position: relative"><span class="kin-pattern-live-edge" data-edge="${state}" ${extra} aria-hidden="true"><span class="kin-pattern-live-edge__line" id="edge-${state}${extra ? "-sparks" : ""}"></span></span><div class="kin-list__body"><p class="kin-list__title">${state}</p></div></li>`;

const fixture = `<!doctype html><html lang="en"><head>
<link rel="stylesheet" href="/src/styles/index.css">
<link rel="stylesheet" href="/registry/patterns/live-edge/live-edge.css">
<link rel="stylesheet" href="/registry/patterns/corner-key/corner-key.css">
</head><body>
<button class="kin-chip" id="chip" type="button">Chip</button>
<input class="kin-input" id="input" aria-label="Input">
<select class="kin-select" id="select" aria-label="Select"><option>One</option></select>
<textarea class="kin-textarea" id="textarea" aria-label="Text"></textarea>
<label class="kin-switch"><input type="checkbox" role="switch" id="switch"> Switch</label>
<details class="kin-disclosure"><summary id="summary">More</summary><p>Inside</p></details>
<div class="kin-segmented" role="radiogroup" aria-label="Density"><button id="segment" type="button">One</button></div>
<div class="kin-tabs" role="tablist"><button class="kin-tabs__tab" id="tab" role="tab" type="button">Tab</button></div>
<nav class="kin-pagination" aria-label="Pages"><ul><li><a id="page" href="#two">2</a></li></ul></nav>
<nav class="kin-nav" aria-label="Sections"><ul><li><a id="nav" href="#one">One</a></li></ul></nav>
<ul class="kin-list"><li class="kin-list__item" data-link id="row"><div class="kin-list__body"><p class="kin-list__title"><a href="#row">Row</a></p></div></li></ul>
<span class="kin-status" data-state="running" id="status">Running</span>
<ol class="kin-log"><li class="kin-log__entry" data-live><span class="kin-log__marker" id="marker" aria-hidden="true"></span><div class="kin-log__body"><p class="kin-log__title">Indexing</p></div></li></ol>
<span class="kin-spinner" id="spinner">Working</span>
<span class="kin-skeleton" id="skeleton"></span>
<progress class="kin-progress" id="sweep" aria-label="Unknown"></progress>
<progress class="kin-progress" id="fill" value="40" max="100" aria-label="Known"></progress>
<ul class="kin-list">
${edge("working")}${edge("working", 'data-sparks="2"')}${edge("agents")}${edge("waiting")}${edge("closing")}${edge("finished")}${edge("reconnecting")}
</ul>
<div style="position: relative; display: flex">${key}</div>
<div class="kin-toast-region"><div class="kin-toast" id="toast"><p class="kin-toast__title">Saved</p></div></div>
<div class="kin-tooltip" popover="manual" id="tip">Name</div>
<button id="opener" type="button">Open</button>
<button id="under" type="button" style="position: fixed; inset: 50% auto auto 50%; translate: -50% -50%">Under</button>
<dialog class="kin-dialog" id="dialog" aria-label="Dialog"><div class="kin-dialog__body"><p>A dialog.</p><button id="inside" type="button">Inside</button></div></dialog>
<dialog class="kin-drawer" id="drawer" aria-label="End"><button type="button">End</button></dialog>
<dialog class="kin-drawer" data-side="start" id="start" aria-label="Start"><button type="button">Start</button></dialog>
<dialog class="kin-drawer" data-side="bottom" id="bottom" aria-label="Bottom"><button type="button">Bottom</button></dialog>
<div class="kin-popover" popover id="popover"><button id="item" type="button">Item</button></div>
</body></html>`;

const values = Object.fromEntries(
	table("values").map((row) => [row.Term, row]),
);

/** A fixed term's duration in ms and its curve, as the doc's table says. */
const term = (name) => ({
	duration: ms(values[name].Productive),
	easing: curve(values[name].Curve),
});

/** A computed list, split at its top-level commas, each entry compact. */
const list = (value) =>
	value
		.split(/,(?![^(]*\))/)
		.map((entry) =>
			compact(entry).replace(/^steps\((\d+)\)$/, "steps($1,end)"),
		);

async function open(page, reducedMotion = "no-preference", html = fixture) {
	await page.emulateMedia({ reducedMotion });
	await serve(page, html);
	await page.goto("http://design.test/fixture");
	await page.evaluate(() => document.fonts.ready);
}

/** Computed properties of each [selector, pseudo] probe. */
function read(page, probes, names) {
	return page.evaluate(
		([probes, names]) =>
			probes.map(([selector, pseudo]) => {
				const element = document.querySelector(selector);
				if (!element) throw new Error(`no ${selector}`);
				const style = getComputedStyle(element, pseudo ?? undefined);
				return Object.fromEntries(
					names.map((name) => [name, style.getPropertyValue(name)]),
				);
			}),
		[probes, names],
	);
}

const frames = (page, count = 2) =>
	page.evaluate(
		(count) =>
			new Promise((resolve) => {
				const step = (left) =>
					left ? requestAnimationFrame(() => step(left - 1)) : resolve();
				step(count);
			}),
		count,
	);

test("each component moves by its term", async ({ page }) => {
	await open(page);
	const control = term("control");

	// A control answers in tone, and its small parts move, on control.
	const controls = [
		["#chip"],
		["#input"],
		["#select"],
		["#textarea"],
		["#switch"],
		["#switch", "::before"],
		["#summary"],
		["#summary", "::after"],
		["#segment"],
		["#tab"],
		["#tab", "::after"],
		["#page"],
		["#nav"],
		["#row"],
	];
	const answers = await read(page, controls, [
		"transition-duration",
		"transition-timing-function",
	]);
	answers.forEach((style, index) => {
		const at = controls[index].join("");
		for (const duration of list(style["transition-duration"])) {
			expect.soft(ms(duration), `${at} duration`).toBe(control.duration);
		}
		for (const easing of list(style["transition-timing-function"])) {
			expect.soft(easing, `${at} curve`).toBe(control.easing);
		}
	});

	// Work in flight loops on its own term for as long as it runs.
	const loops = [
		["#status", "::before", "pulse", "kin-status-pulse"],
		["#marker", null, "pulse", "kin-log-working"],
		["#spinner", "::before", "pass", "kin-spinner-pass"],
		["#skeleton", "::after", "sweep", "kin-skeleton-sweep"],
		["#sweep", null, "sweep", "kin-progress-sweep"],
	];
	const running = await read(
		page,
		loops.map(([selector, pseudo]) => [selector, pseudo]),
		[
			"animation-name",
			"animation-duration",
			"animation-timing-function",
			"animation-iteration-count",
		],
	);
	running.forEach((style, index) => {
		const [selector, pseudo, name, keyframes] = loops[index];
		const at = `${selector}${pseudo ?? ""}`;
		expect.soft(style["animation-name"], at).toBe(keyframes);
		expect
			.soft(ms(style["animation-duration"]), `${at} duration`)
			.toBe(term(name).duration);
		expect
			.soft(list(style["animation-timing-function"])[0], `${at} curve`)
			.toBe(term(name).easing);
		expect.soft(style["animation-iteration-count"], at).toBe("infinite");
	});

	// A determinate fill follows its work on surface. Its pseudo-element
	// computes no style that script can read, so its rule is read instead.
	const fill = await page.evaluate(() => {
		const found = [];
		const visit = (rules) => {
			for (const rule of rules) {
				if (rule instanceof CSSImportRule) {
					if (rule.styleSheet) visit(rule.styleSheet.cssRules);
				} else if (
					rule.selectorText === ".kin-progress::-webkit-progress-value"
				) {
					found.push(rule.style.getPropertyValue("transition"));
				} else if ("cssRules" in rule) visit(rule.cssRules);
			}
		};
		for (const sheet of document.styleSheets) visit(sheet.cssRules);
		return found;
	});
	expect(fill).toEqual(["width var(--kin-motion-surface)"]);

	// Layers arrive on layer, a popover and a tip on popover; a toast
	// leaves on exit, and stays gone.
	const arrivals = await page.evaluate(() => {
		const pick = (element, pseudo) => {
			const style = getComputedStyle(element, pseudo);
			return {
				name: style.animationName,
				duration: style.animationDuration,
				easing: style.animationTimingFunction,
				fill: style.animationFillMode,
			};
		};
		const out = { toast: pick(document.getElementById("toast")) };
		document.getElementById("tip").showPopover();
		out.tip = pick(document.getElementById("tip"));
		for (const id of ["dialog", "drawer", "start", "bottom"]) {
			const layer = document.getElementById(id);
			layer.showModal();
			out[id] = pick(layer);
			out[`${id}::backdrop`] = pick(layer, "::backdrop");
			layer.close();
		}
		document.getElementById("popover").showPopover();
		out.popover = pick(document.getElementById("popover"));
		const toast = document.getElementById("toast");
		toast.toggleAttribute("data-leaving", true);
		out.leaving = pick(toast);
		return out;
	});
	const expected = {
		toast: ["kin-toast-arrive", "layer"],
		tip: ["kin-tooltip-arrive", "popover"],
		dialog: ["kin-layer-arrive", "layer"],
		"dialog::backdrop": ["kin-backdrop-arrive", "layer"],
		drawer: ["kin-drawer-arrive-end", "layer"],
		"drawer::backdrop": ["kin-backdrop-arrive", "layer"],
		start: ["kin-drawer-arrive-start", "layer"],
		"start::backdrop": ["kin-backdrop-arrive", "layer"],
		bottom: ["kin-drawer-arrive-bottom", "layer"],
		"bottom::backdrop": ["kin-backdrop-arrive", "layer"],
		popover: ["kin-layer-arrive", "popover"],
		leaving: ["kin-toast-leave", "exit"],
	};
	for (const [id, [name, motion]] of Object.entries(expected)) {
		const style = arrivals[id];
		expect.soft(style.name, id).toBe(name);
		expect
			.soft(ms(style.duration), `${id} duration`)
			.toBe(term(motion).duration);
		expect.soft(list(style.easing)[0], `${id} curve`).toBe(term(motion).easing);
	}
	expect(arrivals.leaving.fill).toBe("forwards");
});

test("with less motion nothing runs, and each loop keeps its still form", async ({
	page,
}) => {
	await open(page, "reduce");
	await frames(page, 3);
	const loose = await page.evaluate(() =>
		document
			.getAnimations()
			.filter(
				(animation) =>
					animation.playState === "running" ||
					animation.effect?.getTiming().iterations === Infinity,
			)
			.map(
				(animation) => animation.animationName ?? animation.constructor.name,
			),
	);
	expect(loose).toEqual([]);

	const still = await page.evaluate(() => {
		const style = (selector, pseudo) =>
			getComputedStyle(document.querySelector(selector), pseudo);
		const colours = (value) => value.match(/[a-z-]+\([^()]*\)/g) ?? [];
		const spinner = style("#spinner", "::before");
		const status = style("#status", "::before");
		const marker = style("#marker");
		const sweep = style("#sweep");
		const line = (id) => style(`#edge-${id}`);
		const path = document.querySelector(
			"#key .kin-pattern-corner-key__trace path",
		);
		return {
			// Every mark of the pass is lit.
			spinner: {
				lit: spinner.backgroundColor === spinner.color,
				marks: colours(spinner.boxShadow).map(
					(colour) => colour === spinner.color,
				),
			},
			// The skeleton is its plain shape; the bar's band rests in the middle.
			skeleton: style("#skeleton", "::after").display,
			sweep: [sweep.animationName, sweep.backgroundPosition.split(" ")[0]],
			// A pulse's mark stands lit.
			status: [status.animationName, status.opacity, status.transform],
			marker: [marker.animationName, marker.opacity],
			// The live edge's still forms.
			edge: {
				working: [
					line("working").backgroundImage.startsWith("linear-gradient"),
					style("#edge-working", "::before").opacity,
				],
				sparks: [
					line("working-sparks").backgroundImage.startsWith("linear-gradient"),
					style("#edge-working-sparks", "::after").opacity,
				],
				agents: [
					line("agents").backgroundImage.startsWith(
						"repeating-linear-gradient",
					),
					style("#edge-agents", "::after").opacity,
				],
				waiting: [line("waiting").animationName, line("waiting").opacity],
				closing: line("closing").opacity,
				finished: [
					line("finished").animationName,
					line("finished").backgroundSize,
				],
				reconnecting: [
					line("reconnecting").animationName,
					line("reconnecting").opacity,
					line("reconnecting").backgroundImage.startsWith(
						"repeating-linear-gradient",
					),
				],
			},
			// The corner key's light is a whole, still outline.
			key: [
				getComputedStyle(path).strokeDasharray,
				getComputedStyle(path).animationName,
				getComputedStyle(path.ownerSVGElement).opacity,
			],
		};
	});
	expect(still).toEqual({
		spinner: { lit: true, marks: [true, true] },
		skeleton: "none",
		sweep: ["none", "50%"],
		status: ["none", "1", "none"],
		marker: ["none", "1"],
		edge: {
			working: [true, "0"],
			sparks: [true, "0"],
			agents: [true, "0"],
			waiting: ["none", "1"],
			closing: "0",
			finished: ["none", "100% 100%"],
			reconnecting: ["none", "1", true],
		},
		key: ["none", "none", "1"],
	});
});

test("every arrival is from-only, and the toast's leave to-only", async ({
	page,
}) => {
	await open(page);
	const keyframes = await page.evaluate(() => {
		const found = {};
		const visit = (rules) => {
			for (const rule of rules) {
				if (rule instanceof CSSImportRule) {
					if (rule.styleSheet) visit(rule.styleSheet.cssRules);
				} else if (rule instanceof CSSKeyframesRule) {
					found[rule.name] = [...rule.cssRules].map((frame) => frame.keyText);
				} else if ("cssRules" in rule) visit(rule.cssRules);
			}
		};
		for (const sheet of document.styleSheets) visit(sheet.cssRules);
		return found;
	});
	for (const name of [
		"kin-layer-arrive",
		"kin-backdrop-arrive",
		"kin-drawer-arrive-end",
		"kin-drawer-arrive-start",
		"kin-drawer-arrive-bottom",
		"kin-toast-arrive",
		"kin-tooltip-arrive",
	]) {
		expect.soft(keyframes[name], name).toEqual(["0%"]);
	}
	expect(keyframes["kin-toast-leave"]).toEqual(["100%"]);
});

for (const action of ["finish", "cancel"]) {
	test(`with every animation ${action === "finish" ? "finished" : "cancelled"}, an open layer stands whole`, async ({
		page,
	}) => {
		await open(page);
		const layers = await page.evaluate((action) => {
			document.getElementById("dialog").showModal();
			document.getElementById("drawer").showModal();
			document.getElementById("popover").showPopover();
			// A loop has no end to finish at; cancelling takes every animation.
			document
				.getAnimations()
				.filter(
					(animation) =>
						action === "cancel" ||
						animation.effect.getComputedTiming().endTime !== Infinity,
				)
				.forEach((animation) => animation[action]());
			const pick = (element, pseudo) => {
				const style = getComputedStyle(element, pseudo);
				return [style.opacity, style.translate];
			};
			const dialog = document.getElementById("dialog");
			return {
				dialog: pick(dialog),
				backdrop: pick(dialog, "::backdrop"),
				drawer: pick(document.getElementById("drawer")),
				popover: pick(document.getElementById("popover")),
				toast: pick(document.getElementById("toast")),
			};
		}, action);
		for (const [name, state] of Object.entries(layers)) {
			expect.soft(state, name).toEqual(["1", "none"]);
		}
	});
}

/** Opens a layer, lets its arrival end, closes it and reads the close. */
function closing(page, id) {
	return page.evaluate(async (id) => {
		const frame = () =>
			new Promise((resolve) => requestAnimationFrame(() => resolve()));
		const layer = document.getElementById(id);
		const dialog = layer instanceof HTMLDialogElement;
		document.getElementById("opener").focus();
		if (dialog) layer.showModal();
		else layer.showPopover();
		const opening = layer
			.getAnimations({ subtree: true })
			.filter((animation) => "transitionProperty" in animation).length;
		layer
			.getAnimations({ subtree: true })
			.forEach((animation) => animation.finish());
		await frame();
		await frame();
		const box = layer.getBoundingClientRect();
		const centre = [box.left + box.width / 2, box.top + box.height / 2];
		if (dialog) layer.close();
		else layer.hidePopover();
		const style = getComputedStyle(layer);
		const exits = layer.getAnimations({ subtree: true }).map((animation) => ({
			property: animation.transitionProperty ?? animation.animationName,
			pseudo: animation.effect.pseudoElement || null,
			duration: animation.effect.getTiming().duration,
			easing: animation.effect.getTiming().easing,
		}));
		const inside = layer.querySelector("button");
		inside.focus();
		const read = {
			supports: CSS.supports("overlay", "auto"),
			opening,
			modal: layer.matches(":modal") || !!document.querySelector(":modal"),
			display: style.display,
			focus: document.activeElement?.id,
			reached: document.activeElement === inside,
			exits,
		};
		// A frame into the exit, where a press would land: whatever takes the
		// pointer at the layer's centre, the layer or its backdrop included.
		await frame();
		read.shown = getComputedStyle(layer).display !== "none";
		read.taken = layer.contains(document.elementFromPoint(...centre));
		await Promise.all(
			layer
				.getAnimations({ subtree: true })
				.map((animation) => animation.finished.catch(() => {})),
		);
		await frame();
		read.after = getComputedStyle(layer).display;
		read.closed = getComputedStyle(layer).translate;
		return read;
	}, id);
}

const closedAt = {
	dialog: "0px 4px",
	popover: "0px 4px",
	drawer: "12px",
	start: "-12px",
	bottom: "0px 12px",
};

for (const id of Object.keys(closedAt)) {
	test(`${id}: leaves the way it came, faster, where the browser can keep it in the top layer`, async ({
		page,
	}) => {
		await open(page);
		const read = await closing(page, id);
		const exit = term("exit");
		// Opening runs its arrival alone: there is no style to move from.
		expect(read.opening).toBe(0);
		// Modality and focus move as the exit starts, and the page beneath
		// takes the pointer while the layer goes.
		expect(read.modal).toBe(false);
		expect(read.reached).toBe(false);
		expect(read.after).toBe("none");
		if (!read.supports) {
			// Without overlay it closes at once, with nothing left to run.
			expect(read.display).toBe("none");
			expect(read.exits).toEqual([]);
			return;
		}
		expect(read.display).not.toBe("none");
		expect([read.shown, read.taken]).toEqual([true, false]);
		const moving = read.exits.filter((exit) =>
			["opacity", "translate"].includes(exit.property),
		);
		const expected = [
			{ property: "opacity", pseudo: null },
			{ property: "translate", pseudo: null },
			...(id === "popover"
				? []
				: [{ property: "opacity", pseudo: "::backdrop" }]),
		];
		expect(
			moving.map(({ property, pseudo }) => ({ property, pseudo })),
		).toEqual(expect.arrayContaining(expected));
		expect(moving).toHaveLength(expected.length);
		for (const { property, pseudo, duration, easing } of moving) {
			const at = `${property}${pseudo ?? ""}`;
			expect.soft(duration, at).toBe(exit.duration);
			expect.soft(compact(easing), at).toBe(exit.easing);
		}
		for (const property of ["display", "overlay"]) {
			expect
				.soft(
					read.exits.find((exit) => exit.property === property)?.duration,
					property,
				)
				.toBe(exit.duration);
		}
		// Half its arrival's distance.
		expect(read.closed).toBe(closedAt[id]);
	});
}

test("a drawer leaves toward its own edge right to left", async ({ page }) => {
	await open(
		page,
		"no-preference",
		fixture.replace('<html lang="en">', '<html lang="en" dir="rtl">'),
	);
	const supports = await page.evaluate(() => CSS.supports("overlay", "auto"));
	test.skip(!supports, "closes at once without overlay");
	expect((await closing(page, "drawer")).closed).toBe("-12px");
	expect((await closing(page, "start")).closed).toBe("12px");
});

test("opened again while it leaves, a dialog runs its arrival alone", async ({
	page,
}) => {
	await open(page);
	const read = await page.evaluate(async () => {
		const frame = () =>
			new Promise((resolve) => requestAnimationFrame(() => resolve()));
		const dialog = document.getElementById("dialog");
		dialog.showModal();
		dialog
			.getAnimations({ subtree: true })
			.forEach((animation) => animation.finish());
		await frame();
		dialog.close();
		await frame();
		dialog.showModal();
		const running = dialog
			.getAnimations({ subtree: true })
			.map(
				(animation) => animation.transitionProperty ?? animation.animationName,
			);
		await Promise.all(
			dialog
				.getAnimations({ subtree: true })
				.map((animation) => animation.finished),
		);
		return {
			running,
			modal: dialog.matches(":modal"),
			opacity: getComputedStyle(dialog).opacity,
			focus: document.activeElement?.id,
		};
	});
	expect({ ...read, running: read.running.sort() }).toEqual({
		running: ["kin-backdrop-arrive", "kin-layer-arrive"],
		modal: true,
		opacity: "1",
		focus: "inside",
	});
});

test("with less motion every layer closes at once", async ({ page }) => {
	await open(page, "reduce");
	for (const id of Object.keys(closedAt)) {
		const read = await closing(page, id);
		expect.soft(read.modal, id).toBe(false);
		expect.soft(read.display, id).toBe("none");
		expect.soft(read.exits, id).toEqual([]);
		expect.soft(read.focus, id).toBe("opener");
	}
});

test("a leaving toast still says it has gone with less motion", async ({
	page,
}) => {
	await open(page, "reduce");
	const ended = await page.evaluate(
		() =>
			new Promise((resolve) => {
				const toast = document.getElementById("toast");
				const timer = setTimeout(() => resolve("no animationend"), 2000);
				toast.addEventListener("animationend", (event) => {
					clearTimeout(timer);
					resolve(event.animationName);
				});
				toast.toggleAttribute("data-leaving", true);
			}),
	);
	expect(ended).toBe("kin-toast-leave");
});

const shell = `<!doctype html><html lang="en"><head>
<link rel="stylesheet" href="/src/styles/index.css">
</head><body>
<div class="kin-shell" data-drawer="closed">
	<aside class="kin-shell__sidebar" inert><nav class="kin-shell__pages"><ul><li><a class="kin-shell__item" id="first" href="#first">First</a></li></ul></nav></aside>
	<button class="kin-shell__backdrop" type="button" aria-label="Close"></button>
	<div class="kin-shell__panel"><header class="kin-shell__bar"><button class="kin-shell__menu" type="button">Menu</button></header><main class="kin-shell__page">Page</main></div>
</div>
</body></html>`;

test("the shell drawer arrives at layer speed and leaves at exit speed", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await open(page, "no-preference", shell);
	const timing = () =>
		read(
			page,
			[[".kin-shell__sidebar"], [".kin-shell__backdrop"]],
			[
				"transition-property",
				"transition-duration",
				"transition-timing-function",
				"transition-delay",
			],
		);
	const [layer, exit] = [term("layer"), term("exit")];
	// Every property moves on the term but visibility, which flips once its
	// delay has passed.
	const moves = (style, motion, hides) => {
		const durations = list(style["transition-duration"]).map(ms);
		const easings = list(style["transition-timing-function"]);
		const delays = list(style["transition-delay"]).map(ms);
		expect(durations.slice(0, -1)).toEqual(
			durations.slice(0, -1).map(() => motion.duration),
		);
		expect(easings.slice(0, -1)).toEqual(
			easings.slice(0, -1).map(() => motion.easing),
		);
		expect([durations.at(-1), delays.at(-1)]).toEqual([0, hides]);
	};
	const [sidebar, backdrop] = await timing();
	expect(sidebar["transition-property"]).toBe(
		"translate, box-shadow, visibility",
	);
	expect(backdrop["transition-property"]).toBe("opacity, visibility");
	// Closing, they go on exit and hide once gone.
	moves(sidebar, exit, exit.duration);
	moves(backdrop, exit, exit.duration);
	await page.evaluate(() => {
		document.querySelector(".kin-shell").dataset.drawer = "open";
	});
	// Opening, they show at once and arrive on layer.
	const [openSidebar, openBackdrop] = await timing();
	moves(openSidebar, layer, 0);
	moves(openBackdrop, layer, 0);
});

const engine = (tokens = true) => `<!doctype html><html lang="en"><head>
${tokens ? '<link rel="stylesheet" href="/src/styles/index.css">' : ""}
<link rel="stylesheet" href="/registry/patterns/corner-key/corner-key.css">
</head><body><div style="display: flex">${keySource.replace('data-face="rest"', 'data-face="rest" id="key"')}</div></body></html>`;

/** Starts the engine on the key. */
const start = (page) =>
	page.evaluate(async () => {
		const { KeyEngine } =
			await import("/registry/patterns/corner-key/corner-key.js");
		window.engine = new KeyEngine(document.getElementById("key"), "rest");
	});

/** Shows a face and reads the timing of the movements the engine made. */
function show(page, face, how = {}, before = "") {
	return page.evaluate(
		([face, how, before]) => {
			const key = document.getElementById("key");
			if (before === "sent") window.engine.expectSent();
			window.engine.set(face, how);
			const parts = {};
			for (const animation of key.getAnimations({ subtree: true })) {
				// The engine's own, not the CSS on the same elements.
				if ("animationName" in animation || "transitionProperty" in animation)
					continue;
				const target = animation.effect.target;
				const part = ["fill", "flash", "glyph"].find((name) =>
					target.matches(`.kin-pattern-corner-key__${name}`),
				);
				const { duration, easing } = animation.effect.getTiming();
				const curves = animation.effect
					.getKeyframes()
					.slice(0, -1)
					.map((frame) => frame.easing);
				(parts[part ?? "stroke"] ??= []).push({ duration, easing, curves });
			}
			return parts;
		},
		[face, how, before],
	);
}

test("the corner key moves by the terms on its tokens", async ({ page }) => {
	await open(page, "no-preference", engine());
	await start(page);
	const [bloom, morph, standard] = [
		term("bloom"),
		term("morph"),
		curve("standard"),
	];
	const same = (parts, part, duration, easing) => {
		expect(parts[part]?.length, part).toBeGreaterThan(0);
		for (const move of parts[part]) {
			expect.soft(move.duration, part).toBe(duration);
			expect.soft(compact(move.easing), part).toBe(easing);
		}
	};

	// A fill blooms on bloom; a change of icon morphs on morph.
	const woke = await show(page, "send");
	same(woke, "fill", bloom.duration, bloom.easing);
	const queued = await show(page, "queue");
	same(queued, "stroke", morph.duration, morph.easing);

	// Between a line and the solid Stop the strokes fold through the spine,
	// on the standard curve and then morph's.
	const sent = await show(page, "working", { turn: true }, "sent");
	expect(sent.stroke.length).toBeGreaterThan(0);
	for (const move of sent.stroke) {
		expect.soft(move.curves.map(compact)).toEqual([standard, morph.easing]);
	}

	// The deprecated tokens no longer move it: their timing is the key's own.
	const lifted = sent.fill[0];
	const spine = sent.stroke[0].duration;
	await page.evaluate(() => {
		const key = document.getElementById("key");
		for (const name of ["retract", "lift", "fold"])
			key.style.setProperty(`--kin-duration-${name}`, "999ms");
		key.style.setProperty("--kin-ease-lift", "linear");
		window.engine.resize();
	});
	await show(page, "send");
	const again = await show(page, "working", { turn: true }, "sent");
	expect(again.fill[0]).toEqual(lifted);
	expect(again.stroke[0].duration).toBe(spine);
	const retracted = await show(page, "rest", { turn: false });
	expect.soft(retracted.fill?.[0].duration).not.toBe(999);
	expect.soft(retracted.fill?.[0].easing).not.toBe("linear");

	// A calibration of a term reaches the key when it measures: on resize,
	// and when the reduced-motion preference changes.
	await page.evaluate(() => {
		const key = document.getElementById("key");
		key.style.setProperty("--kin-duration-bloom", "520ms");
		window.engine.resize();
		key.style.setProperty("--kin-duration-morph", "640ms");
	});
	same(await show(page, "send"), "fill", 520, bloom.easing);
	// The preference is read once a frame, so each change gets its own.
	await page.emulateMedia({ reducedMotion: "reduce" });
	await frames(page);
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await frames(page);
	same(await show(page, "queue"), "stroke", 640, morph.easing);
});

test("the corner key will not move without the tokens", async ({ page }) => {
	await open(page, "no-preference", engine(false));
	const error = await page.evaluate(async () => {
		const { KeyEngine } =
			await import("/registry/patterns/corner-key/corner-key.js");
		try {
			new KeyEngine(document.getElementById("key"), "rest");
			return "";
		} catch (error) {
			return String(error.message);
		}
	});
	expect(error).toContain("tokens.css");
});
