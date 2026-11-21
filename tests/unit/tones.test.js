import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
	SHIPPED,
	STEP,
	TEXT,
	ladder,
	okl,
	over,
	pairs,
	ratio,
} from "../../examples/reference/src/scripts/tones-math.ts";

// docs/catalog.md#tones owns graphite's ladder: its tones stand one step
// apart in OKLCH lightness, so a plane holds its edge with no line. This holds
// tokens.css to the catalog's table, the table to the rule, and the /tones/
// page's shipped ladder to both.
const read = (path) =>
	readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const tokens = read("src/styles/tokens.css");
const catalog = read("docs/catalog.md");

/** A token's graphite value: the second argument of its light-dark(). */
function graphite(name) {
	const at = tokens.indexOf(`\t${name}:`);
	assert.ok(at >= 0, `tokens.css declares ${name}`);
	const value = tokens
		.slice(at + name.length + 2, tokens.indexOf(";", at))
		.trim();
	if (!value.startsWith("light-dark(")) return value;
	const inner = value.slice("light-dark(".length, value.lastIndexOf(")"));
	let depth = 0;
	for (let index = 0; index < inner.length; index++) {
		const char = inner[index];
		if (char === "(") depth++;
		else if (char === ")") depth--;
		else if (char === "," && depth === 0) return inner.slice(index + 1).trim();
	}
	assert.fail(`${name} has two arguments in its light-dark()`);
}

/** A percentage as a fraction, exact to the tenth of a point tokens use. */
const fraction = (percent) => Math.round(Number(percent) * 10) / 1000;

/** The alpha of a translucent layer: ink by color-mix, or black by rgb(). */
function alpha(written) {
	const value = written
		.replace(/\s+/g, " ")
		.replace(/\( /g, "(")
		.replace(/,? \)/g, ")");
	const mix = value.match(
		/^color-mix\(in srgb, var\(--kin-color-text\) ([\d.]+)%, transparent\)$/,
	);
	if (mix) return fraction(mix[1]);
	const black = value.match(/^rgb\(0 0 0 \/ ([\d.]+)\)$/);
	assert.ok(black, `${value} is ink or black at an alpha`);
	return Number(black[1]);
}

function rows() {
	const start = catalog.indexOf("<!-- tones:graphite -->");
	const end = catalog.indexOf("<!-- /tones:graphite -->");
	assert.ok(start >= 0 && end > start, "docs/catalog.md marks its tones table");
	return catalog
		.slice(start, end)
		.split("\n")
		.filter((line) => line.startsWith("| `--kin-"))
		.map((line) =>
			line
				.replace(/^\||\|$/g, "")
				.split("|")
				.map((cell) => cell.trim().replaceAll("`", "")),
		);
}

const tones = rows().filter(([, value]) => value.startsWith("#"));
const layers = rows().filter(([, value]) => !value.startsWith("#"));
const shipped = {
	"--kin-color-ground-deep": SHIPPED.deep,
	"--kin-color-ground": SHIPPED.ground,
	"--kin-color-surface": SHIPPED.surface,
	"--kin-color-surface-raised": SHIPPED.raised,
	"--kin-color-rule": SHIPPED.rule,
	"--kin-color-rule-strong": SHIPPED.ruleStrong,
	"--kin-color-control-edge": SHIPPED.edge,
	"--kin-color-text-muted": SHIPPED.muted,
	"--kin-surface-card": SHIPPED.card,
	"--kin-surface-hover": SHIPPED.hover,
	"--kin-surface-well": SHIPPED.well,
	"--kin-surface-well-hover": SHIPPED.wellHover,
};

test("the catalog's table lists every graphite tone and layer once", () => {
	assert.deepEqual(
		rows()
			.map(([name]) => name)
			.sort(),
		Object.keys(shipped).sort(),
	);
});

test("tokens.css holds the catalog's graphite tones", () => {
	for (const [name, value, lightness] of tones) {
		assert.equal(graphite(name), value, name);
		assert.equal(okl(value).toFixed(3), lightness, `${name}'s lightness`);
		assert.equal(shipped[name], value, `/tones/ ships ${name} as listed`);
	}
});

test("tokens.css holds the catalog's layers, each its listed step from its plane", () => {
	const card = over(TEXT, SHIPPED.card, SHIPPED.surface);
	const planes = { panel: SHIPPED.surface, card };
	for (const [name, value, steps] of layers) {
		const [, ink, percent] = value.match(/^(text|black) at ([\d.]+)%$/);
		const listed = fraction(percent);
		assert.equal(alpha(graphite(name)), listed, name);
		assert.equal(shipped[name], listed, `/tones/ ships ${name} as listed`);
		const [, sign, size, plane] = steps.match(
			/^([+−])([\d.]+) (?:over|under) a (panel|card)$/,
		);
		const base = planes[plane];
		const top = over(ink === "text" ? TEXT : "#000000", listed, base);
		const measured = (okl(top) - okl(base)) / STEP;
		const expected = (sign === "−" ? -1 : 1) * Number(size);
		assert.ok(
			Math.abs(measured - expected) < 0.006,
			`${name} is ${measured.toFixed(2)} steps from its plane, not ${expected}`,
		);
	}
});

test("the shipped ladder is the one /tones/ computes from its step", () => {
	assert.deepEqual(ladder({ step: STEP, deep: STEP, lift: 0.02 }), SHIPPED);
});

test("graphite's tones stand one step apart", () => {
	const { deep, ground, surface, raised } = SHIPPED;
	for (const [below, above, what] of [
		[deep, ground, "ground-deep to the page"],
		[ground, surface, "the page to the surface"],
		[surface, raised, "the surface to a raised layer"],
	]) {
		const gap = okl(above) - okl(below);
		assert.ok(
			Math.abs(gap - STEP) < 0.005,
			`${what} is ${gap.toFixed(4)} apart, not ${STEP}`,
		);
	}
});

test("planes that meet with no line stand at least 0.8 of a step apart", () => {
	for (const { name, a, b } of pairs(SHIPPED)) {
		const gap = Math.abs(okl(b) - okl(a));
		assert.ok(
			gap >= 0.8 * STEP,
			`${name} stands ${gap.toFixed(4)} apart, under 0.8 of a step`,
		);
	}
});

test("text, edges and code keep their contrast on graphite", () => {
	const card = over(TEXT, SHIPPED.card, SHIPPED.surface);
	const lightest = over(TEXT, SHIPPED.hover, SHIPPED.raised);
	const muted = graphite("--kin-color-text-muted");
	const edge = graphite("--kin-color-control-edge");
	assert.ok(ratio(muted, lightest) >= 4.5, "muted text on the lightest tone");
	assert.ok(ratio(muted, card) >= 4.5, "muted text on a card");
	assert.ok(ratio(edge, card) >= 3, "the control edge on a card");
	assert.ok(ratio(edge, SHIPPED.raised) >= 3, "the control edge, raised");
	for (const role of [
		"--kin-color-code-string",
		"--kin-color-code-keyword",
		"--kin-color-code-name",
		"--kin-color-text-muted",
	]) {
		for (const ground of ["--kin-color-ground-deep", "--kin-color-surface"]) {
			assert.ok(
				ratio(graphite(role), graphite(ground)) >= 4.5,
				`${role} on ${ground}`,
			);
		}
	}
});
