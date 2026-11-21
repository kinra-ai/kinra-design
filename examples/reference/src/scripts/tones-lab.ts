/**
 * The explorer on /tones/: three sliders in OKLCH lightness make a ladder,
 * drawn live in its own scene and measured as it moves. The address carries
 * the sliders, and the values that differ from tokens.css collect as lines a
 * calibration can paste.
 */
import {
	SHIPPED,
	checks,
	css,
	declarations,
	ladder,
	lstar,
	pairs,
	veiled,
	type Params,
} from "./tones-math";

const PARAMS = ["step", "deep", "lift"] as const;
const signed = (value: number) =>
	`${value < 0 ? "−" : "+"}${Math.abs(value).toFixed(1)}`;

function item(name: string, value: string, note: string, reach?: string) {
	const li = document.createElement("li");
	if (reach) li.dataset.reach = reach;
	const label = document.createElement("span");
	label.textContent = name;
	const reading = document.createElement("strong");
	reading.textContent = value;
	const aside = document.createElement("span");
	aside.textContent = note;
	li.append(label, reading, aside);
	return li;
}

export function startTones() {
	const explore = document.querySelector<HTMLElement>("[data-tones-explore]");
	if (!explore) return;
	const inputs = [
		...explore.querySelectorAll<HTMLInputElement>("input[data-param]"),
	];
	const readings = explore.querySelector<HTMLUListElement>("[data-readings]");
	const copy = explore.querySelector<HTMLTextAreaElement>("[data-copy]");
	const caption = explore.querySelector<HTMLElement>("[data-explore-caption]");
	const style = document.createElement("style");
	style.id = "tones-explore";
	document.head.append(style);

	const address = new URL(location.href);
	for (const input of inputs) {
		const asked = address.searchParams.get(input.dataset.param ?? "");
		if (asked !== null && Number.isFinite(Number(asked))) input.value = asked;
	}

	const read = () =>
		Object.fromEntries(
			inputs.map((input) => [input.dataset.param, Number(input.value)]),
		) as Params;

	function render() {
		const params = read();
		const tones = ladder(params);
		style.textContent = css(tones, '[data-lab-scope="explore"]');
		for (const input of inputs) {
			const out = explore!.querySelector(`[data-out="${input.dataset.param}"]`);
			if (out) out.textContent = Number(input.value).toFixed(3);
		}
		if (caption) {
			caption.textContent = `step ${params.step} · deep ${params.deep} · page +${params.lift}`;
		}
		readings?.replaceChildren(
			...pairs(tones).map(({ name, a, b }) => {
				const value = lstar(b) - lstar(a);
				const size = Math.abs(value);
				return item(
					name,
					signed(value),
					`${signed(veiled(b, 0.01) - veiled(a, 0.01))} in a lit room`,
					size < 3 ? "low" : size < 4.5 ? "near" : "holds",
				);
			}),
			...checks(tones).map(({ name, value, floor }) =>
				item(
					name,
					`${value.toFixed(2)}:1`,
					`at least ${floor}:1`,
					value >= floor ? "holds" : "low",
				),
			),
		);
		if (copy) {
			const changed = declarations(tones)
				.slice(0, 14)
				.filter(
					([name, value]) =>
						value !== declarations(SHIPPED).find(([n]) => n === name)?.[1],
				);
			copy.value = changed.length
				? changed.map(([name, value]) => `${name}: ${value};`).join("\n")
				: "/* The shipped tones: nothing changes. */";
		}
		const next = new URL(location.href);
		for (const key of PARAMS) next.searchParams.set(key, String(params[key]));
		history.replaceState(history.state, "", next);
	}

	for (const input of inputs) input.addEventListener("input", render);

	render();
}
