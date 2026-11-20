import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

// @kinra/web/motion outside a browser: its curves are pure functions, and
// loading it touches nothing, so a server render or a check can import it.
const root = fileURLToPath(new URL("../../", import.meta.url));
const source = pathToFileURL(path.join(root, "src/motion/motion.js")).href;
const reader = await import(source);
const { bezier, easing } = reader;

// Design's curves (docs/motion.md) and CSS's keywords, by control points.
const curves = {
	out: [0.16, 1, 0.3, 1],
	in: [0.7, 0, 0.84, 0],
	standard: [0.4, 0, 0.2, 1],
	bloom: [0.2, 0, 0, 1],
	morph: [0.4, 0, 0, 1],
	ease: [0.25, 0.1, 0.25, 1],
	"ease-in": [0.42, 0, 1, 1],
	"ease-out": [0, 0, 0.58, 1],
	"ease-in-out": [0.42, 0, 0.58, 1],
	// Flat at one end, where Newton's method gives way to bisection.
	"flat start": [0, 0, 0, 1],
	"flat end": [1, 0, 1, 1],
};
const grid = Array.from({ length: 1001 }, (_, index) => index / 1000);

// A point on the curve at its own parameter t, computed directly.
function point([x1, y1, x2, y2], t) {
	const at = (a, b) =>
		3 * a * (1 - t) ** 2 * t + 3 * b * (1 - t) * t ** 2 + t ** 3;
	return [at(x1, x2), at(y1, y2)];
}

test("importing the module touches no DOM", async () => {
	const globals = [
		"window",
		"document",
		"navigator",
		"matchMedia",
		"getComputedStyle",
		"requestAnimationFrame",
		"IntersectionObserver",
		"ResizeObserver",
		"addEventListener",
	];
	const saved = globals.map((name) => [
		name,
		Object.getOwnPropertyDescriptor(globalThis, name),
	]);
	const touched = [];
	for (const name of globals)
		Object.defineProperty(globalThis, name, {
			configurable: true,
			get() {
				touched.push(name);
				return undefined;
			},
		});
	let fresh;
	try {
		// A new URL evaluates the module again, under the traps.
		fresh = await import(`${source}?import=${Date.now()}`);
	} finally {
		for (const [name, descriptor] of saved) {
			if (descriptor) Object.defineProperty(globalThis, name, descriptor);
			else delete globalThis[name];
		}
	}
	assert.deepEqual(touched, []);
	assert.deepEqual(Object.keys(fresh).sort(), [
		"bezier",
		"easing",
		"motion",
		"onReduced",
		"period",
		"reduced",
		"stagger",
	]);
});

test("each curve lands on its ends and never runs backwards", () => {
	for (const [name, points] of Object.entries(curves)) {
		const ease = bezier(...points);
		assert.equal(ease(0), 0, `${name} at 0`);
		assert.equal(ease(1), 1, `${name} at 1`);
		assert.equal(ease(-0.5), 0, `${name} before it starts`);
		assert.equal(ease(1.5), 1, `${name} after it ends`);
		let before = 0;
		for (const t of grid) {
			const value = ease(t);
			assert.ok(value >= before - 1e-9, `${name} runs back at ${t}`);
			before = value;
		}
	}
});

test("the solver finds the curve's own points", () => {
	const overshoot = [0.34, 1.56, 0.64, 1];
	for (const [name, points] of Object.entries({ ...curves, overshoot })) {
		const ease = bezier(...points);
		for (const t of grid) {
			const [x, y] = point(points, t);
			assert.ok(
				Math.abs(ease(x) - y) < 1e-5,
				`${name}: ${ease(x)} at ${x}, not ${y}`,
			);
		}
	}
});

test("out has covered more than 82% of its distance a quarter of the way in", () => {
	const out = bezier(...curves.out);
	assert.ok(out(0.25) > 0.82, `out(0.25) is ${out(0.25)}`);
	// And in has barely started at half time, as the motion doc says.
	assert.ok(bezier(...curves.in)(0.5) < 0.03);
});

test("linear is the identity", () => {
	for (const ease of [
		bezier(0, 0, 1, 1),
		bezier(0.3, 0.3, 0.6, 0.6),
		easing("linear"),
	]) {
		for (const t of grid) assert.equal(ease(t), t);
		assert.equal(ease(-1), 0);
		assert.equal(ease(2), 1);
	}
});

test("easing() reads a curve however CSS writes it", () => {
	const out = bezier(...curves.out);
	for (const css of [
		"cubic-bezier(0.16, 1, 0.3, 1)",
		"cubic-bezier(.16,1,.3,1)",
		"  CUBIC-BEZIER( 0.16 ,1,  0.3 , 1 )\n",
		"cubic-bezier(1.6e-1, 1, 3e-1, +1)",
	]) {
		const ease = easing(css);
		for (const t of grid) assert.equal(ease(t), out(t), `${css} at ${t}`);
	}
	for (const keyword of ["ease", "ease-in", "ease-out", "ease-in-out"]) {
		const ease = easing(keyword);
		const expected = bezier(...curves[keyword]);
		for (const t of grid) assert.equal(ease(t), expected(t), keyword);
	}
	// A curve may overshoot its value, though no term does.
	assert.ok(easing("cubic-bezier(0.34, 1.56, 0.64, 1)")(0.5) > 1);
});

test("steps() jumps where CSS says", () => {
	const cases = {
		"steps(1, end)": [
			[0, 0],
			[0.5, 0],
			[0.999, 0],
			[1, 1],
		],
		"step-end": [
			[0, 0],
			[0.999, 0],
			[1, 1],
		],
		"steps(1, start)": [
			[0, 1],
			[0.5, 1],
		],
		"step-start": [
			[0, 1],
			[1, 1],
		],
		"steps(4)": [
			[0, 0],
			[0.24, 0],
			[0.25, 0.25],
			[0.5, 0.5],
			[0.99, 0.75],
			[1, 1],
		],
		"steps(4, jump-end)": [
			[0.24, 0],
			[0.25, 0.25],
			[1, 1],
		],
		"steps(4, jump-start)": [
			[0, 0.25],
			[0.25, 0.5],
			[0.75, 1],
			[1, 1],
		],
		"steps(4, jump-none)": [
			[0, 0],
			[0.25, 1 / 3],
			[0.5, 2 / 3],
			[0.75, 1],
			[1, 1],
		],
		"steps(3, jump-both)": [
			[0, 0.25],
			[1 / 3, 0.5],
			[2 / 3, 0.75],
			[1, 1],
		],
		"STEPS( 2 , START )": [
			[0, 0.5],
			[0.5, 1],
		],
	};
	for (const [css, expected] of Object.entries(cases)) {
		const ease = easing(css);
		for (const [t, value] of expected)
			assert.equal(ease(t), value, `${css} at ${t}`);
	}
});

test("easing() refuses what is not a timing function", () => {
	for (const css of [
		"",
		"bounce",
		"180ms ease",
		"cubic-bezier(0, 0, 1)",
		"cubic-bezier(0, 0, 1, 1, 0)",
		"cubic-bezier(a, 0, 1, 1)",
		"cubic-bezier (0, 0, 1, 1)",
		"steps(1.5)",
		"steps(-1)",
		"steps(2, middle)",
		"linear(0, 1)",
	]) {
		assert.throws(() => easing(css), SyntaxError, css);
	}
	for (const css of [
		"cubic-bezier(1.2, 0, 0, 1)",
		"cubic-bezier(0, 0, -0.1, 1)",
		"steps(0)",
		"steps(1, jump-none)",
	]) {
		assert.throws(() => easing(css), RangeError, css);
	}
	assert.throws(() => bezier(0, 0, 1), TypeError);
	assert.throws(() => bezier(0, Number.NaN, 1, 1), TypeError);
});

test("without a document the reader says what it needs", () => {
	assert.equal(typeof globalThis.document, "undefined");
	assert.throws(
		() => reader.motion("appear"),
		/needs an element in a document/,
	);
	assert.throws(() => reader.stagger(), /needs an element in a document/);
	// What the call itself gets wrong is said first.
	assert.throws(() => reader.period("appear"), {
		name: "RangeError",
		message: /not a loop/,
	});
	assert.throws(() => reader.motion("stagger"), /stagger\(element\)/);
	assert.equal(reader.reduced(), false);
	const unsubscribe = reader.onReduced(() => assert.fail("no window"));
	assert.equal(typeof unsubscribe, "function");
	unsubscribe();
});

// An element whose computed style holds the given tokens, as a page would.
const standing = (tokens) => ({
	ownerDocument: {
		defaultView: {
			getComputedStyle: () => ({
				getPropertyValue: (name) => tokens[name] ?? "",
			}),
		},
	},
});

test("a duration reads in ms, written in ms or s", () => {
	const read = (time) =>
		reader.motion(
			"appear",
			standing({
				"--kin-duration-appear": time,
				"--kin-motion-appear": `${time} cubic-bezier(0.16, 1, 0.3, 1)`,
			}),
		).ms;
	// Exactly, where multiplying by 1000 would land on 1004.9999999999999.
	assert.equal(read("1.005s"), 1005);
	assert.equal(read("1.6s"), 1600);
	assert.equal(read(".36s"), 360);
	assert.equal(read("120ms"), 120);
	assert.equal(read("120MS"), 120);
	assert.equal(read("1e3ms"), 1000);
	assert.ok(Object.is(read("-0ms"), 0));
	for (const time of ["", "0", "120", "-5ms", "1e400s", "calc(1s)", "fast"]) {
		assert.throws(() => read(time), /--kin-duration-appear/, time);
	}
	const pass = standing({ "--kin-duration-pass": "1.05s" });
	assert.equal(reader.period("pass", pass), 1050);
	assert.throws(
		() => reader.period("pass", standing({ "--kin-duration-pass": "0ms" })),
		/never 0/,
	);
});

test("motion() takes the curve from the term's pair", () => {
	const read = (pair) =>
		reader.motion(
			"pass",
			standing({ "--kin-duration-pass": "1.05s", "--kin-motion-pass": pair }),
		);
	const steps = read("1.05s steps(1, end)");
	assert.equal(steps.ms, 1050);
	assert.equal(steps.easing, "steps(1, end)");
	assert.equal(steps.ease(0.99), 0);
	// In either order, and with CSS's default when the pair names no curve.
	assert.equal(read("linear 1.05s").easing, "linear");
	assert.equal(read("1.05s").easing, "ease");
	for (const pair of ["steps(1, end)", "1s 2s linear", "1s ease linear"]) {
		assert.throws(() => read(pair), /not a duration and a curve/, pair);
	}
	assert.throws(() => read("1s bounce"), /--kin-motion-pass/);
});
