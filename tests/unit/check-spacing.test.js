import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
	checkCss,
	checkSource,
	loadDesign,
	readScale,
	styleBlocks,
} from "../../tools/check-spacing.mjs";

const TOOL = fileURLToPath(
	new URL("../../tools/check-spacing.mjs", import.meta.url),
);
const design = loadDesign();

/** Each problem as "line:column message". */
function problems(css, options = {}) {
	return checkCss(css, { ...design, ...options }).problems.map(
		({ line, column, message }) => `${line}:${column} ${message}`,
	);
}

describe("the scale", () => {
	test("comes from Design's own tokens.css", () => {
		const { spacing, radius } = design.scale;
		assert.deepEqual(
			[...spacing.keys()],
			[4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 104],
		);
		assert.deepEqual(spacing.get(8), ["--kin-space-2"]);
		assert.deepEqual(spacing.get(104), ["--kin-space-12"]);
		assert.deepEqual(radius.get(6), ["--kin-radius-row"]);
		for (const px of [2, 4, 6, 8, 12, 16, 18]) assert.ok(radius.has(px), px);
	});

	test("resolves radius aliases to their length", () => {
		const { radius } = design.scale;
		assert.deepEqual(radius.get(12), ["--kin-radius-lg", "--kin-radius-panel"]);
		assert.deepEqual(radius.get(8), ["--kin-radius-md", "--kin-radius-layer"]);
		const aliased = readScale(`:root {
			--kin-space-1: 0.25rem;
			--kin-radius-row: var(--kin-radius-base);
			--kin-radius-base: 0.375rem;
			--kin-radius-loop: var(--kin-radius-loop);
			--kin-radius-tint: color-mix(in srgb, red 4%, blue);
		}`);
		assert.deepEqual(
			[...aliased.radius],
			[[6, ["--kin-radius-row", "--kin-radius-base"]]],
		);
	});

	test("refuses tokens without spacing steps", () => {
		assert.throws(() => readScale(":root { --kin-radius-sm: 4px; }"), /no/);
	});

	test("collects names Design defines and the hooks it reads", () => {
		assert.ok(design.defined.has("--kin-space-12"));
		assert.ok(design.defined.has("--kin-shell-inset"));
		assert.ok(design.defined.has("--kin-grid-cell-pad"));
		assert.ok(!design.defined.has("--kin-space-13"));
	});
});

describe("scale mode", () => {
	test("passes rem and px on the scale, hairlines and zero", () => {
		assert.deepEqual(
			problems(`.a {
				padding: 0.5rem 0.75rem;
				margin: 16px 104px 0 0px;
				gap: 1px;
				row-gap: 2px;
				inset: 0rem;
				margin-block-start: 6.5rem;
			}`),
			[],
		);
	});

	test("fails an off-scale length with the nearest steps in its unit", () => {
		assert.deepEqual(problems(".a { padding: 0.6rem; }"), [
			"1:15 padding: 0.6rem has 0.6rem, off the scale (nearest 0.5rem or 0.75rem)",
		]);
		assert.deepEqual(problems(".a { gap: 6px; }"), [
			"1:11 gap: 6px has 6px, off the scale (nearest 4px or 8px)",
		]);
		assert.deepEqual(problems(".a { margin-top: 7rem; }"), [
			"1:18 margin-top: 7rem has 7rem, off the scale (nearest 6.5rem)",
		]);
	});

	test("checks every length inside calc(), clamp(), min() and max()", () => {
		assert.deepEqual(
			problems(`.a {
				margin-inline-start: calc(2rem + 0.3125rem);
				padding-block: clamp(1rem, 3vw, 2.6rem);
				gap: min(0.5rem, max(3px, 1vw));
				padding: calc(var(--kin-space-2) * 1.5);
			}`),
			[
				"2:38 margin-inline-start: calc(2rem + 0.3125rem) has 0.3125rem, off the scale (nearest 0.25rem or 0.5rem)",
				"3:37 padding-block: clamp(1rem, 3vw, 2.6rem) has 2.6rem, off the scale (nearest 2.5rem or 3rem)",
				"4:26 gap: min(0.5rem, max(3px, 1vw)) has 3px, off the scale (nearest 2px or 4px)",
			],
		);
	});

	test("ignores em, %, viewport units, ch, in and var()", () => {
		assert.deepEqual(
			problems(`.a {
				padding: 0.3em 2% var(--kin-space-2) 3ch;
				margin: 1in 5vw 7vh 3dvh;
				gap: var(--relay-gap, 1em);
			}`),
			[],
		);
	});

	test("takes a negative length by its size", () => {
		assert.deepEqual(problems(".a { margin: -1rem -0.5rem; }"), []);
		assert.deepEqual(problems(".a { top: -0.6rem; }"), [
			"1:11 top: -0.6rem has -0.6rem, off the scale (nearest 0.5rem or 0.75rem)",
		]);
	});

	test("checks positions, scroll spacing and logical longhands", () => {
		const found = problems(`.a {
			top: 5px;
			left: 5px;
			inset-inline-end: 5px;
			scroll-padding-top: 5px;
			scroll-margin-block: 5px;
			margin-inline-end: 5px;
			padding-block-start: 5px;
			column-gap: 5px;
		}`);
		assert.equal(found.length, 8);
	});

	test("leaves other properties alone", () => {
		assert.deepEqual(
			problems(".a { width: 5px; font-size: 0.6rem; line-height: 7px; }"),
			[],
		);
	});
});

describe("strict mode", () => {
	test("rejects raw lengths on the scale and names the token", () => {
		assert.deepEqual(problems(".a { padding: 0.5rem; }", { strict: true }), [
			"1:15 padding: 0.5rem has 0.5rem, a raw length (use var(--kin-space-2))",
		]);
		assert.deepEqual(problems(".a { gap: 0.6rem; }", { strict: true }), [
			"1:11 gap: 0.6rem has 0.6rem, a raw length off the scale (nearest var(--kin-space-2) or var(--kin-space-3))",
		]);
	});

	test("accepts tokens, zero, hairlines and other units", () => {
		assert.deepEqual(
			problems(
				`.a {
					padding: var(--kin-space-2) 0 1px 2px;
					margin: 0rem 1em 5%;
					border-radius: var(--kin-radius-row) 1px 999px 50%;
				}`,
				{ strict: true },
			),
			[],
		);
	});

	test("rejects a raw radius but a hairline or pill", () => {
		assert.deepEqual(problems(".a { border-radius: 2px; }", { strict: true }), [
			"1:21 border-radius: 2px has 2px, a raw length (use var(--kin-radius-mark))",
		]);
	});
});

describe("Design's names", () => {
	const typo = ".a { padding: var(--kin-space-13); }";
	const message =
		"1:19 padding: var(--kin-space-13) uses --kin-space-13, which Kinra Design does not define";

	test("an unknown --kin-* name fails in both modes", () => {
		assert.deepEqual(problems(typo), [message]);
		assert.deepEqual(problems(typo, { strict: true }), [message]);
	});

	test("a fallback does not excuse an unknown name", () => {
		assert.equal(
			problems(".a { gap: var(--kin-gap-typo, var(--kin-space-2)); }").length,
			1,
		);
	});

	test("a product's own custom properties are its own", () => {
		assert.deepEqual(
			problems(".a { padding: var(--relay-x); gap: var(--space-y, 0); }", {
				strict: true,
			}),
			[],
		);
	});

	test("an off-scale note does not excuse an unknown name", () => {
		assert.deepEqual(
			problems(
				".a { padding: var(--kin-space-13); /* off-scale: a reason */ }",
			),
			[message],
		);
	});
});

describe("off-scale notes", () => {
	test("exempt a declaration on the same line or the line before", () => {
		assert.deepEqual(
			problems(`.a {
				gap: 0.625rem; /* off-scale: the chart's tick spacing */
				/* off-scale: lines up with the 36px avatar beside it */
				padding-inline-start: 2.625rem;
				/*
				 * off-scale: a comment over several lines
				 */
				margin: 3px;
				padding: 0.3125rem;
			}`),
			[
				"9:14 padding: 0.3125rem has 0.3125rem, off the scale (nearest 0.25rem or 0.5rem)",
			],
		);
	});

	test("exempt strict mode too", () => {
		assert.deepEqual(
			problems(".a { padding: 0.5rem; /* off-scale: matches the icon */ }", {
				strict: true,
			}),
			[],
		);
	});

	test("trailing one declaration do not carry to the next line", () => {
		assert.deepEqual(
			problems(`.a {
				gap: 0.625rem; /* off-scale: the chart's ticks */
				padding: 0.3125rem;
			}`),
			[
				"3:14 padding: 0.3125rem has 0.3125rem, off the scale (nearest 0.25rem or 0.5rem)",
			],
		);
	});

	test("without a reason are an error and exempt nothing", () => {
		assert.deepEqual(problems(".a {\n  /* off-scale: */\n  gap: 6px;\n}"), [
			"2:6 off-scale: gives no reason (say why)",
			"3:8 gap: 6px has 6px, off the scale (nearest 4px or 8px)",
		]);
	});

	test("in other comments are not read as CSS", () => {
		assert.deepEqual(
			problems("/* padding: 0.625rem in prose */\n.a { gap: 1rem; }"),
			[],
		);
	});
});

describe("what is skipped", () => {
	test("custom property definitions", () => {
		const result = checkCss(
			":root { --relay-pad: 0.6rem; --kin-local: var(--kin-space-13); }",
			design,
		);
		assert.deepEqual(result, { declarations: 0, problems: [] });
	});

	test("declarations in @keyframes", () => {
		assert.deepEqual(
			problems(`@keyframes slide {
				from { margin-top: 7px; }
				50% { inset: 0.3rem; }
				to { margin-top: 0; }
			}
			@-webkit-keyframes slide { from { top: 3px } }
			.a { margin-top: 3px; }`),
			["7:21 margin-top: 3px has 3px, off the scale (nearest 2px or 4px)"],
		);
	});

	test("strings, url() and selectors", () => {
		assert.deepEqual(
			problems(`.a[data-x="padding: 3px;"] {
				background: url(data:image/svg+xml;padding:3px);
				content: "gap: 3px; }";
				padding: 4px;
			}`),
			[],
		);
	});
});

describe("radius", () => {
	test("takes Kinra's radii, a pill or a percentage", () => {
		assert.deepEqual(
			problems(`.a {
				border-radius: 6px;
				border-radius: 0.375rem;
				border-radius: 999px;
				border-radius: 9999px;
				border-radius: 50%;
				border-radius: 1px;
				border-top-left-radius: 1.125rem;
				border-start-end-radius: var(--kin-radius-layer);
			}`),
			[],
		);
	});

	test("fails a corner off them, longhands and logical forms too", () => {
		assert.deepEqual(
			problems(`.a {
				border-radius: 5px;
				border-bottom-right-radius: 0.625rem;
				border-end-start-radius: 24px;
			}`),
			[
				"2:20 border-radius: 5px has 5px, off the scale (nearest 4px or 6px)",
				"3:33 border-bottom-right-radius: 0.625rem has 0.625rem, off the scale (nearest 0.5rem or 0.75rem)",
				"4:30 border-end-start-radius: 24px has 24px, off the scale (nearest 18px or a 999px pill)",
			],
		);
	});
});

describe("structure", () => {
	test("finds declarations in nested @media, @layer, @container and & rules", () => {
		assert.deepEqual(
			problems(`@layer product {
				@media (min-width: 40rem) {
					.a {
						gap: 0.5rem;
						&:hover { padding: 5px }
						@container (width > 3px) { margin: 0.6rem; }
					}
				}
				@supports (display: grid) { .b { inset: 7px; } }
			}`),
			[
				"5:26 padding: 5px has 5px, off the scale (nearest 4px or 8px)",
				"6:42 margin: 0.6rem has 0.6rem, off the scale (nearest 0.5rem or 0.75rem)",
				"9:45 inset: 7px has 7px, off the scale (nearest 4px or 8px)",
			],
		);
	});

	test("reads a value over several lines", () => {
		assert.deepEqual(
			problems(`.a {
				padding:
					calc(var(--kin-space-2) + 1px)
					0.6rem
					var(--kin-space-3) !important;
			}`),
			[
				"4:6 padding: calc(var(--kin-space-2) + 1px) 0.6rem var(--kin-space-3) !important has 0.6rem, off the scale (nearest 0.5rem or 0.75rem)",
			],
		);
	});

	test("reads a last declaration without its semicolon", () => {
		assert.deepEqual(problems(".a { color: red; gap: 3px }"), [
			"1:23 gap: 3px has 3px, off the scale (nearest 2px or 4px)",
		]);
	});

	test("counts the declarations it checks", () => {
		const { declarations } = checkCss(
			".a { padding: 0; color: red; gap: 1rem; --x: 1px; }",
			design,
		);
		assert.equal(declarations, 2);
	});
});

describe("components", () => {
	test("Svelte <style> blocks keep the file's lines", () => {
		const source = [
			"<script>",
			"  const css = '<style>.x { gap: 3px; }</style>';",
			"  const padding = '0.625rem';",
			"</script>",
			"<!-- <style>.y { gap: 3px; }</style> -->",
			'<p style="padding: 0.625rem">{css}</p>',
			"<style>",
			"  :global(.a) {",
			"    gap: 0.875rem;",
			"  }",
			"</style>",
		].join("\n");
		const { declarations, problems: found } = checkSource(
			source,
			"A.svelte",
			design,
		);
		assert.equal(declarations, 1);
		assert.deepEqual(found, [
			{
				line: 9,
				column: 10,
				message:
					"gap: 0.875rem has 0.875rem, off the scale (nearest 0.75rem or 1rem)",
			},
		]);
	});

	test("Astro skips its frontmatter and reads <style is:global>", () => {
		const source = [
			"---",
			"const style = '<style>.x { gap: 3px; }</style>';",
			"---",
			"<div class='a'></div>",
			"<style is:global>",
			"  .a { margin: 5px; }",
			"</style>",
		].join("\n");
		assert.deepEqual(
			checkSource(source, "Page.astro", design).problems.map((p) => p.line),
			[6],
		);
	});

	test("Vue blocks in another language are left to their own tools", () => {
		const source =
			'<style lang="scss">.a { gap: 3px; }</style>\n<style scoped>.b { gap: 5px; }</style>';
		assert.equal(styleBlocks(source, ".vue").length, 1);
		assert.equal(checkSource(source, "A.vue", design).problems.length, 1);
	});
});

describe("the command", () => {
	const directory = mkdtempSync(path.join(os.tmpdir(), "kinra-check-spacing-"));
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

	const clean = write("clean/app.css", ".a { padding: var(--kin-space-2); }\n");
	write(
		"clean/Card.svelte",
		"<div></div>\n<style>\n  .b { gap: 1rem; }\n</style>\n",
	);
	write("clean/node_modules/dep/off.css", ".c { gap: 3px; }\n");
	write("clean/.svelte-kit/off.css", ".c { gap: 3px; }\n");
	write("clean/notes.txt", "gap: 3px;\n");
	write("dirty/app.css", ".a {\n  padding: 0.6rem;\n}\n");

	test("prints usage and exits 2 without a path", () => {
		const result = run();
		assert.equal(result.status, 2);
		assert.match(result.stderr, /usage: kinra-check-spacing/);
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
			"kinra-check-spacing: 2 declarations in 2 files on Kinra's scale\n",
		);
	});

	test("prints nothing on success with --quiet", () => {
		const result = run("--quiet", "--strict", clean);
		assert.equal(result.status, 0);
		assert.equal(result.stdout, "");
	});

	test("exits 1 with one line per problem", () => {
		const result = run("dirty", "clean");
		assert.equal(result.status, 1);
		assert.equal(
			result.stdout,
			`${path.join("dirty", "app.css")}:2:12: padding: 0.6rem has 0.6rem, off the scale (nearest 0.5rem or 0.75rem)\n`,
		);
		assert.match(result.stderr, /1 problem in 3 declarations in 3 files/);
	});

	test("applies --strict", () => {
		const result = run("--strict", "clean");
		assert.equal(result.status, 1);
		assert.match(
			result.stdout,
			/Card\.svelte:3:13: gap: 1rem has 1rem, a raw length \(use var\(--kin-space-4\)\)/,
		);
	});
});
