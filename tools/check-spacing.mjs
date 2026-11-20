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
import { readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TOKENS = new URL("../src/styles/tokens.css", import.meta.url);
const STYLES = new URL("../src/styles/", import.meta.url);
const PATTERNS = new URL("../registry/patterns/", import.meta.url);

const REM_PX = 16;
const PILL_PX = 999;
const EPSILON = 1e-6;
const HAIRLINES = { spacing: [1, 2], radius: [1] };
const MARK = "off-scale:";

const EXTENSIONS = new Set([".css", ".svelte", ".astro", ".vue"]);
const COMPONENTS = new Set([".svelte", ".astro", ".vue"]);
const SKIPPED = new Set(["node_modules", ".svelte-kit", "dist", "build"]);

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

/**
 * Blank comments, strings and url() contents to spaces, keeping every line and
 * column where it was, and return the comments for their `off-scale:` notes.
 *
 * @param {string} css
 * @returns {{ text: string, comments: { start: number, end: number, text: string }[] }}
 */
export function maskCss(css) {
	const out = css.split("");
	const comments = [];
	const blank = (from, to) => {
		for (let k = from; k < to; k++) {
			if (out[k] !== "\n" && out[k] !== "\r") out[k] = " ";
		}
	};
	// From an opening quote to just past its close, or to the line's end.
	const skipString = (k) => {
		const quote = css[k++];
		while (k < css.length && css[k] !== quote && css[k] !== "\n") {
			k += css[k] === "\\" ? 2 : 1;
		}
		return css[k] === quote ? k + 1 : k;
	};
	for (let i = 0; i < css.length;) {
		const c = css[i];
		if (c === "/" && css[i + 1] === "*") {
			const close = css.indexOf("*/", i + 2);
			const end = close === -1 ? css.length : close + 2;
			comments.push({ start: i, end, text: css.slice(i + 2, end - 2) });
			blank(i, end);
			i = end;
		} else if (c === '"' || c === "'") {
			const end = skipString(i);
			blank(i, end);
			i = end;
		} else if (
			(c === "u" || c === "U") &&
			/^url\(/i.test(css.slice(i, i + 4)) &&
			!/[\w-]/.test(css[i - 1] ?? "")
		) {
			let k = i + 4;
			while (k < css.length && css[k] !== ")") {
				if (css[k] === '"' || css[k] === "'") k = skipString(k);
				else k += css[k] === "\\" ? 2 : 1;
			}
			blank(i + 4, k);
			i = k;
		} else {
			i++;
		}
	}
	return { text: out.join(""), comments };
}

/** Every custom property definition: name to its values, in source order. */
function customProperties(css) {
	const { text } = maskCss(css);
	const found = new Map();
	for (const [, name, value] of text.matchAll(
		/(?<![\w-])(--[\w-]+)\s*:\s*([^;{}]*)/g,
	)) {
		found.set(name, [
			...(found.get(name) ?? []),
			value.trim().replace(/\s+/g, " "),
		]);
	}
	return found;
}

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

function lineIndex(text) {
	const starts = [0];
	for (let i = 0; i < text.length; i++) {
		if (text[i] === "\n") starts.push(i + 1);
	}
	return (offset) => {
		let low = 0;
		let high = starts.length - 1;
		while (low < high) {
			const middle = (low + high + 1) >> 1;
			if (starts[middle] <= offset) low = middle;
			else high = middle - 1;
		}
		return { line: low + 1, column: offset - starts[low] + 1 };
	};
}

/**
 * Each declaration in masked CSS, at any nesting depth (rules, @media,
 * @layer, @container, @supports, & rules), with its property and the offsets
 * of its name and value. Declarations in @keyframes are left out.
 */
function* declarations(text) {
	const keyframes = [];
	let start = 0;
	let parens = 0;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (c === "(") parens++;
		else if (c === ")") parens = Math.max(0, parens - 1);
		else if (c === "{") {
			const prelude = text.slice(start, i).trim();
			keyframes.push(
				keyframes.at(-1) === true ||
					/^@(?:-[a-z]+-)?keyframes\b/i.test(prelude),
			);
			start = i + 1;
			parens = 0;
		} else if (c === "}" || (c === ";" && parens === 0)) {
			if (keyframes.length > 0 && keyframes.at(-1) === false) {
				const found = declaration(text, start, i);
				if (found) yield found;
			}
			if (c === "}") {
				keyframes.pop();
				parens = 0;
			}
			start = i + 1;
		}
	}
}

function declaration(text, start, end) {
	const match = /^(\s*)(-?-?[A-Za-z_][\w-]*)\s*:/.exec(text.slice(start, end));
	if (!match || match[2].startsWith("--")) return null;
	let valueEnd = end;
	while (valueEnd > start && /\s/.test(text[valueEnd - 1])) valueEnd--;
	return {
		property: match[2].toLowerCase(),
		at: start + match[1].length,
		valueStart: start + match[0].length,
		valueEnd,
	};
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

	const notes = [];
	for (const comment of comments) {
		const mark = comment.text.indexOf(MARK);
		if (mark === -1) continue;
		const first = where(comment.start);
		const before = text.slice(comment.start - first.column + 1, comment.start);
		const reason = comment.text.slice(mark + MARK.length);
		const note = {
			first: first.line,
			last: where(comment.end - 1).line,
			// A comment trailing a declaration belongs to that line only.
			alone: /^\s*$|[{}]\s*$/.test(before),
			reason: /[\p{L}\p{N}]/u.test(reason),
		};
		if (!note.reason) {
			report(comment.start + 2 + mark, `${MARK} gives no reason (say why)`);
		}
		notes.push(note);
	}
	const exempt = (first, last) =>
		notes.some(
			(note) =>
				note.reason &&
				((note.first <= last && note.last >= first) ||
					(note.alone && note.last === first - 1)),
		);

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
 * The content ranges of a component's <style> blocks, skipping HTML comments,
 * <script> blocks and an Astro frontmatter fence. A block in another language
 * (lang="scss") is skipped.
 *
 * @param {string} source
 * @param {string} [extension]
 * @returns {{ start: number, end: number }[]}
 */
export function styleBlocks(source, extension = ".svelte") {
	const blocks = [];
	const pattern =
		/<!--[\s\S]*?(?:-->|$)|<script(?=[\s>])[^>]*>[\s\S]*?(?:<\/script\s*>|$)|<style(?=[\s>])([^>]*)>([\s\S]*?)<\/style\s*>/gi;
	if (extension === ".astro") {
		pattern.lastIndex =
			/^﻿?\s*---[^\n]*\n[\s\S]*?\n---/.exec(source)?.[0].length ?? 0;
	}
	for (let match; (match = pattern.exec(source));) {
		if (match[2] === undefined) continue;
		const lang = /\blang\s*=\s*["']?([\w-]+)/i.exec(match[1])?.[1];
		if (lang && !/^(?:css|postcss)$/i.test(lang)) continue;
		const start = match.index + "<style".length + match[1].length + 1;
		blocks.push({ start, end: start + match[2].length });
	}
	return blocks;
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
	for (const { start, end } of styleBlocks(source, extension)) {
		// Blank everything before the block so positions stay the file's own.
		const css =
			source.slice(0, start).replace(/[^\r\n]/g, " ") +
			source.slice(start, end);
		const { declarations, problems } = checkCss(css, options);
		result.declarations += declarations;
		result.problems.push(...problems);
	}
	return result;
}

function listFiles(directory, extensions = EXTENSIONS) {
	const files = [];
	const entries = readdirSync(directory, { withFileTypes: true }).sort(
		(a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
	);
	for (const entry of entries) {
		if (entry.name.startsWith(".") || SKIPPED.has(entry.name)) continue;
		const full = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...listFiles(full, extensions));
		else if (
			extensions.has(path.extname(entry.name).toLowerCase()) &&
			(entry.isFile() || (entry.isSymbolicLink() && isFile(full)))
		) {
			files.push(full);
		}
	}
	return files;
}

function isFile(file) {
	try {
		return statSync(file).isFile();
	} catch {
		return false;
	}
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function run(argv) {
	let strict = false;
	let quiet = false;
	let options = true;
	const targets = [];
	for (const arg of argv) {
		if (options && arg === "--") options = false;
		else if (options && arg === "--strict") strict = true;
		else if (options && arg === "--quiet") quiet = true;
		else if (options && (arg === "--help" || arg === "-h")) {
			console.log(USAGE);
			return 0;
		} else if (options && arg.startsWith("-") && arg !== "-") {
			console.error(`kinra-check-spacing: unknown option ${arg}\n\n${USAGE}`);
			return 2;
		} else targets.push(arg);
	}
	if (targets.length === 0) {
		console.error(USAGE);
		return 2;
	}

	let loaded;
	try {
		loaded = loadDesign();
	} catch (error) {
		console.error(`kinra-check-spacing: cannot read Kinra's scale: ${error}`);
		return 2;
	}
	const files = new Set();
	for (const target of targets) {
		let stats;
		try {
			stats = statSync(target);
		} catch {
			console.error(
				`kinra-check-spacing: ${target}: no such file or directory`,
			);
			return 2;
		}
		for (const file of stats.isDirectory() ? listFiles(target) : [target]) {
			files.add(file);
		}
	}

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

function invokedDirectly() {
	try {
		return (
			realpathSync(process.argv[1]) ===
			realpathSync(fileURLToPath(import.meta.url))
		);
	} catch {
		return false;
	}
}

if (invokedDirectly()) process.exitCode = run(process.argv.slice(2));
