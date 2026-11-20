/*
 * @kinra/web/motion: the motion terms of docs/motion.md, read where an element
 * stands, for script that moves what CSS cannot.
 *
 * No number lives here. A term's duration and curve are the computed
 * --kin-duration-<term> and --kin-motion-<term> of the element being moved, so
 * a subtree's register (data-kin-motion) holds and a product never mirrors
 * Design's values. With less motion every term reads 0ms; a loop's period
 * does not, since it also times the loop's still form.
 *
 * Nothing runs on import, so the module loads in Node and in a server render.
 * Reading a term needs a document with @kinra/web/styles/tokens.css loaded,
 * and throws, naming the token, without one.
 */

const PREFIX = "@kinra/web/motion";
const LESS = "(prefers-reduced-motion: reduce)";
// The loops of work in flight, whose periods are never 0.
const LOOPS = new Set(["trace", "sweep", "pulse", "pass"]);
// The CSS keywords by their control points (CSS Easing Functions 1).
const KEYWORDS = new Map([
	["ease", [0.25, 0.1, 0.25, 1]],
	["ease-in", [0.42, 0, 1, 1]],
	["ease-out", [0, 0, 0.58, 1]],
	["ease-in-out", [0.42, 0, 0.58, 1]],
]);
const POSITIONS = new Set([
	"jump-start",
	"jump-end",
	"jump-none",
	"jump-both",
	"start",
	"end",
]);
const NUMBER = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/;
const TIME = /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(?:e([+-]?\d+))?(ms|s)$/;
// The solver stops within this distance of the time asked for. It is fine
// enough that a curve flat at one end, where a little time is a lot of
// progress, still lands within 1e-5.
const EPSILON = 1e-9;

// Every curve takes progress from 0 to 1 and holds its ends outside them.
const linear = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t);

/** Whether the reader asked for less motion. False where there is no window. */
export function reduced() {
	return typeof matchMedia === "function" && matchMedia(LESS).matches;
}

/**
 * Calls `fn` with the new answer whenever the reader's preference for less
 * motion changes. Returns the unsubscribe function.
 */
export function onReduced(fn) {
	if (typeof matchMedia !== "function") return () => {};
	const query = matchMedia(LESS);
	const change = (event) => fn(event.matches);
	query.addEventListener("change", change);
	return () => query.removeEventListener("change", change);
}

/**
 * A term's duration and curve where `element` stands: `ms` for a timer or
 * the Web Animations API, 0 with less motion; `easing`, the curve as CSS
 * writes it; and `ease`, the same curve as a function of progress.
 */
export function motion(term, element = globalThis.document?.documentElement) {
	if (term === "stagger")
		throw new RangeError(
			`${PREFIX}: stagger is the step between members arriving together, with no curve of its own. Read it with stagger(element).`,
		);
	const style = computed(element, `motion("${term}")`);
	const ms = duration(style, `--kin-duration-${term}`);
	const name = `--kin-motion-${term}`;
	const pair = token(style, name);
	// The pair is a duration and a curve, in either order. The duration comes
	// from its own token, above; the pair gives the curve.
	const parts = pair.match(/[^\s()]+(?:\([^()]*\))?/g) ?? [];
	const curves = parts.filter((part) => !TIME.test(part.toLowerCase()));
	if (curves.length > 1 || parts.length - curves.length !== 1)
		throw new SyntaxError(
			`${PREFIX}: ${name} is "${pair}", not a duration and a curve`,
		);
	// A pair with no curve takes CSS's own default.
	const css = curves[0] ?? "ease";
	let ease;
	try {
		ease = easing(css);
	} catch (error) {
		throw new SyntaxError(
			`${PREFIX}: ${name} is "${pair}", whose curve the reader cannot follow`,
			{ cause: error },
		);
	}
	return { ms: reduced() ? 0 : ms, easing: css, ease };
}

/**
 * A loop's period in milliseconds where `element` stands. It never reads 0,
 * not even with less motion, since a still form and a timer keep its time.
 */
export function period(loop, element = globalThis.document?.documentElement) {
	if (!LOOPS.has(loop))
		throw new RangeError(
			`${PREFIX}: ${loop} is not a loop. The loops of work in flight are trace, sweep, pulse and pass.`,
		);
	const name = `--kin-duration-${loop}`;
	const ms = duration(computed(element, `period("${loop}")`), name);
	if (ms > 0) return ms;
	throw new RangeError(
		`${PREFIX}: ${name} is 0ms, but a loop's period is never 0: it also times the loop's still form`,
	);
}

/**
 * The step between the members of a group arriving together, in milliseconds
 * where `element` stands: 0 in the productive register and with less motion.
 */
export function stagger(element = globalThis.document?.documentElement) {
	const ms = duration(computed(element, "stagger()"), "--kin-duration-stagger");
	return reduced() ? 0 : ms;
}

/**
 * A CSS cubic-bezier() as a function of progress, solved by Newton's method
 * then bisection. x1 and x2 lie between 0 and 1, as CSS requires.
 */
export function bezier(x1, y1, x2, y2) {
	const points = [x1, y1, x2, y2];
	if (!points.every(Number.isFinite))
		throw new TypeError(
			`${PREFIX}: bezier() takes four finite numbers, not ${points.join(", ")}`,
		);
	if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1)
		throw new RangeError(
			`${PREFIX}: a curve's x1 and x2 lie between 0 and 1, not ${x1} and ${x2}`,
		);
	if (x1 === y1 && x2 === y2) return linear;
	// Each coordinate is a cubic in the curve's own parameter: ((a t + b) t + c) t.
	const cx = 3 * x1;
	const bx = 3 * (x2 - x1) - cx;
	const ax = 1 - cx - bx;
	const cy = 3 * y1;
	const by = 3 * (y2 - y1) - cy;
	const ay = 1 - cy - by;
	const x = (t) => ((ax * t + bx) * t + cx) * t;
	const y = (t) => ((ay * t + by) * t + cy) * t;
	const slope = (t) => (3 * ax * t + 2 * bx) * t + cx;
	return (progress) => {
		if (progress <= 0) return 0;
		if (progress >= 1) return 1;
		let t = progress;
		for (let step = 0; step < 8; step++) {
			const error = x(t) - progress;
			if (Math.abs(error) < EPSILON) return y(t);
			const d = slope(t);
			if (Math.abs(d) < 1e-6) break;
			t -= error / d;
			if (t < 0 || t > 1) break;
		}
		// Newton's method met a flat stretch or left the curve. Bisection always
		// lands, since x rises from 0 to 1 when x1 and x2 lie between them.
		let low = 0;
		let high = 1;
		t = progress;
		for (let step = 0; step < 40; step++) {
			const error = x(t) - progress;
			if (Math.abs(error) < EPSILON) break;
			if (error < 0) low = t;
			else high = t;
			t = (low + high) / 2;
		}
		return y(t);
	};
}

/**
 * A CSS timing function as a function of progress: linear, ease, ease-in,
 * ease-out, ease-in-out, step-start, step-end, cubic-bezier() written any way
 * CSS allows, or steps() with any step position.
 */
export function easing(css) {
	const text = String(css).trim().toLowerCase();
	if (text === "linear") return linear;
	const keyword = KEYWORDS.get(text);
	if (keyword) return bezier(...keyword);
	if (text === "step-start") return steps(1, "jump-start");
	if (text === "step-end") return steps(1, "jump-end");
	const call = /^(cubic-bezier|steps)\(([^()]*)\)$/.exec(text);
	const args = call ? call[2].split(",").map((arg) => arg.trim()) : [];
	if (call?.[1] === "cubic-bezier") {
		if (args.length === 4 && args.every((arg) => NUMBER.test(arg)))
			return bezier(...args.map(Number));
	} else if (call?.[1] === "steps") {
		const [count, position = "end"] = args;
		if (args.length <= 2 && /^\+?\d+$/.test(count) && POSITIONS.has(position))
			return steps(Number(count), position);
	}
	throw new SyntaxError(
		`${PREFIX}: "${css}" is not a timing function the reader takes: linear, ease, ease-in, ease-out, ease-in-out, step-start, step-end, cubic-bezier() or steps()`,
	);
}

// steps(), as CSS Easing Functions 1 computes it for progress from 0 to 1.
function steps(count, position) {
	const jumps =
		position === "jump-none"
			? count - 1
			: position === "jump-both"
				? count + 1
				: count;
	if (count < 1 || jumps < 1)
		throw new RangeError(
			`${PREFIX}: steps(${count}, ${position}) needs at least ${position === "jump-none" ? "two steps" : "one step"}`,
		);
	const early =
		position === "jump-start" ||
		position === "start" ||
		position === "jump-both";
	return (progress) =>
		Math.min(Math.floor(linear(progress) * count) + (early ? 1 : 0), jumps) /
		jumps;
}

function computed(element, call) {
	if (!element)
		throw new Error(
			`${PREFIX}: ${call} needs an element in a document. It reads computed styles, so call it in the browser.`,
		);
	const view = element.ownerDocument?.defaultView ?? globalThis;
	return view.getComputedStyle(element);
}

function token(style, name) {
	const value = style.getPropertyValue(name).trim();
	if (value) return value;
	throw new Error(
		`${PREFIX}: ${name} is not defined where the element stands. Load @kinra/web/styles/tokens.css before reading motion, and name a term from docs/motion.md.`,
	);
}

function duration(style, name) {
	const text = token(style, name);
	const match = TIME.exec(text.toLowerCase());
	// Shift the decimal point rather than multiply, since 1.005 * 1000 is
	// 1004.9999999999999; adding 0 turns -0ms into 0.
	const ms = match
		? Number(
				`${match[1]}e${Number(match[2] ?? 0) + (match[3] === "s" ? 3 : 0)}`,
			) + 0
		: NaN;
	if (Number.isFinite(ms) && ms >= 0) return ms;
	throw new SyntaxError(
		`${PREFIX}: ${name} is "${text}", not a duration in ms or s`,
	);
}
