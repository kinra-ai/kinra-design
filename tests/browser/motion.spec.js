import { test, expect } from "@playwright/test";
import { serve } from "./support.js";
import { compact, curve, ms, table } from "./motion-table.js";

// The motion vocabulary (docs/motion.md): every term resolves to the values
// its table states, in each register, at every register boundary and with
// less motion.
const fixture = `<!doctype html><html lang="en"><head>
<link rel="stylesheet" href="/src/styles/tokens.css">
<style>
	.probe { transition: opacity var(--kin-motion-appear), color var(--kin-motion-control); }
	@media (prefers-reduced-motion: no-preference) {
		#tuned { --kin-duration-appear: 900ms; }
		#loose { --kin-duration-appear: 900ms; }
	}
</style>
</head><body>
<div id="root" class="probe"></div>
<section data-kin-motion="productive"><div id="productive" class="probe"></div></section>
<section data-kin-motion="expressive">
	<div id="expressive" class="probe"></div>
	<div data-kin-motion="productive"><div id="nested" class="probe"></div></div>
	<div data-kin-motion="unknown"><div id="unknown" class="probe"></div></div>
	<div id="tuned" data-kin-motion="expressive" class="probe"></div>
	<div id="loose" class="probe"></div>
</section>
</body></html>`;

const productive = ["root", "productive", "nested"];
const expressive = ["expressive", "unknown"];

async function open(page, reducedMotion) {
	await page.emulateMedia({ reducedMotion });
	await serve(page, fixture);
	await page.goto("http://design.test/fixture");
}

function read(page, id, names) {
	return page.evaluate(
		([id, names]) => {
			const style = getComputedStyle(document.getElementById(id));
			return Object.fromEntries(
				names.map((name) => [name, style.getPropertyValue(name).trim()]),
			);
		},
		[id, names],
	);
}

const terms = table("values");
const names = terms.flatMap(({ Term }) => [
	`--kin-duration-${Term}`,
	`--kin-motion-${Term}`,
]);

for (const reducedMotion of ["no-preference", "reduce"]) {
	test(`every term resolves as the motion doc says (${reducedMotion})`, async ({
		page,
	}) => {
		await open(page, reducedMotion);
		// The doc's table is the vocabulary: seventeen terms, five families.
		expect(terms).toHaveLength(17);
		expect(new Set(terms.map((row) => row.Family)).size).toBe(5);
		for (const [ids, column] of [
			[productive, "Productive"],
			[expressive, "Expressive"],
		]) {
			for (const id of ids) {
				const values = await read(page, id, names);
				for (const row of terms) {
					const less =
						reducedMotion === "reduce" && row["Less motion"] === "0ms";
					const duration = less ? 0 : ms(row[column]);
					const at = `${row.Term} at #${id}`;
					expect
						.soft(ms(values[`--kin-duration-${row.Term}`]), at)
						.toBe(duration);
					if (row.Curve === "—") {
						expect.soft(values[`--kin-motion-${row.Term}`], at).toBe("");
						continue;
					}
					const pair = compact(values[`--kin-motion-${row.Term}`]);
					const time = pair.match(/^[\d.]+m?s/)?.[0] ?? "";
					expect.soft(ms(time), `${at} pair`).toBe(duration);
					expect
						.soft(pair.slice(time.length), `${at} curve`)
						.toBe(curve(row.Curve));
				}
			}
		}
	});
}

test("a pair follows its register at every boundary", async ({ page }) => {
	await open(page, "no-preference");
	const timing = (id) =>
		page.evaluate(
			(id) => getComputedStyle(document.getElementById(id)).transitionDuration,
			id,
		);
	expect(await timing("root")).toBe("0.18s, 0.12s");
	expect(await timing("productive")).toBe("0.18s, 0.12s");
	expect(await timing("expressive")).toBe("0.36s, 0.12s");
	expect(await timing("nested")).toBe("0.18s, 0.12s");
	expect(await timing("unknown")).toBe("0.36s, 0.12s");
	// A term set on an element that declares its register is paired there.
	expect(await timing("tuned")).toBe("0.9s, 0.12s");
	// Set anywhere else it changes the duration but not the inherited pair,
	// as the motion doc says.
	expect(await timing("loose")).toBe("0.36s, 0.12s");
	expect(
		(await read(page, "loose", ["--kin-duration-appear"]))[
			"--kin-duration-appear"
		],
	).toBe("900ms");
});

test("with less motion content and place are 0ms at every boundary", async ({
	page,
}) => {
	await open(page, "reduce");
	for (const id of [...productive, ...expressive, "tuned", "loose"]) {
		const duration = await page.evaluate(
			(id) => getComputedStyle(document.getElementById(id)).transitionDuration,
			id,
		);
		// Appear is 0s; the control keeps its token, which base.css lands.
		expect.soft(duration, id).toBe("0s, 0.12s");
	}
});

test("the curves and deprecated tokens are what the doc says", async ({
	page,
}) => {
	await open(page, "no-preference");
	const curves = table("curves").filter((row) => row.Token !== "—");
	const deprecated = table("deprecated");
	expect(curves).toHaveLength(5);
	expect(deprecated).toHaveLength(4);
	const values = await read(page, "root", [
		...curves.map((row) => row.Token),
		...deprecated.map((row) => row.Token),
	]);
	for (const row of curves) {
		expect.soft(compact(values[row.Token]), row.Token).toBe(curve(row.Curve));
	}
	for (const row of deprecated) {
		const value = values[row.Token];
		if (row.Value.startsWith("cubic-bezier")) {
			expect.soft(compact(value), row.Token).toBe(compact(row.Value));
		} else {
			expect.soft(ms(value), row.Token).toBe(ms(row.Value));
		}
	}
});

test("shared arrivals run from their hidden state only", async ({ page }) => {
	await open(page, "no-preference");
	const frames = await page.evaluate(() => {
		const found = {};
		const visit = (rules) => {
			for (const rule of rules) {
				if (rule instanceof CSSKeyframesRule) {
					found[rule.name] = [...rule.cssRules].map((frame) => frame.keyText);
				} else if ("cssRules" in rule) visit(rule.cssRules);
			}
		};
		for (const sheet of document.styleSheets) visit(sheet.cssRules);
		return found;
	});
	for (const name of ["kin-fade", "kin-appear", "kin-draw"]) {
		expect.soft(frames[name], name).toEqual(["0%"]);
	}
});
