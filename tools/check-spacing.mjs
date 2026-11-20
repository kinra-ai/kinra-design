#!/usr/bin/env node
/*
 * kinra-check-spacing: hold a product's spacing and corners to Kinra's scale.
 *
 * The scale is read from Design's own src/styles/tokens.css each run, so a
 * product never copies Design's numbers. Spacing takes the steps
 * --kin-space-1 to --kin-space-12; a corner takes any --kin-radius-* that
 * resolves to a length. Zero, the 1px and 2px hairlines (1px for a corner), a
 * pill of 999px or more, and every unit but px and rem always pass.
 *
 * Checked: padding, margin, inset, top, right, bottom, left, gap, row-gap,
 * column-gap, scroll-padding and scroll-margin with all their longhands, and
 * border-radius with all of its. Custom property definitions and @keyframes
 * are not. Every px or rem number in a checked value counts, inside calc(),
 * clamp(), min(), max() and a var() fallback too.
 *
 * --strict allows no raw px or rem length but zero, the hairlines and a pill:
 * the value comes from var(--kin-*) or another unit. In either mode a
 * var(--kin-*) must name a property Design defines or reads.
 *
 * A deliberate exception says why in a comment containing `off-scale:`, on the
 * declaration's line or ending on the line before it. It exempts the value from
 * the scale, never a misspelt --kin-* name.
 *
 * Zero dependencies: products install Design without its devDependencies.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
	COMPONENTS,
	componentSheets,
	customProperties,
	exceptionNotes,
	invokedDirectly,
	lineIndex,
	listFiles,
	maskCss,
	parseArguments,
	parseCss,
	plural,
	targetFiles,
} from "./css.mjs";

export { maskCss, styleBlocks } from "./css.mjs";

const TOKENS = new URL("../src/styles/tokens.css", import.meta.url);
const STYLES = new URL("../src/styles/", import.meta.url);
const PATTERNS = new URL("../registry/patterns/", import.meta.url);

const REM_PX = 16;
const PILL_PX = 999;
const EPSILON = 1e-6;
const HAIRLINES = { spacing: [1, 2], radius: [1] };
const MARK = "off-scale:";

const SPACING =
	/^(?:(?:padding|margin|scroll-padding|scroll-margin)(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?|inset(?:-(?:block|inline)(?:-(?:start|end))?)?|top|right|bottom|left|(?:grid-)?(?:row-|column-)?gap)$/;
const RADIUS =
	/^border(?:-(?:top|bottom)-(?:left|right)|-(?:start|end)-(?:start|end))?-radius$/;
const LENGTH = /(?<![\w.-])[+-]?(\d+(?:\.\d+)?|\.\d+)(px|rem)(?![\w-])/gi;
const KIN_VAR = /\bvar\(\s*(--kin-[\w-]+)/g;
const KIN_NAME = /(?<![\w-])--kin-[\w-]+/g;

const USAGE = `usage: kinra-check-spacing [--strict] [--quiet] <file or directory>...

Checks spacing and corner radii in .css files and in the <style> blocks of
.svelte, .astro and .vue files against Kinra Design's scale.

  --strict  allow no raw px or rem length but 0, hairlines and a pill;
            take the value from var(--kin-*) or another unit
  --quiet   print nothing when every declaration passes

A deliberate exception says why in a comment containing "off-scale:" on the
declaration's line or on the line before it.`;

const round = (n) => Number(n.toFixed(4));
const near = (a, b) => Math.abs(a - b) < EPSILON;
const toPx = (number, unit) =>
	Number(number) * (unit.toLowerCase() === "rem" ? REM_PX : 1);

/**
 * Kinra's scale from the text of tokens.css: each step in px, with the token
 * names that resolve to it, ascending. Aliases such as
 * `--kin-radius-panel: var(--kin-radius-lg)` resolve to their length.
 *
 * @param {string} tokensCss
 * @returns {{ spacing: Map<number, string[]>, radius: Map<number, string[]> }}
 */
export function readScale(tokensCss) {
	const definitions = customProperties(tokensCss);
	const lengths = (name, seen = new Set()) => {
		if (seen.has(name)) return [];
		seen.add(name);
		return (definitions.get(name) ?? []).flatMap((value) => {
			const alias = /^var\(\s*(--[\w-]+)\s*(?:,.*)?\)$/s.exec(value);
			if (alias) return lengths(alias[1], seen);
			const length = /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(px|rem)$/i.exec(value);
			return length ? [toPx(length[1], length[2])] : [];
		});
	};
	const collect = (pattern) => {
		const found = new Map();
		for (const name of definitions.keys()) {
			if (!pattern.test(name)) continue;
			for (const px of new Set(lengths(name).map(round))) {
				found.set(px, [...(found.get(px) ?? []), name]);
			}
		}
		return new Map([...found].sort(([a], [b]) => a - b));
	};
	const spacing = collect(/^--kin-space-\d+$/);
	const radius = collect(/^--kin-radius-[\w-]+$/);
	if (spacing.size === 0) {
		throw new Error("tokens.css defines no --kin-space-* step");
	}
	return { spacing, radius };
}

/**
 * Every --kin-* name the given stylesheets define or read (a hook such as
 * `var(--kin-grid-cell-pad, …)` is Design's name even where Design leaves it
 * unset). Comments and strings do not count.
 *
 * @param {...string} stylesheets
 * @returns {Set<string>}
 */
export function readDefined(...stylesheets) {
	const names = new Set();
	for (const css of stylesheets) {
		for (const [name] of maskCss(css).text.matchAll(KIN_NAME)) names.add(name);
	}
	return names;
}

let design;

/**
 * Read Design's scale and names from the files beside this tool: tokens.css
 * for the scale; every src/styles/*.css and registry pattern stylesheet for
 * the names.
 */
export function loadDesign() {
	if (!design) {
		const sheets = [
			...readdirSync(STYLES)
				.filter((name) => name.endsWith(".css"))
				.map((name) => fileURLToPath(new URL(name, STYLES))),
			...listFiles(fileURLToPath(PATTERNS), new Set([".css"])),
		].map((file) => readFileSync(file, "utf8"));
		design = {
			scale: readScale(readFileSync(TOKENS, "utf8")),
			defined: readDefined(...sheets),
		};
	}
	return design;
}

/**
 * Each declaration in masked CSS, at any nesting depth (rules, @media,
 * @layer, @container, @supports, & rules), with its property and the offsets
 * of its name and value. Declarations in @keyframes are left out.
 */
function* declarations(text) {
	for (const found of parseCss(text).declarations) {
		if (!found.custom && !found.block.keyframes) yield found;
	}
}

/** The steps a value may take, in px, ascending, without the pill. */
function steps(kind, scale) {
	const named = kind === "radius" ? scale.radius : scale.spacing;
	return [...new Set([0, ...HAIRLINES[kind], ...named.keys()])].sort(
		(a, b) => a - b,
	);
}

function token(kind, px, scale) {
	const named = kind === "radius" ? scale.radius : scale.spacing;
	for (const [step, names] of named) if (near(step, px)) return names[0];
	return undefined;
}

function format(px, unit) {
	if (px === 0) return "0";
	return unit === "rem" ? `${round(px / REM_PX)}rem` : `${round(px)}px`;
}

function nearest(kind, px, unit, scale, strict) {
	const list = steps(kind, scale);
	const label = (step) => {
		const name = strict ? token(kind, step, scale) : undefined;
		return name ? `var(${name})` : format(step, unit);
	};
	const below = list.findLast((step) => step < px - EPSILON);
	const above = list.find((step) => step > px + EPSILON);
	const found = [label(below ?? 0)];
	if (above !== undefined) found.push(label(above));
	else if (kind === "radius") found.push(`a ${PILL_PX}px pill`);
	return found.join(" or ");
}

/** Why a length breaks the rule, or undefined when it keeps it. */
function verdict(kind, px, unit, scale, strict) {
	const pill = kind === "radius" && px >= PILL_PX - EPSILON;
	if (pill || HAIRLINES[kind].some((step) => near(step, px))) return undefined;
	const named = token(kind, px, scale);
	if (!strict) {
		if (named) return undefined;
		return `off the scale (nearest ${nearest(kind, px, unit, scale, false)})`;
	}
	if (named) return `a raw length (use var(${named}))`;
	return `a raw length off the scale (nearest ${nearest(kind, px, unit, scale, true)})`;
}

/**
 * Check one stylesheet. Lines and columns are 1-based positions in `css`.
 *
 * @param {string} css
 * @param {{ strict?: boolean, scale?: ReturnType<typeof readScale>, defined?: Set<string> }} [options]
 * @returns {{ declarations: number, problems: { line: number, column: number, message: string }[] }}
 */
export function checkCss(css, options = {}) {
	const {
		strict = false,
		scale = loadDesign().scale,
		defined = loadDesign().defined,
	} = options;
	const { text, comments } = maskCss(css);
	const where = lineIndex(css);
	const problems = [];
	const report = (offset, message) =>
		problems.push({ ...where(offset), message });

	const { unreasoned, exempt } = exceptionNotes(text, comments, where, MARK);
	for (const offset of unreasoned) {
		report(offset, `${MARK} gives no reason (say why)`);
	}

	let count = 0;
	for (const found of declarations(text)) {
		const property = found.property.replace(/^-(?:webkit|moz)-/, "");
		const kind = SPACING.test(property)
			? "spacing"
			: RADIUS.test(property)
				? "radius"
				: undefined;
		if (!kind) continue;
		count++;
		const value = text.slice(found.valueStart, found.valueEnd);
		const shown = `${found.property}: ${value.trim().replace(/\s+/g, " ")}`;
		for (const match of value.matchAll(KIN_VAR)) {
			if (defined.has(match[1])) continue;
			report(
				found.valueStart + match.index + match[0].indexOf("--"),
				`${shown} uses ${match[1]}, which Kinra Design does not define`,
			);
		}
		const lines = [where(found.at).line, where(found.valueEnd - 1).line];
		if (exempt(...lines)) continue;
		for (const match of value.matchAll(LENGTH)) {
			const unit = match[2].toLowerCase();
			const px = toPx(match[1], unit);
			if (px < EPSILON) continue;
			const why = verdict(kind, px, unit, scale, strict);
			if (why) {
				report(
					found.valueStart + match.index,
					`${shown} has ${match[0]}, ${why}`,
				);
			}
		}
	}
	problems.sort((a, b) => a.line - b.line || a.column - b.column);
	return { declarations: count, problems };
}

/**
 * Check a file's text: all of a stylesheet, or each <style> block of a
 * .svelte, .astro or .vue component, with lines and columns in the file.
 *
 * @param {string} source
 * @param {string} file
 * @param {Parameters<typeof checkCss>[1]} [options]
 */
export function checkSource(source, file, options = {}) {
	const extension = path.extname(file).toLowerCase();
	if (!COMPONENTS.has(extension)) return checkCss(source, options);
	const result = { declarations: 0, problems: [] };
	for (const css of componentSheets(source, extension)) {
		const { declarations, problems } = checkCss(css, options);
		result.declarations += declarations;
		result.problems.push(...problems);
	}
	return result;
}

function run(argv) {
	const parsed = parseArguments(argv, "kinra-check-spacing", USAGE);
	if (typeof parsed === "number") return parsed;
	const { strict, quiet, targets } = parsed;

	let loaded;
	try {
		loaded = loadDesign();
	} catch (error) {
		console.error(`kinra-check-spacing: cannot read Kinra's scale: ${error}`);
		return 2;
	}
	const files = targetFiles(targets, "kinra-check-spacing");
	if (typeof files === "number") return files;

	let declarations = 0;
	let problems = 0;
	const lines = [];
	for (const file of files) {
		const result = checkSource(readFileSync(file, "utf8"), file, {
			strict,
			...loaded,
		});
		declarations += result.declarations;
		problems += result.problems.length;
		for (const { line, column, message } of result.problems) {
			lines.push(`${file}:${line}:${column}: ${message}`);
		}
	}
	const counted = `${plural(declarations, "declaration")} in ${plural(files.size, "file")}`;
	if (problems > 0) {
		console.log(lines.join("\n"));
		console.error(
			`kinra-check-spacing: ${plural(problems, "problem")} in ${counted}` +
				(strict ? " (strict)" : ""),
		);
		return 1;
	}
	if (!quiet) {
		console.log(
			`kinra-check-spacing: ${counted} on Kinra's ${strict ? "tokens" : "scale"}`,
		);
	}
	return 0;
}

if (invokedDirectly(import.meta.url))
	process.exitCode = run(process.argv.slice(2));
