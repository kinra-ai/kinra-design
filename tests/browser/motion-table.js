import { readFileSync } from "node:fs";
import path from "node:path";

// docs/motion.md owns the motion vocabulary. Its tables between
// <!-- motion:name --> markers are read here, so the page a model reads
// cannot drift from the tokens the browser computes.
const doc = readFileSync(path.join(process.cwd(), "docs/motion.md"), "utf8");

export function table(name) {
	const start = doc.indexOf(`<!-- motion:${name} -->`);
	const end = doc.indexOf(`<!-- /motion:${name} -->`);
	if (start < 0 || end < start)
		throw new Error(`docs/motion.md has no ${name} table`);
	const rows = doc
		.slice(start, end)
		.split("\n")
		.filter((line) => line.trim().startsWith("|"))
		.map((line) =>
			line
				.trim()
				.replace(/^\||\|$/g, "")
				.split("|")
				.map((cell) => cell.trim().replace(/^`|`$/g, "")),
		);
	const [header, , ...body] = rows;
	return body.map((cells) =>
		Object.fromEntries(header.map((key, index) => [key, cells[index]])),
	);
}

/** A duration as written in the doc or computed by the browser, in ms. */
export function ms(value) {
	const text = value.trim();
	if (text === "none") return 0;
	const number = parseFloat(text);
	if (!Number.isFinite(number)) throw new Error(`not a duration: ${value}`);
	return text.endsWith("ms") ? number : number * 1000;
}

/** The CSS a curve named in the doc computes to, without spaces. */
export function curve(name) {
	if (name.startsWith("steps(")) return name.replace(/\s+/g, "");
	const row = table("curves").find((entry) => entry.Curve === name);
	if (!row) throw new Error(`docs/motion.md names no curve ${name}`);
	if (name === "linear") return "linear";
	return `cubic-bezier(${row["Control points"]})`.replace(/\s+/g, "");
}

export const compact = (value) => value.replace(/\s+/g, "");
