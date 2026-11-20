import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// docs/motion.md is the owning source of the motion vocabulary, read by people
// and models alike. Its values are tested against tokens.css in the browser
// suite; this keeps its shape: every term defined the same way, every word it
// retires mapped to a term, and every correction tied to a rule.
const doc = readFileSync(
	new URL("../../docs/motion.md", import.meta.url),
	"utf8",
);

function section(heading) {
	const start = doc.indexOf(`\n## ${heading}\n`);
	assert.ok(start >= 0, `docs/motion.md has a "${heading}" section`);
	const end = doc.indexOf("\n## ", start + 1);
	return doc.slice(start, end < 0 ? undefined : end);
}

function table(text) {
	const rows = text
		.split("\n")
		.filter((line) => line.trim().startsWith("|"))
		.map((line) =>
			line
				.trim()
				.replace(/^\||\|$/g, "")
				.split("|")
				.map((cell) => cell.trim()),
		);
	const [header, , ...body] = rows;
	return body.map((cells) =>
		Object.fromEntries(header.map((key, index) => [key, cells[index]])),
	);
}

const values = table(
	doc.slice(
		doc.indexOf("<!-- motion:values -->"),
		doc.indexOf("<!-- /motion:values -->"),
	),
);
const terms = values.map((row) => row.Term);
const rules = section("Rules")
	.split("\n")
	.filter((line) => /^\d+\. \*\*/.test(line));
const glossary = section("Glossary");
const entries = Object.fromEntries(
	glossary
		.split(/^#### /m)
		.slice(1)
		.map((entry) => {
			const [name, ...lines] = entry.split("\n");
			// An entry ends at the next heading, such as "Words beside the terms".
			return [name.trim(), lines.join("\n").split(/\n### /)[0]];
		}),
);

test("the page stays short enough to read whole", () => {
	assert.ok(
		doc.split("\n").length <= 700,
		"docs/motion.md is at most 700 lines",
	);
});

test("seventeen terms, each defined the same way", () => {
	assert.equal(terms.length, 17);
	assert.deepEqual(Object.keys(entries).sort(), [...terms].sort());
	const parts = [
		"Meaning",
		"Mechanics",
		"Less motion",
		"Examples",
		"Counterexamples",
		"Replaces",
	];
	for (const [term, body] of Object.entries(entries)) {
		const found = [...body.matchAll(/^- \*\*([A-Za-z ]+)\.\*\*/gm)].map(
			(match) => match[1],
		);
		assert.deepEqual(found, parts, `${term} has its parts in order`);
		assert.ok(body.split("\n").length <= 26, `${term} fits in 25 lines`);
	}
});

test("the rules are numbered and each says what to check", () => {
	assert.equal(rules.length, 13);
	rules.forEach((rule, index) =>
		assert.ok(
			rule.startsWith(`${index + 1}. **`),
			`rule ${index + 1} in order`,
		),
	);
});

test("every retired word maps to a term", () => {
	const retired = table(section("Words we retired"));
	assert.ok(retired.length >= 10);
	for (const row of retired) {
		const now = row.Now;
		const named = terms.some((term) => new RegExp(`\\b${term}\\b`).test(now));
		assert.ok(
			named || /^(retired|motion|not motion|the `--kin-\*` terms)/.test(now),
			`${row.Word} maps to a term: ${now}`,
		);
	}
});

test("every correction names its rule and its source", () => {
	const corrections = table(section("Corrections"));
	assert.ok(corrections.length >= 11);
	for (const row of corrections) {
		for (const key of ["Tried", "Read as", "Replaced by", "Rule", "Source"]) {
			assert.ok(row[key], `${row.Tried}: ${key}`);
		}
		const rule = Number(row.Rule);
		assert.ok(
			(rule >= 1 && rule <= rules.length) || terms.includes(row.Rule),
			`${row.Tried} cites a rule or a term: ${row.Rule}`,
		);
	}
});

test("the glossary writes mechanics, not adjectives", () => {
	for (const word of [
		"smooth",
		"subtle",
		"snappy",
		"natural",
		"fluid",
		"delightful",
		"playful",
	]) {
		assert.ok(
			!new RegExp(`\\b${word}\\b`, "i").test(glossary),
			`the glossary does not say "${word}"`,
		);
	}
});
