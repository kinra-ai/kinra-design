/*
 * What Kinra's checks (kinra-check-spacing, kinra-check-motion) share for
 * reading CSS: comments and strings masked with every line and column kept,
 * declarations and blocks at any depth, a component's <style> blocks, the
 * comment notes that excuse an exception, and the files a command was given.
 *
 * Zero dependencies: products install Design without its devDependencies.
 */
import { readdirSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const EXTENSIONS = new Set([".css", ".svelte", ".astro", ".vue"]);
export const COMPONENTS = new Set([".svelte", ".astro", ".vue"]);
const SKIPPED = new Set(["node_modules", ".svelte-kit", "dist", "build"]);
const KEYFRAMES = /^@(?:-[a-z]+-)?keyframes\b/i;

/**
 * Blank comments, strings and url() contents to spaces, keeping every line and
 * column where it was, and return the comments for the notes they carry.
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

/**
 * Every custom property definition: name to its values, in source order.
 *
 * @param {string} css
 * @returns {Map<string, string[]>}
 */
export function customProperties(css) {
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

/**
 * A function from an offset in `text` to its 1-based line and column.
 *
 * @param {string} text
 * @returns {(offset: number) => { line: number, column: number }}
 */
export function lineIndex(text) {
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
 * @typedef {object} Block
 * @property {string} prelude the selector or at-rule before the brace, trimmed
 * @property {number} at the offset of the prelude's first character
 * @property {number} open the offset of the opening brace
 * @property {number | undefined} close the offset of the closing brace
 * @property {Block | undefined} parent
 * @property {boolean} keyframes whether it is, or sits inside, @keyframes
 *
 * @typedef {object} Declaration
 * @property {string} name as written
 * @property {string} property lowercased
 * @property {boolean} custom whether it defines a custom property
 * @property {number} at the offset of its name
 * @property {number} valueStart
 * @property {number} valueEnd the offset just past its value, before spaces
 * @property {Block} block the innermost block around it
 */

/**
 * Every block and every declaration inside one, at any nesting depth (rules,
 * @media, @layer, @container, @supports, & rules and @keyframes), from masked
 * CSS. A declaration's block chain records where it sits.
 *
 * @param {string} text masked CSS, from maskCss
 * @returns {{ blocks: Block[], declarations: Declaration[] }}
 */
export function parseCss(text) {
	const blocks = [];
	const declarations = [];
	const stack = [];
	let start = 0;
	let parens = 0;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (c === "(") parens++;
		else if (c === ")") parens = Math.max(0, parens - 1);
		else if (c === "{") {
			const raw = text.slice(start, i);
			const prelude = raw.trim();
			const parent = stack.at(-1);
			const block = {
				prelude,
				at: start + raw.length - raw.trimStart().length,
				open: i,
				close: undefined,
				parent,
				keyframes: parent?.keyframes === true || KEYFRAMES.test(prelude),
			};
			blocks.push(block);
			stack.push(block);
			start = i + 1;
			parens = 0;
		} else if (c === "}" || (c === ";" && parens === 0)) {
			const block = stack.at(-1);
			if (block) {
				const found = declaration(text, start, i, block);
				if (found) declarations.push(found);
			}
			if (c === "}") {
				const closed = stack.pop();
				if (closed) closed.close = i;
				parens = 0;
			}
			start = i + 1;
		}
	}
	return { blocks, declarations };
}

function declaration(text, start, end, block) {
	const match = /^(\s*)(-?-?[A-Za-z_][\w-]*)\s*:/.exec(text.slice(start, end));
	if (!match) return null;
	let valueEnd = end;
	while (valueEnd > start && /\s/.test(text[valueEnd - 1])) valueEnd--;
	return {
		name: match[2],
		property: match[2].toLowerCase(),
		custom: match[2].startsWith("--"),
		at: start + match[1].length,
		valueStart: start + match[0].length,
		valueEnd,
		block,
	};
}

/**
 * The notes that excuse an exception: comments containing `mark` (such as
 * `off-scale:`) and a reason after it. A note excuses what shares its lines,
 * and, when it stands on its own line, what starts on the line after it ends.
 * A note without a reason excuses nothing; `unreasoned` holds the offset of
 * each such mark.
 *
 * @param {string} text masked CSS
 * @param {{ start: number, end: number, text: string }[]} comments from maskCss
 * @param {ReturnType<typeof lineIndex>} where
 * @param {string} mark
 */
export function exceptionNotes(text, comments, where, mark) {
	const notes = [];
	const unreasoned = [];
	for (const comment of comments) {
		const at = comment.text.indexOf(mark);
		if (at === -1) continue;
		const first = where(comment.start);
		const before = text.slice(comment.start - first.column + 1, comment.start);
		const note = {
			first: first.line,
			last: where(comment.end - 1).line,
			// A comment trailing a declaration belongs to that line only.
			alone: /^\s*$|[{}]\s*$/.test(before),
			reason: /[\p{L}\p{N}]/u.test(comment.text.slice(at + mark.length)),
		};
		if (!note.reason) unreasoned.push(comment.start + 2 + at);
		notes.push(note);
	}
	/** Whether a note excuses what runs from line `first` to line `last`. */
	const exempt = (first, last) =>
		notes.some(
			(note) =>
				note.reason &&
				((note.first <= last && note.last >= first) ||
					(note.alone && note.last === first - 1)),
		);
	return { unreasoned, exempt };
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
 * Each <style> block of a component as a stylesheet of its own, with
 * everything before the block blanked so lines and columns stay the file's.
 *
 * @param {string} source
 * @param {string} extension
 * @returns {string[]}
 */
export function componentSheets(source, extension) {
	return styleBlocks(source, extension).map(
		({ start, end }) =>
			source.slice(0, start).replace(/[^\r\n]/g, " ") +
			source.slice(start, end),
	);
}

/**
 * Every checkable file under a directory, sorted, skipping hidden entries,
 * dependencies and build output.
 *
 * @param {string} directory
 * @param {Set<string>} [extensions]
 * @returns {string[]}
 */
export function listFiles(directory, extensions = EXTENSIONS) {
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

/**
 * A command's options and paths, or the exit code when it cannot run: 0 after
 * --help, 2 for an unknown option or no path.
 *
 * @param {string[]} argv
 * @param {string} command
 * @param {string} usage
 * @returns {{ strict: boolean, quiet: boolean, targets: string[] } | number}
 */
export function parseArguments(argv, command, usage) {
	let strict = false;
	let quiet = false;
	let options = true;
	const targets = [];
	for (const arg of argv) {
		if (options && arg === "--") options = false;
		else if (options && arg === "--strict") strict = true;
		else if (options && arg === "--quiet") quiet = true;
		else if (options && (arg === "--help" || arg === "-h")) {
			console.log(usage);
			return 0;
		} else if (options && arg.startsWith("-") && arg !== "-") {
			console.error(`${command}: unknown option ${arg}\n\n${usage}`);
			return 2;
		} else targets.push(arg);
	}
	if (targets.length === 0) {
		console.error(usage);
		return 2;
	}
	return { strict, quiet, targets };
}

/**
 * The files the given paths name, directories searched, or 2 when a path does
 * not exist.
 *
 * @param {string[]} targets
 * @param {string} command
 * @returns {Set<string> | number}
 */
export function targetFiles(targets, command) {
	const files = new Set();
	for (const target of targets) {
		let stats;
		try {
			stats = statSync(target);
		} catch {
			console.error(`${command}: ${target}: no such file or directory`);
			return 2;
		}
		for (const file of stats.isDirectory() ? listFiles(target) : [target]) {
			files.add(file);
		}
	}
	return files;
}

export const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * Whether the module at `url` is the script node was started with, so a
 * command runs when invoked and stays quiet when imported.
 *
 * @param {string} url the module's import.meta.url
 */
export function invokedDirectly(url) {
	try {
		return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(url));
	} catch {
		return false;
	}
}
