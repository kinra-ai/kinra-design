#!/usr/bin/env node
/*
 * kinra-check-motion: hold a product's motion to Kinra's terms.
 *
 * The terms are read from Design's own src/styles/tokens.css each run, and the
 * deprecated tokens from the table in docs/motion.md, so a product never
 * copies Design's numbers. A term is a duration, --kin-duration-<term>, and a
 * pair of that duration and its curve, --kin-motion-<term>; docs/motion.md
 * says what each one means.
 *
 * Checked: every transition* and animation* declaration, in rules and in
 * @keyframes, with every var() set aside first, so only what is written by
 * hand counts.
 *
 * - A literal duration and curve pass only when together they are some term's
 *   pair, read numerically (0.18s is 180ms, and ease-out is
 *   cubic-bezier(0, 0, 0.58, 1)); a duration with no curve takes the
 *   browser's ease, which no term does. A literal delay passes only as a step
 *   of the scale or a term's duration. Zero, or under a millisecond, always
 *   passes: nothing moves.
 * - A --kin-motion-* pair already carries its curve. Another curve in the same
 *   item makes the declaration invalid, so the browser drops it; so does a
 *   third time, and a time before the pair makes the pair's duration a delay.
 *   One time after the pair is its delay.
 * - Every --kin-duration-*, --kin-motion-* and --kin-ease-* read or set is one
 *   tokens.css defines. A deprecated one is a warning, and a fallback on one
 *   Design defines never applies.
 * - Only Design defines @keyframes kin-*. Files in this package's src/styles
 *   and registry are Design's own.
 * - In a component's <style> block, a prefers-reduced-motion: reduce block
 *   that only zeroes motion is a warning: base.css and the register tokens
 *   already land motion at once.
 *
 * --strict allows no literal duration but zero, and no literal delay or curve:
 * each comes from var(--kin-*). Deprecated tokens and redundant reduced-motion
 * blocks fail, and so does @keyframes in a component, which takes Design's
 * shared arrivals instead.
 *
 * A signature, timing that belongs to the thing itself, says why in a comment
 * containing `signature:`, on the declaration's line or ending on the line
 * before it; before its @keyframes, it covers the whole definition. It exempts
 * the timing, never a broken pair or a misspelt name.
 *
 * Warnings do not fail the check. Zero dependencies: products install Design
 * without its devDependencies.
 */
import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
	COMPONENTS,
	componentSheets,
	exceptionNotes,
	invokedDirectly,
	lineIndex,
	maskCss,
	parseArguments,
	parseCss,
	plural,
	targetFiles,
} from "./css.mjs";

const COMMAND = "kinra-check-motion";
const TOKENS = new URL("../src/styles/tokens.css", import.meta.url);
const DOC = new URL("../docs/motion.md", import.meta.url);
const OWN = [
	new URL("../src/styles/", import.meta.url),
	new URL("../registry/", import.meta.url),
];

const EPSILON = 1e-6;
const MARK = "signature:";
const ROOT = ":root";
const MOTION_NAME = /^--kin-(duration|motion|ease)-([\w-]+)$/;
const TIME = /^([+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?)(ms|s)$/i;
const TIMES =
	/(?<![\w.-])([+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?)(ms|s)(?![\w-])/gi;
const KEYFRAMES = /^@(?:-[a-z]+-)?keyframes\b\s*/i;
const REDUCED = /\(\s*prefers-reduced-motion\s*(?::\s*reduce\s*)?\)/i;
const MATH = new Set([
	"calc",
	"min",
	"max",
	"clamp",
	"round",
	"mod",
	"rem",
	"abs",
	"sign",
]);
const CURVE_FUNCTIONS = new Set(["cubic-bezier", "steps", "linear"]);
const CURVE_KEYWORDS = new Map([
	["ease", "cubic-bezier(0.25,0.1,0.25,1)"],
	["ease-in", "cubic-bezier(0.42,0,1,1)"],
	["ease-out", "cubic-bezier(0,0,0.58,1)"],
	["ease-in-out", "cubic-bezier(0.42,0,0.58,1)"],
	["linear", "linear"],
	["step-start", "steps(1,start)"],
	["step-end", "steps(1,end)"],
]);
const EASE = CURVE_KEYWORDS.get("ease");
// A product's own custom property that names a curve, by its name.
const CURVE_LIKE = /(?:^--|-)(?:ease|easing|curve|bezier)(?:-|$)/i;

const USAGE = `usage: kinra-check-motion [--strict] [--quiet] <file or directory>...

Checks transitions, animations and keyframes in .css files and in the <style>
blocks of .svelte, .astro and .vue files against Kinra Design's motion tokens.
A literal duration and curve pass only together as a term's pair, and a
literal delay only as a step of the scale or a term's duration.

  --strict  allow no literal duration but 0, and no literal delay or curve:
            take each from var(--kin-motion-*), var(--kin-duration-*) or
            var(--kin-ease-*); deprecated tokens, keyframes defined in a
            component and its reduced-motion blocks that only zero motion
            fail too
  --quiet   print nothing when every declaration passes

A signature, timing that belongs to the thing itself, says why in a comment
containing "signature:" on the declaration's line or on the line before it.
Warnings do not fail the check.`;

const near = (a, b) => Math.abs(a - b) < EPSILON;
const toMs = (number, unit) =>
	Number(number) * (unit.toLowerCase() === "s" ? 1000 : 1);
const moves = (ms) => Math.abs(ms) >= 1;
const list = (items) =>
	items.length < 2
		? items.join("")
		: `${items.slice(0, -1).join(", ")} or ${items.at(-1)}`;
const collapse = (text) => text.trim().replace(/\s+/g, " ");

/** A time such as `180ms` or `0.18s` in milliseconds, or undefined. */
function msOf(text) {
	const match = TIME.exec(text.trim());
	return match ? toMs(match[1], match[2]) : undefined;
}

/**
 * A timing function in one spelling, so that equal curves compare equal:
 * `ease-out` is `cubic-bezier(0,0,0.58,1)`, `step-end` is `steps(1,end)`, and
 * `cubic-bezier(0, 0, 1, 1)` is `linear`.
 *
 * @param {string} text
 */
export function curveOf(text) {
	const curve = text.trim().toLowerCase().replace(/\s+/g, "");
	if (CURVE_KEYWORDS.has(curve)) return CURVE_KEYWORDS.get(curve);
	const bezier = /^cubic-bezier\(([^()]*)\)$/.exec(curve);
	if (bezier) {
		const points = bezier[1].split(",").map(Number);
		if (points.length !== 4 || points.some(Number.isNaN)) return curve;
		const form = `cubic-bezier(${points.join(",")})`;
		return form === "cubic-bezier(0,0,1,1)" ? "linear" : form;
	}
	const steps = /^steps\(([^,()]*)(?:,([\w-]+))?\)$/.exec(curve);
	if (steps) {
		const position =
			{ "jump-start": "start", "jump-end": "end" }[steps[2]] ??
			steps[2] ??
			"end";
		return `steps(${Number(steps[1])},${position})`;
	}
	return curve === "linear(0,1)" ? "linear" : curve;
}

/** The offset of the parenthesis that closes the one at `open`. */
function closing(text, open, end) {
	let depth = 0;
	for (let k = open; k < end; k++) {
		if (text[k] === "(") depth++;
		else if (text[k] === ")" && --depth === 0) return k;
	}
	return end;
}

/**
 * Every var() in text[start, end), those in a fallback too, with its name and
 * the trimmed range of its fallback.
 */
function varCalls(text, start = 0, end = text.length) {
	const calls = [];
	const pattern = /(?<![\w-])var\(\s*(--[\w-]+)\s*/gi;
	pattern.lastIndex = start;
	for (let match; (match = pattern.exec(text)) && match.index < end;) {
		const close = closing(text, match.index + 3, end);
		const after = match.index + match[0].length;
		let fallback;
		if (text[after] === ",") {
			const raw = text.slice(after + 1, close);
			const from = after + 1 + raw.length - raw.trimStart().length;
			fallback = { start: from, text: raw.trim() };
		}
		calls.push({
			name: match[1],
			nameAt: match.index + match[0].indexOf("--"),
			start: match.index,
			end: close + 1,
			fallback,
		});
		pattern.lastIndex = after;
	}
	return calls;
}

/** `text` with every var() blanked to spaces, keeping offsets. */
function blankVars(text) {
	let out = text;
	let last = 0;
	for (const call of varCalls(text)) {
		if (call.start < last) continue;
		out =
			out.slice(0, call.start) +
			" ".repeat(call.end - call.start) +
			out.slice(call.end);
		last = call.end;
	}
	return out;
}

/**
 * Replace each var() in a value with what `resolve` gives for its name, or its
 * fallback; undefined when neither gives a value.
 */
function substitute(value, resolve) {
	let out = "";
	let last = 0;
	for (const call of varCalls(value)) {
		if (call.start < last) continue;
		let replacement = resolve(call.name);
		if (replacement === undefined && call.fallback) {
			replacement = substitute(call.fallback.text, resolve);
		}
		if (replacement === undefined) return undefined;
		out += value.slice(last, call.start) + replacement;
		last = call.end;
	}
	return out + value.slice(last);
}

/**
 * The comma-separated items of text[start, end), each a list of components: a
 * function with its arguments, or a run of other characters.
 */
function splitItems(text, start, end) {
	const items = [];
	let item = [];
	for (let i = start; i < end;) {
		const c = text[i];
		if (/\s/.test(c)) {
			i++;
		} else if (c === ",") {
			items.push(item);
			item = [];
			i++;
		} else {
			let k = i;
			let depth = 0;
			while (k < end) {
				const d = text[k];
				if (d === "(") depth++;
				else if (d === ")") depth = Math.max(0, depth - 1);
				else if (depth === 0 && (/\s/.test(d) || d === ",")) break;
				k++;
			}
			item.push({ start: i, end: k, text: text.slice(i, k) });
			i = k;
		}
	}
	items.push(item);
	return items;
}

/**
 * What a component of a transition or animation value is: a time, a curve,
 * both (a --kin-motion-* pair), or something else. A time or curve is
 * "literal" when written by hand, "design" when it is a Kinra token, and
 * "unknown" when it is a product's own var().
 */
function classify(component) {
	const { text } = component;
	const fn = /^([a-z-]+)\(/i.exec(text)?.[1].toLowerCase();
	if (fn === "var") {
		const name = /^var\(\s*(--[\w-]+)/i.exec(text)?.[1] ?? "";
		const family = MOTION_NAME.exec(name)?.[1];
		if (family === "motion") {
			return {
				...component,
				kind: "pair",
				name,
				time: "design",
				curve: "design",
			};
		}
		if (family === "duration") {
			return { ...component, kind: "var", name, time: "design" };
		}
		if (family === "ease") {
			return { ...component, kind: "var", name, curve: "design" };
		}
		return CURVE_LIKE.test(name)
			? { ...component, kind: "var", name, curve: "unknown" }
			: { ...component, kind: "var", name, time: "unknown" };
	}
	const ms = msOf(text);
	if (ms !== undefined) {
		return {
			...component,
			kind: "literal",
			time: "literal",
			literals: [{ at: component.start, text, ms }],
		};
	}
	if (
		(fn && CURVE_FUNCTIONS.has(fn)) ||
		CURVE_KEYWORDS.has(text.toLowerCase())
	) {
		return {
			...component,
			kind: "literal",
			curve: "literal",
			value: curveOf(text),
		};
	}
	if (fn && MATH.has(fn)) {
		const literals = [...blankVars(text).matchAll(TIMES)].map((match) => ({
			at: component.start + match.index,
			text: match[0],
			ms: toMs(match[1], match[2]),
		}));
		if (literals.length > 0) {
			return { ...component, kind: "math", time: "literal", literals };
		}
		const names = varCalls(text).map((call) => call.name);
		if (names.some((name) => /^--kin-(?:duration|motion)-/.test(name))) {
			return { ...component, kind: "math", time: "design" };
		}
		if (names.length > 0)
			return { ...component, kind: "math", time: "unknown" };
	}
	return { ...component, kind: "other" };
}

/** A token's resolved value as one time and one curve, or undefined. */
function pairOf(value) {
	const items = splitItems(value, 0, value.length);
	if (items.length !== 1) return undefined;
	let ms;
	let curve;
	for (const part of items[0].map(classify)) {
		if (part.time === "literal" && part.kind === "literal")
			ms ??= part.literals[0].ms;
		else if (part.curve === "literal") curve ??= part.value;
		else return undefined;
	}
	return ms === undefined || curve === undefined ? undefined : { ms, curve };
}

/** The registers a rule's selector declares its custom properties for. */
function scopeOf(css, block) {
	let rule = block;
	while (rule && rule.prelude.startsWith("@")) rule = rule.parent;
	const selector = rule ? css.slice(rule.at, rule.open) : "";
	return {
		root: /:root\b/.test(selector),
		any: /\[\s*data-kin-motion\s*\]/.test(selector),
		registers: new Set(
			[
				...selector.matchAll(
					/\[\s*data-kin-motion\s*=\s*["']?([\w-]+)["']?\s*\]/g,
				),
			].map((match) => match[1]),
		),
	};
}

/** Whether a block is, or sits inside, @media (prefers-reduced-motion: reduce). */
function reduced(block) {
	for (let b = block; b; b = b.parent) {
		if (/^@media\b/i.test(b.prelude) && REDUCED.test(b.prelude)) return true;
	}
	return false;
}

/** The name a @keyframes block defines, or undefined for another block. */
function keyframesName(css, block) {
	if (block.parent?.keyframes || !KEYFRAMES.test(block.prelude))
		return undefined;
	const masked = block.prelude.replace(KEYFRAMES, "").trim();
	if (masked) return masked;
	return css
		.slice(block.at, block.open)
		.replace(KEYFRAMES, "")
		.trim()
		.replace(/^["']|["']$/g, "");
}

/**
 * The deprecated motion tokens in docs/motion.md's `motion:deprecated` table:
 * each token to what to use instead.
 *
 * @param {string} markdown
 * @returns {Map<string, string>}
 */
export function readDeprecated(markdown) {
	const open = "<!-- motion:deprecated -->";
	const close = "<!-- /motion:deprecated -->";
	const start = markdown.indexOf(open);
	const end = markdown.indexOf(close);
	if (start === -1 || end < start) {
		throw new Error("docs/motion.md has no motion:deprecated table");
	}
	const rows = markdown
		.slice(start + open.length, end)
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.startsWith("|"))
		.map((line) =>
			line
				.replace(/^\||\|$/g, "")
				.split("|")
				.map((cell) => cell.trim().replace(/`/g, "")),
		);
	const [header = [], , ...body] = rows;
	const token = header.findIndex((cell) => /^token$/i.test(cell));
	const instead = header.findIndex((cell) => /^use instead$/i.test(cell));
	if (token === -1 || instead === -1) {
		throw new Error(
			"docs/motion.md's deprecated table has no Token and Use instead columns",
		);
	}
	return new Map(
		body
			.filter((cells) => /^--kin-[\w-]+$/.test(cells[token] ?? ""))
			.map((cells) => [cells[token], cells[instead] ?? ""]),
	);
}

/**
 * Kinra's motion from the text of tokens.css: every term's pairs in each
 * register, every duration's values, the curves, the scale, the delays a
 * literal may take, the shared arrivals, and every name it defines.
 *
 * Each register is resolved as the browser does: a custom property declared on
 * a register's element takes the var()s it names from that element, and one
 * declared only on :root is inherited as the root resolved it. Values under
 * prefers-reduced-motion: reduce are left out, since a zero always passes.
 *
 * @param {string} tokensCss
 * @param {Map<string, string>} [deprecated] from readDeprecated
 */
export function readMotion(tokensCss, deprecated = new Map()) {
	const { text } = maskCss(tokensCss);
	const { blocks, declarations } = parseCss(text);
	const names = new Set();
	const definitions = new Map();
	const registers = new Set([ROOT]);
	for (const found of declarations) {
		if (!found.custom) continue;
		if (MOTION_NAME.test(found.name)) names.add(found.name);
		if (reduced(found.block)) continue;
		const scope = scopeOf(tokensCss, found.block);
		for (const register of scope.registers) registers.add(register);
		const value = collapse(text.slice(found.valueStart, found.valueEnd));
		definitions.set(found.name, [
			...(definitions.get(found.name) ?? []),
			{ value, ...scope },
		]);
	}
	const resolving = new Set();
	const valueIn = (name, register) => {
		const key = `${register} ${name}`;
		if (resolving.has(key)) return undefined;
		const direct = (definitions.get(name) ?? []).findLast((definition) =>
			register === ROOT
				? definition.root
				: definition.any || definition.registers.has(register),
		);
		if (!direct) return register === ROOT ? undefined : valueIn(name, ROOT);
		resolving.add(key);
		const value = substitute(direct.value, (inner) => valueIn(inner, register));
		resolving.delete(key);
		return value;
	};

	const terms = new Map();
	const durations = new Map();
	const curves = new Map();
	for (const name of definitions.keys()) {
		const [, family, suffix] = MOTION_NAME.exec(name) ?? [];
		if (family === "motion" && !deprecated.has(name)) {
			const pairs = [];
			for (const register of registers) {
				const value = valueIn(name, register);
				const pair = value === undefined ? undefined : pairOf(value);
				if (
					pair &&
					!pairs.some((p) => near(p.ms, pair.ms) && p.curve === pair.curve)
				) {
					pairs.push({ register, ...pair });
				}
			}
			if (pairs.length > 0) terms.set(suffix, pairs);
		} else if (family === "duration") {
			const values = [];
			for (const register of registers) {
				const ms = msOf(valueIn(name, register) ?? "");
				if (ms !== undefined && !values.some((v) => near(v, ms)))
					values.push(ms);
			}
			if (values.length > 0) durations.set(name, values);
		} else if (family === "ease") {
			const value = valueIn(name, ROOT);
			if (value !== undefined) curves.set(name, curveOf(value));
		}
	}
	if (terms.size === 0) {
		throw new Error("tokens.css defines no --kin-motion-* pair");
	}

	// The scale is the fixed durations written as numbers that no pair takes
	// by name: the steps the terms take their durations from.
	const scale = [];
	for (const [name, values] of durations) {
		const suffix = name.slice("--kin-duration-".length);
		const fixed = definitions
			.get(name)
			.every(
				(d) =>
					d.root &&
					!d.any &&
					d.registers.size === 0 &&
					msOf(d.value) !== undefined,
			);
		if (fixed && !deprecated.has(name) && !terms.has(suffix)) {
			scale.push({ name, ms: values[0] });
		}
	}
	scale.sort((a, b) => a.ms - b.ms);

	const pairs = [...terms.values()].flat();
	const delays = [
		...new Set(
			[...durations]
				.filter(([name]) => !deprecated.has(name))
				.flatMap(([, values]) => values),
		),
	].sort((a, b) => a - b);
	const arrivals = blocks
		.map((block) => keyframesName(tokensCss, block))
		.filter((name) => name?.startsWith("kin-"));
	return {
		names,
		terms,
		durations,
		curves,
		scale,
		delays,
		arrivals,
		deprecated,
		pairs,
		timesUsed: [...new Set(pairs.map((p) => p.ms).filter(moves))],
		curvesUsed: new Set(pairs.map((p) => p.curve)),
	};
}

let design;

/**
 * Read Design's motion from the files beside this tool: the terms from
 * src/styles/tokens.css, and the deprecated tokens from docs/motion.md.
 */
export function loadDesign() {
	if (!design) {
		const deprecated = readDeprecated(readFileSync(DOC, "utf8"));
		design = { motion: readMotion(readFileSync(TOKENS, "utf8"), deprecated) };
	}
	return design;
}

let ownDirectories;

/** Whether a file is Design's own: in this package's src/styles or registry. */
function isOwn(file) {
	const real = (target) => {
		try {
			return realpathSync(target);
		} catch {
			return path.resolve(target);
		}
	};
	ownDirectories ??= OWN.map((url) => real(fileURLToPath(url)));
	const resolved = real(file);
	return ownDirectories.some(
		(directory) =>
			resolved === directory || resolved.startsWith(directory + path.sep),
	);
}

/** Which part of a transition or animation a property sets, if any. */
function motionKind(property) {
	const match =
		/^(?:-(?:webkit|moz|o|ms)-)?(?:transition|animation)(-[a-z-]+)?$/.exec(
			property,
		);
	if (!match) return undefined;
	return (
		{
			"": "shorthand",
			"-duration": "duration",
			"-delay": "delay",
			"-timing-function": "curve",
		}[match[1] ?? ""] ?? "other"
	);
}

function didYouMean(name, motion) {
	const [, family, suffix] = MOTION_NAME.exec(name);
	const candidates = [...motion.names].filter(
		(candidate) => !motion.deprecated.has(candidate),
	);
	for (const other of ["motion", "duration", "ease"]) {
		const swapped = `--kin-${other}-${suffix}`;
		if (other !== family && candidates.includes(swapped)) {
			return ` (did you mean ${swapped}?)`;
		}
	}
	// A misspelling is a few edits away; anything further is a coined name.
	const prefix = `--kin-${family}-`;
	let best;
	let fewest = Math.max(2, Math.floor(suffix.length / 2)) + 1;
	for (const candidate of candidates) {
		if (!candidate.startsWith(prefix)) continue;
		const edits = distance(suffix, candidate.slice(prefix.length));
		if (edits < fewest) {
			best = candidate;
			fewest = edits;
		}
	}
	return best
		? ` (did you mean ${best}?)`
		: " (its terms are in docs/motion.md)";
}

function distance(a, b) {
	let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
	for (let i = 1; i <= a.length; i++) {
		const current = [i];
		for (let j = 1; j <= b.length; j++) {
			current[j] = Math.min(
				previous[j] + 1,
				current[j - 1] + 1,
				previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
			);
		}
		previous = current;
	}
	return previous[b.length];
}

const pairToken = (term) => `var(--kin-motion-${term})`;

function easeTokens(motion, curve) {
	return [...motion.curves]
		.filter(([name, value]) => value === curve && !motion.deprecated.has(name))
		.map(([name]) => `var(${name})`);
}

/** The durations a time part can take, or undefined when it cannot be known. */
function durationsOf(part, motion) {
	if (!part) return [0];
	if (part.kind === "literal") return [part.literals[0].ms];
	if (part.kind === "pair") {
		return motion.terms
			.get(part.name.slice("--kin-motion-".length))
			?.map((p) => p.ms);
	}
	if (part.kind === "var" && part.time === "design") {
		return motion.durations.get(part.name);
	}
	return undefined;
}

/** The curves a curve part can be, or undefined when it cannot be known. */
function curvesOf(part, motion) {
	if (!part) return [EASE];
	if (part.kind === "literal") return [part.value];
	if (part.kind === "pair") {
		return motion.terms
			.get(part.name.slice("--kin-motion-".length))
			?.map((p) => p.curve);
	}
	if (part.kind === "var" && part.curve === "design") {
		const curve = motion.curves.get(part.name);
		return curve === undefined ? undefined : [curve];
	}
	return undefined;
}

/**
 * How to write a timing with Kinra's pairs, named from what is known of it:
 * the term a duration token names, a pair equal to it, or the terms that keep
 * the half taken from a token (a duration's, or the nearest with its curve).
 */
function timingFix(motion, durations, curves, duration, curve) {
	const named =
		duration?.kind === "var"
			? /^--kin-duration-([\w-]+)$/.exec(duration.name)?.[1]
			: undefined;
	if (named && motion.terms.has(named)) return `use ${pairToken(named)}`;
	const moving = durations?.filter(moves) ?? [];
	if (moving.length === 0) {
		const tokens = curves?.length === 1 ? easeTokens(motion, curves[0]) : [];
		return tokens.length > 0
			? `use ${list(tokens)}`
			: "use var(--kin-motion-<term>) for what moves";
	}
	const terms = [...motion.terms];
	const taking = (test) =>
		terms
			.filter(([, pairs]) => pairs.some(test))
			.map(([term]) => pairToken(term));
	const exact = curves
		? taking(
				(p) => curves.includes(p.curve) && moving.some((ms) => near(ms, p.ms)),
			)
		: [];
	if (exact.length > 0) return `use ${list(exact)}`;
	const sameTime = () => {
		const same = taking((p) => moving.some((ms) => near(ms, p.ms)));
		return same.length > 0 ? `use ${list(same)}` : undefined;
	};
	// Near means within a factor of two: a 160ms change is not a 1.6s loop.
	const sameCurve = () => {
		const gap = (p) => Math.min(...moving.map((ms) => Math.abs(ms - p.ms)));
		const close = (p) =>
			moving.some((ms) => Math.max(ms, p.ms) <= 2 * Math.min(ms, p.ms));
		const shaped = motion.pairs.filter(
			(p) => moves(p.ms) && curves?.includes(p.curve) && close(p),
		);
		if (shaped.length === 0) return undefined;
		const least = Math.min(...shaped.map(gap));
		return `nearest ${list(taking((p) => shaped.includes(p) && near(gap(p), least)))}`;
	};
	const tokenCurve = curve?.kind === "var" && curve.curve === "design";
	const fix = tokenCurve
		? (sameCurve() ?? sameTime())
		: (sameTime() ?? sameCurve());
	return fix ?? "use var(--kin-motion-<term>) for what moves";
}

function durationFix(motion, ms) {
	const tokens = [...motion.terms]
		.filter(([, pairs]) => pairs.some((p) => near(p.ms, ms)))
		.map(([term]) => `var(--kin-duration-${term})`);
	return tokens.length > 0
		? `use ${list(tokens)}`
		: "use var(--kin-duration-<term>) for what moves";
}

function curveFix(motion, curve) {
	const tokens = easeTokens(motion, curve);
	if (tokens.length > 0) return `use ${list(tokens)}`;
	const carriers = [...motion.terms]
		.filter(([, pairs]) => pairs.some((p) => p.curve === curve))
		.map(([term]) => pairToken(term));
	if (carriers.length > 0) return `${list(carriers)} carries it`;
	return "use var(--kin-ease-<curve>) for its path";
}

function delayFix(motion, ms) {
	const steps = motion.scale
		.filter((step) => near(step.ms, ms))
		.map((step) => `var(${step.name})`);
	if (steps.length > 0) return `use ${list(steps)}`;
	const terms = [...motion.durations]
		.filter(
			([name, values]) =>
				!motion.deprecated.has(name) && values.some((v) => near(v, ms)),
		)
		.map(([name]) => `var(${name})`);
	if (terms.length > 0) return `use ${list(terms)}`;
	if (ms < 0) return "a phase comes from the clock, or is a signature";
	const below = motion.scale.findLast((step) => step.ms < ms);
	const above = motion.scale.find((step) => step.ms > ms);
	return `nearest ${[below, above]
		.filter(Boolean)
		.map((step) => `var(${step.name})`)
		.join(" or ")}`;
}

/**
 * The broken structure in one item of a transition or animation: a pair with
 * another curve or a misplaced time, two curves, three times, or a token in a
 * longhand that cannot take it.
 */
function structure(parts, kind, shown, motion) {
	const findings = [];
	// "has ease after var(…), …" or "has 1s, a third time, …"
	const say = (part, why) =>
		findings.push({
			offset: part.start,
			message: `${shown} has ${part.text}${/^(?:before|after) /.test(why) ? " " : ", "}${why}`,
		});
	const invalid = "so the declaration is invalid and the browser drops it";
	if (kind !== "shorthand") {
		const slot = { duration: "duration", delay: "delay", curve: "curve" }[kind];
		for (const part of parts) {
			if (part.kind === "pair") {
				const term = part.name.slice("--kin-motion-".length);
				let fix = `use var(--kin-duration-${term})`;
				if (kind === "curve") {
					const curve = motion.terms.get(term)?.[0].curve;
					const tokens = curve === undefined ? [] : easeTokens(motion, curve);
					fix =
						tokens.length > 0
							? `use ${list(tokens)}`
							: "set it in the shorthand";
				}
				say(part, `a pair where only a ${slot} goes, ${invalid} (${fix})`);
			} else if (
				kind === "curve" &&
				part.kind === "var" &&
				part.time === "design"
			) {
				say(part, `a duration where only a curve goes, ${invalid}`);
			} else if (kind !== "curve" && part.curve === "design") {
				say(part, `a curve where only a time goes, ${invalid}`);
			}
		}
		return findings;
	}
	const known = (part, axis) =>
		part[axis] === "literal" || part[axis] === "design";
	const pair = parts.findIndex((part) => part.kind === "pair");
	if (pair !== -1) {
		const token = `var(${parts[pair].name})`;
		let after = 0;
		for (const [index, part] of parts.entries()) {
			if (index === pair) continue;
			if (known(part, "curve")) {
				say(
					part,
					`${index < pair ? "before" : "after"} ${token}, a broken pair: the pair carries its own curve, ${invalid}`,
				);
			} else if (known(part, "time")) {
				if (index < pair) {
					say(
						part,
						`before ${token}, so it is read as the duration and the pair's own duration as the delay`,
					);
				} else if (++after > 1) {
					say(part, `a third time beside ${token}, ${invalid}`);
				}
			}
		}
		return findings;
	}
	let curves = 0;
	let times = 0;
	for (const part of parts) {
		if (known(part, "curve") && ++curves > 1)
			say(part, `a second curve, ${invalid}`);
		if (known(part, "time") && ++times > 2)
			say(part, `a third time, ${invalid}`);
	}
	return findings;
}

function durationLiterals(part, shown, motion, strict) {
	const findings = [];
	for (const literal of part.literals) {
		if (!moves(literal.ms)) continue;
		const fix = durationFix(motion, literal.ms);
		if (strict) {
			findings.push({
				offset: literal.at,
				message: `${shown} has ${literal.text}, a literal duration (${fix})`,
			});
		} else if (!motion.timesUsed.some((ms) => near(ms, literal.ms))) {
			findings.push({
				offset: literal.at,
				message: `${shown} has ${literal.text}, no term's duration (${fix})`,
			});
		}
	}
	return findings;
}

function delayLiterals(part, shown, motion, strict) {
	const findings = [];
	for (const literal of part.literals) {
		if (!moves(literal.ms)) continue;
		const fix = delayFix(motion, literal.ms);
		if (strict) {
			findings.push({
				offset: literal.at,
				message: `${shown} has ${literal.text}, a literal delay (${fix})`,
			});
		} else if (!motion.delays.some((ms) => near(ms, literal.ms))) {
			findings.push({
				offset: literal.at,
				message: `${shown} has ${literal.text}, a delay off the scale (${fix})`,
			});
		}
	}
	return findings;
}

function curveLiteral(part, shown, motion, strict) {
	const fix = curveFix(motion, part.value);
	if (strict) {
		return [
			{
				offset: part.start,
				message: `${shown} has ${part.text}, a literal curve (${fix})`,
			},
		];
	}
	if (motion.curvesUsed.has(part.value)) return [];
	return [
		{
			offset: part.start,
			message: `${shown} has ${part.text}, no term's curve (${fix})`,
		},
	];
}

/**
 * The literal timings in one item of a transition or animation shorthand: its
 * duration and curve, taken together, and its delay. The first time is the
 * duration and the second the delay, as the browser reads them.
 */
function shorthandLiterals(parts, shown, motion, strict) {
	const findings = [];
	let slots = 0;
	let duration;
	let delay;
	let curve;
	for (const part of parts) {
		if (part.time) {
			if (slots === 0) duration = part;
			else if (slots === 1) delay = part;
			slots++;
		}
		if (part.curve && !curve) curve = part;
	}
	const literal = (part) =>
		part?.time === "literal" && part.literals.some((l) => moves(l.ms));
	// A computed duration: each number written in it must be a term's.
	if (literal(duration) && duration.kind === "math") {
		findings.push(...durationLiterals(duration, shown, motion, strict));
	}
	const time =
		literal(duration) && duration.kind === "literal" ? duration : undefined;
	const shape = curve?.curve === "literal" ? curve : undefined;
	if (time || shape) {
		const durations = durationsOf(duration, motion);
		const curves = curvesOf(curve, motion);
		const written = [time, shape]
			.filter(Boolean)
			.sort((a, b) => a.start - b.start);
		const text = written.map((part) => part.text).join(" ");
		const fix = timingFix(motion, durations, curves, duration, curve);
		let fits =
			(!shape || motion.curvesUsed.has(shape.value)) &&
			(!time || motion.timesUsed.some((ms) => near(ms, time.literals[0].ms)));
		const moving = durations?.filter(moves) ?? [];
		if (fits && curves && moving.length > 0) {
			fits = motion.pairs.some(
				(p) => curves.includes(p.curve) && moving.some((ms) => near(ms, p.ms)),
			);
		}
		if (strict) {
			const what = time && shape ? "timing" : time ? "duration" : "curve";
			findings.push({
				offset: written[0].start,
				message: `${shown} has ${text}, a literal ${what} (${fix})`,
			});
		} else if (!fits) {
			const eased = time && !curve ? " with the browser's ease" : "";
			findings.push({
				offset: written[0].start,
				message: `${shown} has ${text}${eased}, no term's timing (${fix})`,
			});
		}
	}
	if (literal(delay))
		findings.push(...delayLiterals(delay, shown, motion, strict));
	return findings;
}

/** Whether a declaration only zeroes motion, as base.css and the tokens do. */
function zeroes(found, text) {
	const value = text
		.slice(found.valueStart, found.valueEnd)
		.replace(/!\s*important\s*$/i, "")
		.trim()
		.toLowerCase();
	const zero = (item) => item.trim() === "0" || !moves(msOf(item) ?? 1);
	if (found.custom) return /^--kin-duration-/.test(found.name) && zero(value);
	const property = found.property.replace(/^-(?:webkit|moz|o|ms)-/, "");
	if (/^(?:animation|transition)(?:-name|-property)?$/.test(property)) {
		return value === "none";
	}
	if (/^(?:animation|transition)-(?:duration|delay)$/.test(property)) {
		return value.split(",").every(zero);
	}
	if (property === "animation-iteration-count") return value === "1";
	if (property === "scroll-behavior") return value === "auto";
	return false;
}

/**
 * Check one stylesheet. Lines and columns are 1-based positions in `css`; each
 * problem's severity is "error" or, outside strict mode, "warning".
 *
 * @param {string} css
 * @param {{ strict?: boolean, motion?: ReturnType<typeof readMotion>, component?: boolean, own?: boolean }} [options]
 *   `component`: the sheet is a component's <style> block; `own`: it is
 *   Design's, where kin- keyframes are defined.
 * @returns {{ declarations: number, problems: { line: number, column: number, message: string, severity: "error" | "warning" }[] }}
 */
export function checkCss(css, options = {}) {
	const {
		strict = false,
		motion = loadDesign().motion,
		component = false,
		own = false,
	} = options;
	const { text, comments } = maskCss(css);
	const where = lineIndex(css);
	const { blocks, declarations } = parseCss(text);
	const problems = [];
	const report = (offset, message, warning = false) =>
		problems.push({
			...where(offset),
			message,
			severity: warning && !strict ? "warning" : "error",
		});

	const { unreasoned, exempt } = exceptionNotes(text, comments, where, MARK);
	for (const offset of unreasoned) {
		report(offset, `${MARK} gives no reason (say why)`);
	}
	const spans = (from, to) => [
		where(from).line,
		where(Math.max(from, to)).line,
	];
	const signed = (block) => {
		for (let b = block; b; b = b.parent) {
			if (
				keyframesName(css, b) !== undefined &&
				exempt(...spans(b.at, b.open))
			) {
				return true;
			}
		}
		return false;
	};

	let count = 0;
	for (const found of declarations) {
		const raw = text.slice(found.valueStart, found.valueEnd);
		const important = /\s*!\s*important\s*$/i.exec(raw);
		const end = important
			? found.valueEnd - important[0].length
			: found.valueEnd;
		const kind = motionKind(found.property);
		const items = kind ? splitItems(text, found.valueStart, end) : [];
		const label = found.custom ? found.name : found.property;
		const shownItem = (index) => {
			const item = items[index];
			const body = item.length
				? collapse(text.slice(item[0].start, item.at(-1).end))
				: "";
			return `${label}: ${index > 0 ? "…, " : ""}${body}${index < items.length - 1 ? ", …" : ""}`;
		};
		const shownAt = (offset) => {
			if (!kind) return `${label}: ${collapse(raw)}`;
			const index = items.findIndex(
				(item) =>
					item.length && item[0].start <= offset && offset < item.at(-1).end,
			);
			return index === -1 ? `${label}: ${collapse(raw)}` : shownItem(index);
		};

		// Names: each must be Design's, and current; a fallback on one never applies.
		if (found.custom && MOTION_NAME.test(found.name)) {
			if (!motion.names.has(found.name) && !motion.deprecated.has(found.name)) {
				report(
					found.at,
					`${label}: ${collapse(raw)} sets ${found.name}, which Kinra Design does not define${didYouMean(found.name, motion)}`,
				);
			}
		}
		for (const call of varCalls(text, found.valueStart, found.valueEnd)) {
			if (!MOTION_NAME.test(call.name)) continue;
			const shown = shownAt(call.start);
			if (motion.deprecated.has(call.name)) {
				report(
					call.nameAt,
					`${shown} uses ${call.name}, which is deprecated (use instead: ${motion.deprecated.get(call.name)})`,
					true,
				);
			} else if (!motion.names.has(call.name)) {
				report(
					call.nameAt,
					`${shown} uses ${call.name}, which Kinra Design does not define${didYouMean(call.name, motion)}`,
				);
			}
			if (call.fallback && motion.names.has(call.name)) {
				report(
					call.fallback.start,
					call.fallback.text
						? `${shown} has ${collapse(call.fallback.text)}, a dead fallback: Kinra Design defines ${call.name}`
						: `${shown} has an empty fallback for ${call.name}, which Kinra Design defines`,
				);
			}
		}

		if (!kind) continue;
		count++;
		if (kind === "other") continue;
		const excused =
			exempt(...spans(found.at, found.valueEnd - 1)) || signed(found.block);
		for (const [index, item] of items.entries()) {
			const parts = item.map(classify);
			const shown = shownItem(index);
			const broken = structure(parts, kind, shown, motion);
			for (const { offset, message } of broken) report(offset, message);
			if (broken.length > 0 || excused) continue;
			const findings =
				kind === "shorthand"
					? shorthandLiterals(parts, shown, motion, strict)
					: parts.flatMap((part) => {
							if (kind === "curve") {
								return part.curve === "literal"
									? curveLiteral(part, shown, motion, strict)
									: [];
							}
							if (part.time !== "literal") return [];
							return kind === "delay"
								? delayLiterals(part, shown, motion, strict)
								: durationLiterals(part, shown, motion, strict);
						});
			for (const { offset, message } of findings) report(offset, message);
		}
	}

	// Keyframes: kin- names are Design's; a component takes the shared ones.
	const arrivals = list(motion.arrivals);
	for (const block of blocks) {
		const name = keyframesName(css, block);
		if (name === undefined) continue;
		if (name.replace(/^-global-/, "").startsWith("kin-") && !own) {
			report(
				block.at,
				`@keyframes ${name} takes a kin- name, which only Kinra Design defines (use ${arrivals}, or a name of the product's own)`,
			);
		} else if (strict && component && !exempt(...spans(block.at, block.open))) {
			report(
				block.at,
				`@keyframes ${name} is defined in a component (use ${arrivals}, or mark its signature: with a reason)`,
			);
		}
	}

	// A component's reduced-motion block that only repeats what Design does.
	if (component) {
		for (const block of blocks) {
			if (!/^@media\b/i.test(block.prelude) || !REDUCED.test(block.prelude)) {
				continue;
			}
			if (reduced(block.parent)) continue;
			const inside = declarations.filter((found) => {
				for (let b = found.block; b; b = b.parent) if (b === block) return true;
				return false;
			});
			if (inside.length > 0 && inside.every((found) => zeroes(found, text))) {
				report(
					block.at,
					`${collapse(block.prelude)} only zeroes motion, which base.css and the register tokens already do (remove it)`,
					true,
				);
			}
		}
	}

	problems.sort((a, b) => a.line - b.line || a.column - b.column);
	return { declarations: count, problems };
}

/**
 * Check a file's text: all of a stylesheet, or each <style> block of a
 * .svelte, .astro or .vue component, with lines and columns in the file. A
 * file in this package's src/styles or registry is Design's own.
 *
 * @param {string} source
 * @param {string} file
 * @param {Parameters<typeof checkCss>[1]} [options]
 */
export function checkSource(source, file, options = {}) {
	const extension = path.extname(file).toLowerCase();
	const own = options.own ?? isOwn(file);
	if (!COMPONENTS.has(extension)) return checkCss(source, { ...options, own });
	const result = { declarations: 0, problems: [] };
	for (const css of componentSheets(source, extension)) {
		const { declarations, problems } = checkCss(css, {
			...options,
			own,
			component: true,
		});
		result.declarations += declarations;
		result.problems.push(...problems);
	}
	return result;
}

function run(argv) {
	const parsed = parseArguments(argv, COMMAND, USAGE);
	if (typeof parsed === "number") return parsed;
	const { strict, quiet, targets } = parsed;

	let loaded;
	try {
		loaded = loadDesign();
	} catch (error) {
		console.error(`${COMMAND}: cannot read Kinra's motion tokens: ${error}`);
		return 2;
	}
	const files = targetFiles(targets, COMMAND);
	if (typeof files === "number") return files;

	let declarations = 0;
	let errors = 0;
	let warnings = 0;
	const lines = [];
	for (const file of files) {
		let source;
		try {
			source = readFileSync(file, "utf8");
		} catch (error) {
			console.error(`${COMMAND}: ${file}: ${error.message}`);
			return 2;
		}
		const result = checkSource(source, file, { strict, ...loaded });
		declarations += result.declarations;
		for (const { line, column, message, severity } of result.problems) {
			if (severity === "warning") warnings++;
			else errors++;
			lines.push(
				`${file}:${line}:${column}: ${severity === "warning" ? "warning: " : ""}${message}`,
			);
		}
	}
	const counted = `${plural(declarations, "declaration")} in ${plural(files.size, "file")}`;
	if (lines.length > 0) console.log(lines.join("\n"));
	if (errors > 0) {
		console.error(
			`${COMMAND}: ${plural(errors, "problem")}` +
				(warnings > 0 ? ` and ${plural(warnings, "warning")}` : "") +
				` in ${counted}` +
				(strict ? " (strict)" : ""),
		);
		return 1;
	}
	if (warnings > 0) {
		console.error(`${COMMAND}: ${plural(warnings, "warning")} in ${counted}`);
	} else if (!quiet) {
		console.log(
			`${COMMAND}: ${counted} on Kinra's ${strict ? "tokens" : "terms"}`,
		);
	}
	return 0;
}

if (invokedDirectly(import.meta.url))
	process.exitCode = run(process.argv.slice(2));
