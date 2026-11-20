import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
	copyFileSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
	checkCss,
	checkSource,
	curveOf,
	loadDesign,
	readDeprecated,
	readMotion,
} from "../../tools/check-motion.mjs";

const repoFile = (file) =>
	fileURLToPath(new URL(`../../${file}`, import.meta.url));
const TOOL = repoFile("tools/check-motion.mjs");
const TOKENS = repoFile("src/styles/tokens.css");
const design = loadDesign();

const format = ({ line, column, message, severity }) =>
	`${line}:${column} ${severity === "warning" ? "warning: " : ""}${message}`;

/** Each problem as "line:column message", a warning marked as one. */
function problems(css, options = {}) {
	return checkCss(css, { ...design, ...options }).problems.map(format);
}

const strict = (css, options = {}) =>
	problems(css, { ...options, strict: true });

/** Each problem in a component file, in the file's lines and columns. */
function inFile(source, file, options = {}) {
	return checkSource(source, file, { ...design, ...options }).problems.map(
		format,
	);
}

// The real defects the check exists for.
const RELAY =
	".a { transition: background-color var(--kin-motion-control, 120ms) ease; }";
const PROBE = ".probe { transition: opacity 0.35s ease-out; }";
const OTHER =
	".other { animation: draw var(--motion-draw) var(--motion-draw-ease) 120ms both }";
const SPIN = [
	"<script>",
	"  let { busy } = $props();",
	"</script>",
	"<span class:busy></span>",
	"<style>",
	"  @keyframes svelte-probe-spin {",
	"    to { rotate: 1turn; }",
	"  }",
	"  .busy { animation: svelte-probe-spin var(--kin-motion-pass) infinite; }",
	"</style>",
].join("\n");
const SETTLE = [
	"<li>{post.text}</li>",
	"<style>",
	"  li { animation: settle var(--kin-motion-appear) both; }",
	"  @keyframes settle { from { opacity: 0; translate: 0 0.25rem } }",
	"</style>",
].join("\n");
const CORRECT = ".a { transition: opacity var(--kin-motion-appear); }";

describe("Design's motion", () => {
	test("comes from Design's own tokens.css, in every register", () => {
		const { terms } = design.motion;
		const pairs = (term) =>
			terms.get(term).map(({ ms, curve }) => `${ms} ${curve}`);
		assert.equal(terms.size, 16, "every term but stagger is a pair");
		assert.ok(!terms.has("stagger"));
		assert.deepEqual(pairs("control"), ["120 cubic-bezier(0.4,0,0.2,1)"]);
		assert.deepEqual(pairs("exit"), ["180 cubic-bezier(0.7,0,0.84,0)"]);
		assert.deepEqual(pairs("appear"), [
			"180 cubic-bezier(0.16,1,0.3,1)",
			"360 cubic-bezier(0.16,1,0.3,1)",
		]);
		assert.deepEqual(pairs("settle"), [
			"0 cubic-bezier(0.16,1,0.3,1)",
			"1400 cubic-bezier(0.16,1,0.3,1)",
		]);
		assert.deepEqual(pairs("trace"), ["1600 linear"]);
		assert.deepEqual(pairs("pass"), ["1050 steps(1,end)"]);
	});

	test("has the scale, and the delays a literal may take", () => {
		const { scale, delays, durations } = design.motion;
		assert.deepEqual(
			scale.map(({ name, ms }) => `${name} ${ms}`),
			[
				"--kin-duration-fast 120",
				"--kin-duration-normal 180",
				"--kin-duration-slow 320",
				"--kin-duration-deliberate 480",
			],
		);
		assert.deepEqual(durations.get("--kin-duration-stagger"), [0, 45]);
		for (const ms of [45, 120, 260, 300, 1400, 1800]) {
			assert.ok(delays.includes(ms), `${ms}ms`);
		}
		// The deprecated retract and fold keep their values, but not as delays.
		assert.ok(!delays.includes(200) && !delays.includes(400));
	});

	test("names the shared arrivals and every motion name", () => {
		const { arrivals, names } = design.motion;
		assert.deepEqual(arrivals, ["kin-fade", "kin-appear", "kin-draw"]);
		assert.ok(names.has("--kin-motion-navigate"));
		assert.ok(names.has("--kin-duration-stagger"));
		assert.ok(names.has("--kin-ease-lift"));
		assert.ok(!names.has("--kin-motion-stagger"));
	});

	test("takes the deprecated tokens from docs/motion.md", () => {
		const { deprecated } = design.motion;
		assert.deepEqual(
			[...deprecated.keys()],
			[
				"--kin-duration-retract",
				"--kin-duration-lift",
				"--kin-duration-fold",
				"--kin-ease-lift",
			],
		);
		assert.equal(deprecated.get("--kin-ease-lift"), "--kin-ease-in");
		assert.throws(() => readDeprecated("# Motion\n"), /no motion:deprecated/);
	});

	test("resolves each register as the browser does", () => {
		const motion = readMotion(`:root {
			--kin-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
			--kin-duration-fast: 120ms;
			--kin-duration-control: var(--kin-duration-fast);
			--kin-motion-control: var(--kin-duration-control) linear;
			--kin-duration-pinned: 200ms;
			--kin-motion-pinned: var(--kin-duration-pinned) var(--kin-ease-out);
		}
		:root, [data-kin-motion="calm"] { --kin-duration-appear: 200ms; }
		[data-kin-motion="lively"] {
			--kin-duration-appear: 400ms;
			--kin-duration-pinned: 900ms;
		}
		@media (prefers-reduced-motion: reduce) {
			:root, [data-kin-motion] { --kin-duration-appear: 0ms; }
		}
		:root, [data-kin-motion] {
			--kin-motion-appear: var(--kin-duration-appear) var(--kin-ease-out);
		}`);
		const pairs = (term) =>
			motion.terms.get(term).map(({ ms, curve }) => `${ms} ${curve}`);
		assert.deepEqual(pairs("control"), ["120 linear"]);
		assert.deepEqual(pairs("appear"), [
			"200 cubic-bezier(0.16,1,0.3,1)",
			"400 cubic-bezier(0.16,1,0.3,1)",
		]);
		// A pair declared only on the root inherits the root's duration.
		assert.deepEqual(pairs("pinned"), ["200 cubic-bezier(0.16,1,0.3,1)"]);
		assert.deepEqual(motion.durations.get("--kin-duration-pinned"), [200, 900]);
		assert.deepEqual(
			motion.scale.map(({ name }) => name),
			["--kin-duration-fast"],
		);
	});

	test("refuses tokens without a pair", () => {
		assert.throws(
			() => readMotion(":root { --kin-duration-fast: 120ms; }"),
			/no --kin-motion-\* pair/,
		);
	});

	test("reads a curve however it is written", () => {
		assert.equal(curveOf("ease-out"), curveOf("cubic-bezier(0, 0, 0.58, 1)"));
		assert.equal(
			curveOf("cubic-bezier(.16,1,.3,1)"),
			curveOf("cubic-bezier(0.16, 1, 0.30, 1)"),
		);
		for (const steps of ["steps(1)", "steps(1, jump-end)", "step-end"]) {
			assert.equal(curveOf(steps), curveOf("steps(1, end)"), steps);
		}
		assert.equal(curveOf("cubic-bezier(0, 0, 1, 1)"), "linear");
		assert.equal(curveOf("linear(0, 1)"), "linear");
		assert.notEqual(curveOf("ease"), curveOf("ease-in-out"));
	});
});

describe("literal timings by default", () => {
	test("Observatory's probe: a literal pair no term takes fails", () => {
		assert.deepEqual(problems(PROBE), [
			"1:30 transition: opacity 0.35s ease-out has 0.35s ease-out, no term's timing (use var(--kin-motion-<term>) for what moves)",
		]);
	});

	test("pass when together they are a term's pair, read numerically", () => {
		assert.deepEqual(
			problems(`.a {
				transition: opacity 180ms cubic-bezier(0.16, 1, 0.3, 1);
				transition: opacity 0.18s cubic-bezier(.16,1,.3,1);
				animation: kin-appear 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
				animation: kin-spinner 1.05s steps(1, end) infinite;
				animation: kin-trace 1.6s linear infinite;
				animation: kin-pulse 1.8s var(--kin-ease-standard) infinite;
				transition: translate var(--kin-duration-layer) cubic-bezier(0.16, 1, 0.3, 1);
			}`),
			[],
		);
	});

	test("a duration without a curve takes the browser's ease", () => {
		assert.deepEqual(problems(".a { transition: opacity 180ms; }"), [
			"1:26 transition: opacity 180ms has 180ms with the browser's ease, no term's timing (use var(--kin-motion-surface), var(--kin-motion-popover), var(--kin-motion-exit) or var(--kin-motion-appear))",
		]);
	});

	test("a curve by hand beside a duration token names the token's term", () => {
		assert.deepEqual(
			problems(`.a {
				transition: color var(--kin-duration-fast) ease;
				transition: translate var(--kin-duration-appear) ease-out;
			}`),
			[
				"2:48 transition: color var(--kin-duration-fast) ease has ease, no term's timing (use var(--kin-motion-control))",
				"3:54 transition: translate var(--kin-duration-appear) ease-out has ease-out, no term's timing (use var(--kin-motion-appear))",
			],
		);
	});

	test("a duration by hand beside a curve token names the nearest pair with that curve", () => {
		assert.deepEqual(
			problems(
				".a { animation: kin-progress-sweep 1.4s var(--kin-ease-standard) infinite; }",
			),
			[
				"1:36 animation: kin-progress-sweep 1.4s var(--kin-ease-standard) infinite has 1.4s, no term's timing (nearest var(--kin-motion-sweep))",
			],
		);
		// Near is within a factor of two: a 160ms change is not a 1.6s loop.
		assert.deepEqual(problems(".a { transition: color 160ms linear; }"), [
			"1:24 transition: color 160ms linear has 160ms linear, no term's timing (use var(--kin-motion-<term>) for what moves)",
		]);
	});

	test("Observatory's probe: a delay on the scale passes", () => {
		assert.deepEqual(problems(OTHER), []);
		assert.deepEqual(
			problems(`.a {
				transition: opacity var(--kin-motion-appear) 120ms;
				animation-delay: 45ms, 1.4s;
				transition-delay: 100ms;
				animation-delay: 200ms;
				animation-delay: -0.5s;
			}`),
			[
				"4:23 transition-delay: 100ms has 100ms, a delay off the scale (nearest var(--kin-duration-fast))",
				"5:22 animation-delay: 200ms has 200ms, a delay off the scale (nearest var(--kin-duration-normal) or var(--kin-duration-slow))",
				"6:22 animation-delay: -0.5s has -0.5s, a delay off the scale (a phase comes from the clock, or is a signature)",
			],
		);
	});

	test("zero, under a millisecond, none and tokens always pass", () => {
		assert.deepEqual(
			problems(`.a {
				transition: opacity var(--kin-motion-control), visibility 0s var(--kin-duration-fast);
				transition-delay: 0s, var(--kin-duration-fast);
				animation-duration: 0.01ms;
				transition: none;
				animation: kin-appear var(--kin-motion-appear) calc(var(--i) * var(--kin-duration-stagger)) both;
				animation-timing-function: var(--kin-ease-out);
			}`),
			[],
		);
	});

	test("a product's own property set nowhere it can see is set aside", () => {
		assert.deepEqual(
			problems(`.a { transition: opacity var(--relay-motion, 0.35s ease-out); }
			.b { transition: opacity var(--relay-duration) var(--relay-ease); }`),
			[],
		);
	});

	test("longhands and @keyframes take a term's duration or curve", () => {
		assert.deepEqual(
			problems(`.a {
				animation-duration: 1.6s;
				animation-duration: 0.7s;
				transition-timing-function: steps(1, end);
				transition-timing-function: ease;
			}
			@keyframes breathe {
				50% { animation-timing-function: ease-in-out; opacity: 0.5; }
			}`),
			[
				"3:25 animation-duration: 0.7s has 0.7s, no term's duration (use var(--kin-duration-<term>) for what moves)",
				"5:33 transition-timing-function: ease has ease, no term's curve (use var(--kin-ease-<curve>) for its path)",
				"8:38 animation-timing-function: ease-in-out has ease-in-out, no term's curve (use var(--kin-ease-<curve>) for its path)",
			],
		);
	});

	test("a computed time counts each number written in it", () => {
		assert.deepEqual(
			problems(`.a {
				animation: rise var(--kin-motion-appear) calc(var(--i) * 45ms) both;
				animation: rise var(--kin-motion-appear) calc(var(--i) * 50ms) both;
			}`),
			[
				"3:62 animation: rise var(--kin-motion-appear) calc(var(--i) * 50ms) both has 50ms, a delay off the scale (nearest var(--kin-duration-fast))",
			],
		);
	});
});

describe("literal timings with --strict", () => {
	test("any literal time but zero, and any literal curve, fails and names the token", () => {
		assert.deepEqual(
			strict(`.a {
				transition: opacity 180ms cubic-bezier(0.16, 1, 0.3, 1);
				animation: kin-status-pulse 1.8s var(--kin-ease-standard) infinite;
				transition: color var(--kin-duration-fast) ease;
				transition-timing-function: cubic-bezier(0.7, 0, 0.84, 0);
				animation-timing-function: linear;
				animation-duration: 1.6s;
			}`),
			[
				"2:25 transition: opacity 180ms cubic-bezier(0.16, 1, 0.3, 1) has 180ms cubic-bezier(0.16, 1, 0.3, 1), a literal timing (use var(--kin-motion-surface), var(--kin-motion-popover) or var(--kin-motion-appear))",
				"3:33 animation: kin-status-pulse 1.8s var(--kin-ease-standard) infinite has 1.8s, a literal duration (use var(--kin-motion-pulse))",
				"4:48 transition: color var(--kin-duration-fast) ease has ease, a literal curve (use var(--kin-motion-control))",
				"5:33 transition-timing-function: cubic-bezier(0.7, 0, 0.84, 0) has cubic-bezier(0.7, 0, 0.84, 0), a literal curve (use var(--kin-ease-in))",
				"6:32 animation-timing-function: linear has linear, a literal curve (var(--kin-motion-trace) carries it)",
				"7:25 animation-duration: 1.6s has 1.6s, a literal duration (use var(--kin-duration-trace) or var(--kin-duration-sweep))",
			],
		);
	});

	test("Observatory's probes both fail", () => {
		assert.deepEqual(strict(PROBE), [
			"1:30 transition: opacity 0.35s ease-out has 0.35s ease-out, a literal timing (use var(--kin-motion-<term>) for what moves)",
		]);
		assert.deepEqual(strict(OTHER), [
			"1:69 animation: draw var(--motion-draw) var(--motion-draw-ease) 120ms both has 120ms, a literal delay (use var(--kin-duration-fast))",
		]);
	});

	test("a literal delay names the scale step or the term's duration", () => {
		assert.deepEqual(
			strict(`.a {
				transition-delay: 0s, 320ms;
				animation: rise var(--kin-motion-appear) calc(var(--i) * 45ms) both;
			}`),
			[
				"2:27 transition-delay: …, 320ms has 320ms, a literal delay (use var(--kin-duration-slow))",
				"3:62 animation: rise var(--kin-motion-appear) calc(var(--i) * 45ms) both has 45ms, a literal delay (use var(--kin-duration-stagger))",
			],
		);
	});

	test("the correct use passes", () => {
		const uses = `${CORRECT}
		.b {
			transition: opacity var(--kin-motion-control), visibility 0s var(--kin-duration-fast);
			transition-delay: var(--kin-duration-normal);
			animation: kin-appear var(--kin-motion-appear) calc(var(--i) * var(--kin-duration-stagger)) both;
			animation-timing-function: var(--kin-ease-out);
			animation-duration: 0.01ms;
			transition: none;
		}`;
		assert.deepEqual(problems(uses), []);
		assert.deepEqual(strict(uses), []);
	});
});

describe("broken pairs", () => {
	test("Relay's real bug: a curve after the pair, and a dead fallback", () => {
		const found = [
			"1:61 transition: background-color var(--kin-motion-control, 120ms) ease has 120ms, a dead fallback: Kinra Design defines --kin-motion-control",
			"1:68 transition: background-color var(--kin-motion-control, 120ms) ease has ease after var(--kin-motion-control), a broken pair: the pair carries its own curve, so the declaration is invalid and the browser drops it",
		];
		assert.deepEqual(problems(RELAY), found);
		assert.deepEqual(strict(RELAY), found);
	});

	test("another curve before or after the pair, or another pair", () => {
		assert.deepEqual(
			problems(`.a {
				transition: opacity var(--kin-motion-control) var(--kin-ease-out);
				transition: opacity ease var(--kin-motion-control);
				transition: opacity var(--kin-motion-control) var(--kin-motion-surface);
			}`),
			[
				"2:51 transition: opacity var(--kin-motion-control) var(--kin-ease-out) has var(--kin-ease-out) after var(--kin-motion-control), a broken pair: the pair carries its own curve, so the declaration is invalid and the browser drops it",
				"3:25 transition: opacity ease var(--kin-motion-control) has ease before var(--kin-motion-control), a broken pair: the pair carries its own curve, so the declaration is invalid and the browser drops it",
				"4:51 transition: opacity var(--kin-motion-control) var(--kin-motion-surface) has var(--kin-motion-surface) after var(--kin-motion-control), a broken pair: the pair carries its own curve, so the declaration is invalid and the browser drops it",
			],
		);
	});

	test("a time before the pair, or a second time after it", () => {
		assert.deepEqual(
			problems(`.a {
				transition: opacity 200ms var(--kin-motion-control);
				transition: opacity var(--kin-motion-control) 1s 2s;
				transition: opacity var(--kin-motion-control) var(--kin-duration-fast);
			}`),
			[
				"2:25 transition: opacity 200ms var(--kin-motion-control) has 200ms before var(--kin-motion-control), so it is read as the duration and the pair's own duration as the delay",
				"3:54 transition: opacity var(--kin-motion-control) 1s 2s has 2s, a third time beside var(--kin-motion-control), so the declaration is invalid and the browser drops it",
			],
		);
	});

	test("two curves or three times without a pair", () => {
		assert.deepEqual(
			problems(`.a {
				transition: opacity 120ms ease var(--kin-ease-out);
				transition: opacity var(--kin-duration-fast) 0s 1s;
			}`),
			[
				"2:36 transition: opacity 120ms ease var(--kin-ease-out) has var(--kin-ease-out), a second curve, so the declaration is invalid and the browser drops it",
				"3:53 transition: opacity var(--kin-duration-fast) 0s 1s has 1s, a third time, so the declaration is invalid and the browser drops it",
			],
		);
	});

	test("a token in a longhand that cannot take it", () => {
		assert.deepEqual(
			problems(`.a {
				transition-duration: var(--kin-motion-control);
				transition-timing-function: var(--kin-motion-control);
				animation-timing-function: var(--kin-duration-fast);
				transition-delay: var(--kin-ease-out);
			}`),
			[
				"2:26 transition-duration: var(--kin-motion-control) has var(--kin-motion-control), a pair where only a duration goes, so the declaration is invalid and the browser drops it (use var(--kin-duration-control))",
				"3:33 transition-timing-function: var(--kin-motion-control) has var(--kin-motion-control), a pair where only a curve goes, so the declaration is invalid and the browser drops it (use var(--kin-ease-standard))",
				"4:32 animation-timing-function: var(--kin-duration-fast) has var(--kin-duration-fast), a duration where only a curve goes, so the declaration is invalid and the browser drops it",
				"5:23 transition-delay: var(--kin-ease-out) has var(--kin-ease-out), a curve where only a time goes, so the declaration is invalid and the browser drops it",
			],
		);
	});

	test("each comma-separated item is its own", () => {
		assert.deepEqual(
			problems(
				".a { transition: opacity var(--kin-motion-appear), translate var(--kin-duration-layer) var(--kin-ease-out); }",
			),
			[],
		);
	});
});

describe("motion names", () => {
	test("an unknown name fails in both modes, with what was meant", () => {
		const css = `.a {
			transition: opacity var(--kin-motion-setle);
			animation-delay: calc(var(--i) * var(--kin-motion-stagger));
			transition-timing-function: var(--kin-ease-snappy);
		}`;
		const found = [
			"2:28 transition: opacity var(--kin-motion-setle) uses --kin-motion-setle, which Kinra Design does not define (did you mean --kin-motion-settle?)",
			"3:41 animation-delay: calc(var(--i) * var(--kin-motion-stagger)) uses --kin-motion-stagger, which Kinra Design does not define (did you mean --kin-duration-stagger?)",
			"4:36 transition-timing-function: var(--kin-ease-snappy) uses --kin-ease-snappy, which Kinra Design does not define (its terms are in docs/motion.md)",
		];
		assert.deepEqual(problems(css), found);
		assert.deepEqual(strict(css), found);
	});

	test("a name set, as well as read, must be Design's", () => {
		assert.deepEqual(
			problems(
				"@media (prefers-reduced-motion: no-preference) { [data-kin-motion] { --kin-duration-apear: 900ms; } }",
			),
			[
				"1:70 --kin-duration-apear: 900ms sets --kin-duration-apear, which Kinra Design does not define (did you mean --kin-duration-appear?)",
			],
		);
	});

	test("a product's own names are its own", () => {
		assert.deepEqual(
			strict(`:root { --relay-motion: var(--kin-motion-appear); }
			.a { transition: opacity var(--relay-motion); animation: x var(--motion-draw); }`),
			[],
		);
	});

	test("a deprecated token warns, and fails with --strict", () => {
		const css =
			".a { transition: opacity var(--kin-duration-lift) var(--kin-ease-lift); }";
		const found = [
			"1:30 transition: opacity var(--kin-duration-lift) var(--kin-ease-lift) uses --kin-duration-lift, which is deprecated (use instead: exit, toward where the thing went)",
			"1:55 transition: opacity var(--kin-duration-lift) var(--kin-ease-lift) uses --kin-ease-lift, which is deprecated (use instead: --kin-ease-in)",
		];
		assert.deepEqual(
			problems(css),
			found.map((line) => line.replace(" ", " warning: ")),
		);
		assert.deepEqual(strict(css), found);
	});

	test("a fallback on Design's token never applies", () => {
		assert.deepEqual(
			problems(`:root {
				--relay-enter: var(--kin-duration-appear, 180ms);
				--relay-leave: var(--relay-exit, 120ms);
			}`),
			[
				"2:47 --relay-enter: var(--kin-duration-appear, 180ms) has 180ms, a dead fallback: Kinra Design defines --kin-duration-appear",
			],
		);
	});

	test("comments and strings do not count", () => {
		assert.deepEqual(
			problems(
				'/* var(--kin-motion-typo) */\n.a { content: "var(--kin-motion-typo)"; transition: opacity var(--kin-motion-appear); }',
			),
			[],
		);
	});
});

describe("keyframes", () => {
	test("only Kinra Design defines kin- names", () => {
		const message =
			"takes a kin- name, which only Kinra Design defines (use kin-fade, kin-appear or kin-draw, or a name of the product's own)";
		assert.deepEqual(problems("@keyframes kin-spin { to { rotate: 1turn } }"), [
			`1:1 @keyframes kin-spin ${message}`,
		]);
		assert.deepEqual(
			inFile(
				"<style>\n  @keyframes -global-kin-rise { from { opacity: 0 } }\n</style>",
				"Card.svelte",
			),
			[`2:3 @keyframes -global-kin-rise ${message}`],
		);
	});

	test("Design's own files define them", () => {
		assert.deepEqual(
			problems("@keyframes kin-spin { to { rotate: 1turn } }", { own: true }),
			[],
		);
		const result = checkSource(readFileSync(TOKENS, "utf8"), TOKENS, {
			...design,
			strict: true,
		});
		assert.deepEqual(result.problems, []);
	});

	test("a component's own keyframes fail with --strict", () => {
		assert.deepEqual(inFile(SPIN, "Spinner.svelte"), []);
		assert.deepEqual(inFile(SPIN, "Spinner.svelte", { strict: true }), [
			"6:3 @keyframes svelte-probe-spin is defined in a component (use kin-fade, kin-appear or kin-draw, or mark its signature: with a reason)",
		]);
		// Space's settle is an appear, from-only, rising the shared 0.25rem.
		assert.deepEqual(inFile(SETTLE, "Post.svelte"), []);
		assert.deepEqual(inFile(SETTLE, "Post.svelte", { strict: true }), [
			"4:3 @keyframes settle is defined in a component (use kin-fade, kin-appear or kin-draw, or mark its signature: with a reason)",
		]);
	});

	test("a signature defines a component's own, and a stylesheet's are the product's", () => {
		assert.deepEqual(
			inFile(
				[
					"<style>",
					"  /* signature: an escapement's gait, one step a second */",
					"  @keyframes gait {",
					"    50% { animation-timing-function: steps(60); }",
					"  }",
					"</style>",
				].join("\n"),
				"Clock.svelte",
				{ strict: true },
			),
			[],
		);
		assert.deepEqual(
			strict("@keyframes settle { from { opacity: 0 } }", { own: false }),
			[],
		);
	});
});

describe("reduced-motion blocks in components", () => {
	const block = (body, query = "(prefers-reduced-motion: reduce)") =>
		`<div></div>\n<style>\n  @media ${query} {\n${body}\n  }\n</style>\n`;

	test("one that only zeroes motion warns, and fails with --strict", () => {
		const source = block(
			"    .a { animation: none; transition: none !important; }\n    :global(.b) { animation-duration: 0.01ms; --kin-duration-appear: 0ms; }",
		);
		const message =
			"3:3 @media (prefers-reduced-motion: reduce) only zeroes motion, which base.css and the register tokens already do (remove it)";
		assert.deepEqual(inFile(source, "Card.svelte"), [
			message.replace(" ", " warning: "),
		]);
		assert.deepEqual(inFile(source, "Card.svelte", { strict: true }), [
			message,
		]);
	});

	test("the boolean query, and a block nested in it, count too", () => {
		assert.deepEqual(
			inFile(
				block(
					"    @media (min-width: 40rem) { .a { transition: none } }",
					"(prefers-reduced-motion)",
				),
				"Card.vue",
			),
			[
				"3:3 warning: @media (prefers-reduced-motion) only zeroes motion, which base.css and the register tokens already do (remove it)",
			],
		);
	});

	test("one that gives a still form is kept", () => {
		assert.deepEqual(
			inFile(
				block("    .a { animation: none; }\n    .a::after { opacity: 1; }"),
				"Card.svelte",
				{ strict: true },
			),
			[],
		);
	});

	test("a stylesheet's are its own", () => {
		assert.deepEqual(
			strict(
				"@media (prefers-reduced-motion: reduce) { .a { animation: none; } }",
			),
			[],
		);
	});
});

describe("signature notes", () => {
	test("exempt a declaration on the same line or the line before", () => {
		assert.deepEqual(
			strict(`.a {
				animation: tick 1s steps(60) infinite; /* signature: an escapement's gait */
				/* signature: the live edge's band */
				animation: sweep 2.4s ease-in-out infinite;
				/*
				 * signature: the time-lapse runs as long as its day
				 */
				animation-duration: 12s;
				transition: opacity 0.35s ease-out;
			}`),
			[
				"9:25 transition: opacity 0.35s ease-out has 0.35s ease-out, a literal timing (use var(--kin-motion-<term>) for what moves)",
			],
		);
	});

	test("trailing one declaration do not carry to the next line", () => {
		assert.deepEqual(
			problems(`.a {
				transition-delay: 1.1s; /* signature: the close the live edge holds */
				transition: opacity 0.35s ease-out;
			}`),
			[
				"3:25 transition: opacity 0.35s ease-out has 0.35s ease-out, no term's timing (use var(--kin-motion-<term>) for what moves)",
			],
		);
	});

	test("without a reason are an error and exempt nothing", () => {
		assert.deepEqual(
			problems(".a {\n  /* signature: */\n  animation-duration: 0.7s;\n}"),
			[
				"2:6 signature: gives no reason (say why)",
				"3:23 animation-duration: 0.7s has 0.7s, no term's duration (use var(--kin-duration-<term>) for what moves)",
			],
		);
	});

	test("never excuse a broken pair or a misspelt name", () => {
		assert.deepEqual(
			problems(
				".a { transition: opacity var(--kin-motion-control) ease, color var(--kin-motion-apear); /* signature: a reason */ }",
			),
			[
				"1:52 transition: opacity var(--kin-motion-control) ease, … has ease after var(--kin-motion-control), a broken pair: the pair carries its own curve, so the declaration is invalid and the browser drops it",
				"1:68 transition: …, color var(--kin-motion-apear) uses --kin-motion-apear, which Kinra Design does not define (did you mean --kin-motion-appear?)",
			],
		);
	});

	test("in other comments are not read as CSS", () => {
		assert.deepEqual(
			strict("/* transition: opacity 3s ease in prose */\n.a { color: red; }"),
			[],
		);
	});
});

describe("structure", () => {
	test("finds declarations in nested @media, @layer, @container and & rules", () => {
		assert.deepEqual(
			problems(`@layer product {
				@media (min-width: 40rem) {
					.a {
						&:hover { transition: color 0.35s ease-out }
						@container (width > 3px) { animation-duration: 0.7s; }
					}
				}
			}`),
			[
				"4:35 transition: color 0.35s ease-out has 0.35s ease-out, no term's timing (use var(--kin-motion-<term>) for what moves)",
				"5:54 animation-duration: 0.7s has 0.7s, no term's duration (use var(--kin-duration-<term>) for what moves)",
			],
		);
	});

	test("reads a value over several lines, with !important and a prefix", () => {
		assert.deepEqual(
			problems(`.a {
				-webkit-transition:
					opacity var(--kin-motion-appear),
					color 0.35s ease-out !important;
			}`),
			[
				"4:12 -webkit-transition: …, color 0.35s ease-out has 0.35s ease-out, no term's timing (use var(--kin-motion-<term>) for what moves)",
			],
		);
	});

	test("counts the transition and animation declarations", () => {
		const { declarations } = checkCss(
			`.a { transition: none; color: red; animation-name: kin-fade; --x: 1s; }
			@keyframes x { to { animation-timing-function: var(--kin-ease-out); } }`,
			design,
		);
		assert.equal(declarations, 3);
	});
});

describe("components", () => {
	test("Svelte <style> blocks keep the file's lines", () => {
		const source = [
			"<script>",
			"  const css = '<style>.x { transition: opacity 3s ease; }</style>';",
			"</script>",
			"<!-- <style>.y { transition: opacity 3s ease; }</style> -->",
			'<p style="transition: opacity 3s ease">{css}</p>',
			"<style>",
			"  :global(.a) {",
			"    transition: opacity 0.35s ease-out;",
			"  }",
			"</style>",
		].join("\n");
		const { declarations, problems: found } = checkSource(
			source,
			"A.svelte",
			design,
		);
		assert.equal(declarations, 1);
		assert.deepEqual(found.map(format), [
			"8:25 transition: opacity 0.35s ease-out has 0.35s ease-out, no term's timing (use var(--kin-motion-<term>) for what moves)",
		]);
	});

	test("Astro skips its frontmatter and reads <style is:global>", () => {
		const source = [
			"---",
			"const style = '<style>.x { transition: opacity 3s ease }</style>';",
			"---",
			"<div class='a'></div>",
			"<style is:global>",
			"  .a { animation-duration: 0.7s; }",
			"</style>",
		].join("\n");
		assert.deepEqual(
			checkSource(source, "Page.astro", design).problems.map((p) => p.line),
			[6],
		);
	});

	test("Vue blocks in another language are left to their own tools", () => {
		const source =
			'<style lang="scss">.a { transition: opacity 3s ease; }</style>\n<style scoped>.b { transition: opacity 3s ease; }</style>';
		assert.equal(checkSource(source, "A.vue", design).problems.length, 1);
	});
});

describe("a product's own properties", () => {
	test("a literal timing kept in one is read through where it is used", () => {
		const css = `:root { --relay-motion: 0.35s ease-out; --observatory-journey: 460ms; }
		.a { transition: opacity var(--relay-motion); }
		.b { transition: translate var(--observatory-journey) var(--kin-ease-out); }`;
		const loose = problems(css);
		assert.equal(loose.length, 1);
		assert.match(
			loose[0],
			/^2:28 .*takes --relay-motion, set to 0\.35s ease-out: no term's timing/,
		);
		const firm = strict(css);
		assert.equal(firm.length, 2);
		assert.match(
			firm[0],
			/takes --relay-motion, set to 0\.35s ease-out: a literal timing/,
		);
		assert.match(firm[1], /takes --observatory-journey, set to 460ms/);
	});

	test("a term's own value kept in one passes by default", () => {
		assert.deepEqual(
			problems(`:root { --relay-surface: 180ms cubic-bezier(0.16, 1, 0.3, 1); }
			.a { transition: box-shadow var(--relay-surface); }`),
			[],
		);
	});

	test("a signature where it is set excuses it", () => {
		assert.deepEqual(
			strict(`:root {
				/* signature: the escapement's own gait */
				--beat: 100ms cubic-bezier(0.3, 0, 0.25, 1);
			}
			.hand { animation: tick var(--beat) infinite; }`),
			[],
		);
	});

	test("one that never moves anything is not read", () => {
		assert.deepEqual(strict(`:root { --toast-dwell: 4s; }`), []);
	});
});

describe("the edges of the rules", () => {
	test("a copy of a registry pattern keeps its kin-pattern- keyframes", () => {
		assert.deepEqual(
			inFile(
				"@keyframes kin-pattern-live-edge-sweep { from { opacity: 0; } }",
				"src/edge.css",
			),
			[],
		);
		assert.equal(
			inFile("@keyframes kin-fade { from { opacity: 0; } }", "src/app.css")
				.length,
			1,
		);
	});

	test("only a comment that begins with signature: is one", () => {
		const css = `.a {
			/* this is not a signature: just a preference */
			transition: opacity 999ms ease;
		}`;
		assert.equal(strict(css).length, 1);
	});

	test("a change that takes no time has no curve to answer for", () => {
		assert.deepEqual(strict(`.a { transition: color 0ms ease; }`), []);
	});

	test("a scroll-driven animation may name its curve", () => {
		assert.deepEqual(
			strict(
				`.a { animation: reveal linear both; animation-timeline: view(); }`,
			),
			[],
		);
	});
});

describe("the command", () => {
	const directory = mkdtempSync(path.join(os.tmpdir(), "kinra-check-motion-"));
	after(() => rmSync(directory, { recursive: true, force: true }));

	const write = (name, text) => {
		const file = path.join(directory, name);
		mkdirSync(path.dirname(file), { recursive: true });
		writeFileSync(file, text);
		return file;
	};
	const run = (...args) =>
		spawnSync(process.execPath, [TOOL, ...args], {
			cwd: directory,
			encoding: "utf8",
		});

	const clean = write("clean/app.css", `${CORRECT}\n`);
	write(
		"clean/Card.svelte",
		"<div></div>\n<style>\n  .b { animation: kin-appear var(--kin-motion-appear) both; }\n</style>\n",
	);
	write("clean/node_modules/dep/off.css", PROBE);
	write("clean/.svelte-kit/off.css", PROBE);
	write("clean/notes.txt", PROBE);
	write("dirty/app.css", `.a {\n  ${RELAY.slice(5, -2)}\n}\n`);
	write(
		"warned/app.css",
		".a { transition: opacity var(--kin-duration-retract) var(--kin-ease-in); }\n",
	);
	write("launder/tokens.css", ":root { --relay-motion: 0.35s ease-out; }\n");
	write("launder/app.css", ".a { transition: opacity var(--relay-motion); }\n");
	write(
		"strict/Spinner.svelte",
		"<span></span>\n<style>\n  @keyframes spin { to { rotate: 1turn } }\n</style>\n",
	);

	test("prints usage and exits 2 without a path", () => {
		const result = run();
		assert.equal(result.status, 2);
		assert.match(result.stderr, /usage: kinra-check-motion/);
	});

	test("prints usage and exits 0 with --help", () => {
		const result = run("--help");
		assert.equal(result.status, 0);
		assert.match(result.stdout, /^usage: kinra-check-motion \[--strict\]/);
		assert.match(result.stdout, /"signature:"/);
	});

	test("exits 2 for an unknown option or a missing path", () => {
		assert.equal(run("--loose", "clean").status, 2);
		const missing = run("absent");
		assert.equal(missing.status, 2);
		assert.match(missing.stderr, /absent: no such file or directory/);
	});

	test("exits 0 with a summary when every declaration passes", () => {
		const result = run("clean");
		assert.equal(result.status, 0, result.stdout + result.stderr);
		assert.equal(
			result.stdout,
			"kinra-check-motion: 2 declarations in 2 files on Kinra's terms\n",
		);
	});

	test("prints nothing on success with --quiet", () => {
		const result = run("--quiet", "--strict", clean);
		assert.equal(result.status, 0);
		assert.equal(result.stdout, "");
		assert.equal(result.stderr, "");
	});

	test("exits 1 with one line per problem", () => {
		const result = run("dirty", "clean");
		assert.equal(result.status, 1);
		const file = path.join("dirty", "app.css");
		assert.equal(
			result.stdout,
			`${file}:2:58: transition: background-color var(--kin-motion-control, 120ms) ease has 120ms, a dead fallback: Kinra Design defines --kin-motion-control\n` +
				`${file}:2:65: transition: background-color var(--kin-motion-control, 120ms) ease has ease after var(--kin-motion-control), a broken pair: the pair carries its own curve, so the declaration is invalid and the browser drops it\n`,
		);
		assert.match(result.stderr, /2 problems in 3 declarations in 3 files$/m);
	});

	test("prints warnings but exits 0 for them alone", () => {
		const result = run("--quiet", "warned");
		assert.equal(result.status, 0);
		assert.match(
			result.stdout,
			/app\.css:1:30: warning: transition: .* uses --kin-duration-retract, which is deprecated \(use instead: exit; the corner key keeps 200ms as its own signature\)/,
		);
		assert.match(result.stderr, /1 warning in 1 declaration in 1 file$/m);
	});

	test("applies --strict", () => {
		assert.equal(run("warned", "strict").status, 0);
		const result = run("--strict", "warned", "strict");
		assert.equal(result.status, 1);
		assert.match(
			result.stdout,
			/Spinner\.svelte:3:3: @keyframes spin is defined in a component/,
		);
		assert.doesNotMatch(result.stdout, /warning:/);
		assert.match(
			result.stderr,
			/2 problems in 1 declaration in 2 files \(strict\)$/m,
		);
	});

	test("reads a product's own property set in another file", () => {
		const result = run("--strict", "launder");
		assert.equal(result.status, 1);
		assert.match(
			result.stdout,
			/app\.css:1:\d+: .*takes --relay-motion, set to 0\.35s ease-out/,
		);
	});

	test("reads Design beside itself, as installed, and exits 2 without it", () => {
		const installation = path.join(directory, "node_modules", "@kinra", "web");
		for (const file of [
			"tools/check-motion.mjs",
			"tools/css.mjs",
			"src/styles/tokens.css",
			"docs/motion.md",
		]) {
			mkdirSync(path.dirname(path.join(installation, file)), {
				recursive: true,
			});
			copyFileSync(repoFile(file), path.join(installation, file));
		}
		const installed = (...args) =>
			spawnSync(
				process.execPath,
				[path.join(installation, "tools/check-motion.mjs"), ...args],
				{ cwd: directory, encoding: "utf8" },
			);
		const keyframes = "@keyframes kin-rise { from { opacity: 0 } }\n";
		write("app/rise.css", keyframes);
		writeFileSync(path.join(installation, "src/styles/rise.css"), keyframes);

		const product = installed("--strict", "app");
		assert.equal(product.status, 1);
		assert.match(
			product.stdout,
			/rise\.css:1:1: @keyframes kin-rise takes a kin- name/,
		);
		const own = installed("--strict", path.join(installation, "src/styles"));
		assert.equal(own.status, 0, own.stdout + own.stderr);

		rmSync(path.join(installation, "docs/motion.md"));
		const unread = installed("app");
		assert.equal(unread.status, 2);
		assert.match(unread.stderr, /cannot read Kinra's motion tokens/);
	});
});
