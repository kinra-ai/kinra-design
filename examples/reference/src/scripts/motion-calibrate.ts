// The motion calibration page (/motion/calibrate/). Each specimen plays one
// term on two sides at once: A by its token as tokens.css declares it, B by
// the values on the specimen's sliders. A value changes only in tokens.css, so
// this page changes none: it writes B's values on B's own register container,
// collects every change as a block to paste into tokens.css, and keeps every
// value in the address, so a session can open exactly what was seen. Nothing
// persists anywhere else.
import {
	follow,
	getRate,
	install,
	lessMotion,
	setRate,
	systemAsksLess,
} from "./motion-rate.ts";

type Points = [number, number, number, number];
type Register = "productive" | "expressive" | "fixed";
type Way = "onward" | "back" | "open" | "return";

/**
 * A curve: one tokens.css names, linear, four custom control points, or the
 * term's own when no points describe it (pass's steps).
 */
interface Curve {
	name: string;
	points?: Points;
	css: string;
}

interface Values {
	ms: number;
	/** Every term but stagger, which is a step between members. */
	curve?: Curve;
	/** Appear only: how far a rising row comes from, in rem. */
	rise?: number;
}

interface Specimen {
	id: string;
	term: string;
	register: Register;
	root: HTMLElement;
	box: HTMLElement;
	a: HTMLElement;
	b: HTMLElement;
	/** A: the term where A stands, read from tokens.css. */
	base: Values;
	/** B: the sliders. */
	values: Values;
	forms: string[];
	form: string;
	blind: boolean;
	revealed: boolean;
}

const NAMED = ["out", "in", "standard", "bloom", "morph"] as const;
const LOOPS = new Set(["trace", "sweep", "pulse", "pass"]);

/** The lab's own pause before a leaving or a close, so what leaves is seen. */
const DWELL = 500;
/** How long a press holds before it lets go. */
const PRESS = 600;
/** How long a slider rests before the address follows it, in real time. */
const SETTLE_ADDRESS = 250;

// The lab's clock rescales every timer once installed; the address waits in
// real time, so it is timed by the browser's own.
const realTimeout = window.setTimeout.bind(window);

// ------------------------------------------------------------------ Values

const round = (value: number, places = 0) => {
	const factor = 10 ** places;
	return Math.round(value * factor) / factor;
};
const decimal = (value: number) => String(round(value, 3));

/** A duration as the browser, or a minifier, writes it, in ms. */
function toMs(value: string): number {
	const text = value.trim();
	const number = parseFloat(text);
	if (!Number.isFinite(number)) return 0;
	return text.endsWith("ms") ? number : number * 1000;
}

/** A pair (`180ms cubic-bezier(…)`) as its duration and its curve. */
function split(pair: string): { ms: number; easing: string } {
	const text = pair.trim();
	const match = /^(-?[\d.]+m?s)\s*/.exec(text);
	if (!match) return { ms: 0, easing: text };
	return { ms: toMs(match[1] ?? ""), easing: text.slice(match[0].length) };
}

function pointsOf(text: string): Points | undefined {
	const numbers = (text.match(/-?(?:\d+\.?\d*|\.\d+)/g) ?? []).map(Number);
	if (numbers.length !== 4 || !numbers.every(Number.isFinite)) return undefined;
	return numbers as Points;
}

const samePoints = (a: Points, b: Points) =>
	a.every((value, index) => Math.abs(value - (b[index] ?? NaN)) < 1e-4);

/** The named curves, as tokens.css declares them. */
const named = new Map<string, Points>();

function namedCurve(name: string): Curve {
	const points = named.get(name) ?? [0, 0, 1, 1];
	return {
		name,
		points,
		css: name === "linear" ? "linear" : `var(--kin-ease-${name})`,
	};
}

function customCurve(points: Points): Curve {
	const [x1, y1, x2, y2] = points;
	const clamped: Points = [
		Math.min(1, Math.max(0, x1)),
		Math.min(2, Math.max(-1, y1)),
		Math.min(1, Math.max(0, x2)),
		Math.min(2, Math.max(-1, y2)),
	];
	return {
		name: "custom",
		points: clamped,
		css: `cubic-bezier(${clamped.map(decimal).join(", ")})`,
	};
}

function curveOf(easing: string): Curve {
	const text = easing.trim();
	if (text === "linear") return namedCurve("linear");
	const points = text.startsWith("cubic-bezier") ? pointsOf(text) : undefined;
	if (points) {
		for (const [name, known] of named) {
			if (name !== "linear" && samePoints(points, known))
				return namedCurve(name);
		}
		return customCurve(points);
	}
	return { name: "own", css: text || "ease" };
}

const sameCurve = (a?: Curve, b?: Curve) =>
	!a || !b
		? a === b
		: a.points && b.points
			? samePoints(a.points, b.points)
			: a.css.replace(/\s+/g, "") === b.css.replace(/\s+/g, "");

/** How far appearing content rises from, in rem: `0 0.25rem` is 0.25. */
function riseOf(value: string): number {
	const parts = value.trim().split(/\s+/);
	const y = parts[1] ?? parts[0] ?? "0";
	const number = parseFloat(y);
	if (!Number.isFinite(number)) return 0;
	if (y.endsWith("px")) {
		return (
			number / parseFloat(getComputedStyle(document.documentElement).fontSize)
		);
	}
	return number;
}

/** The term where an element stands, as the browser computes it. */
function read(element: Element, term: string): Values {
	const style = getComputedStyle(element);
	const values: Values = {
		ms: toMs(style.getPropertyValue(`--kin-duration-${term}`)),
	};
	if (term !== "stagger") {
		values.curve = curveOf(
			split(style.getPropertyValue(`--kin-motion-${term}`)).easing,
		);
	}
	if (term === "appear") {
		values.rise = riseOf(style.getPropertyValue("--kin-appear-from"));
	}
	return values;
}

/** A term's duration and curve where an element stands, for script. */
function term(element: Element, name: string) {
	const style = getComputedStyle(element);
	const ms = toMs(style.getPropertyValue(`--kin-duration-${name}`));
	const easing =
		split(style.getPropertyValue(`--kin-motion-${name}`)).easing || "linear";
	return { ms: lessMotion() ? 0 : ms, easing };
}

const copyOf = (values: Values): Values => ({
	ms: values.ms,
	curve: values.curve && {
		...values.curve,
		points: values.curve.points && [...values.curve.points],
	},
	rise: values.rise,
});

function differences(specimen: Specimen) {
	const { base, values } = specimen;
	return {
		ms: Math.abs(base.ms - values.ms) >= 0.5,
		curve: !sameCurve(base.curve, values.curve),
		rise:
			base.rise !== undefined &&
			values.rise !== undefined &&
			Math.abs(base.rise - values.rise) >= 0.001,
	};
}

const changed = (specimen: Specimen) =>
	Object.values(differences(specimen)).some(Boolean);

// ---------------------------------------------------------------- Readings

const time = (ms: number) =>
	ms === 0 ? "none" : ms >= 1000 ? `${round(ms / 1000, 3)}s` : `${round(ms)}ms`;

function curveName(curve?: Curve): string {
	if (!curve) return "";
	if (curve.name === "custom")
		return (curve.points ?? []).map(decimal).join(", ");
	if (curve.name === "own") return curve.css;
	return curve.name;
}

function reading(values: Values, termName: string): string {
	if (termName === "stagger")
		return values.ms === 0 ? "none" : `${time(values.ms)} step`;
	const parts = [time(values.ms)];
	if (values.ms !== 0 && values.curve) parts.push(curveName(values.curve));
	if (values.rise !== undefined) parts.push(`rise ${decimal(values.rise)}rem`);
	return parts.join(" · ");
}

/** A CSS cubic-bezier as progress over time, by bisection. */
function bezier([x1, y1, x2, y2]: Points) {
	const at = (a: number, b: number, t: number) =>
		3 * a * (1 - t) ** 2 * t + 3 * b * (1 - t) * t ** 2 + t ** 3;
	const solve = (f: (t: number) => number, target: number) => {
		let low = 0;
		let high = 1;
		for (let index = 0; index < 50; index++) {
			const middle = (low + high) / 2;
			if (f(middle) < target) low = middle;
			else high = middle;
		}
		return high;
	};
	return {
		/** How much of the change is done when a share of its time has passed. */
		progressAt: (share: number) =>
			at(
				y1,
				y2,
				solve((t) => at(x1, x2, t), share),
			),
		/** The share of its time a curve takes to cover a share of its change. */
		timeTo: (share: number) =>
			at(
				x1,
				x2,
				solve((t) => at(y1, y2, t), share),
			),
	};
}

const percent = (share: number) =>
	`${round(share * 100, Math.abs(share) < 0.1 ? 1 : 0)}%`;

function facts(curve?: Curve): string {
	if (!curve) return "";
	if (curve.points) {
		const shape = bezier(curve.points);
		return `${percent(shape.progressAt(0.5))} at half time · half by ${percent(shape.timeTo(0.5))} · 95% by ${percent(shape.timeTo(0.95))}`;
	}
	if (curve.css.startsWith("steps")) return "holds each step, then jumps";
	return "";
}

function plotPath(curve?: Curve): string {
	if (!curve) return "";
	if (curve.points) {
		const [x1, y1, x2, y2] = curve.points.map((value, index) =>
			index % 2 ? 100 - value * 100 : value * 100,
		) as Points;
		return `M0 100 C ${x1} ${y1} ${x2} ${y2} 100 0`;
	}
	const steps = /^steps\(\s*(\d+)\s*(?:,\s*([\w-]+))?\s*\)$/.exec(curve.css);
	if (!steps) return "";
	const count = Math.max(1, Number(steps[1]));
	const start = steps[2] === "start" || steps[2] === "jump-start";
	let path = "M0 100";
	for (let step = 0; step < count; step++) {
		const level = start ? step + 1 : step;
		path += ` V${100 - (level / count) * 100} H${((step + 1) / count) * 100}`;
	}
	return `${path} V0`;
}

// ------------------------------------------------------------- The page

/** Start the calibration page on /motion/calibrate/. */
export function startCalibration(): void {
	install();
	const page = document.querySelector<HTMLElement>("[data-cal]")!;
	const copy = document.querySelector<HTMLTextAreaElement>("[data-cal-copy]")!;
	const copyStatus = document.querySelector<HTMLElement>(
		"[data-cal-copy-status]",
	)!;
	const changes = document.querySelector<HTMLElement>("[data-cal-changes]")!;

	const rootStyle = getComputedStyle(document.documentElement);
	for (const name of NAMED) {
		const points = pointsOf(rootStyle.getPropertyValue(`--kin-ease-${name}`));
		if (points) named.set(name, points);
	}
	named.set("linear", [0, 0, 1, 1]);

	const specimens: Specimen[] = [];
	for (const root of page.querySelectorAll<HTMLElement>(
		"[data-cal-specimen]",
	)) {
		const a = root.querySelector<HTMLElement>('[data-cal-side="a"]')!;
		const b = root.querySelector<HTMLElement>('[data-cal-side="b"]')!;
		const termName = root.dataset.calTerm!;
		const base = read(a, termName);
		const forms = Array.from(
			root.querySelectorAll<HTMLElement>("[data-cal-form-choice]"),
			(button) => button.dataset.calFormChoice!,
		);
		specimens.push({
			id: root.id,
			term: termName,
			register: root.dataset.calRegister as Register,
			root,
			box: root.querySelector<HTMLElement>("[data-cal-sides]")!,
			a,
			b,
			base,
			values: copyOf(base),
			forms,
			form: forms[0] ?? "",
			blind: false,
			revealed: false,
		});
	}

	const sides = (specimen: Specimen) => [specimen.a, specimen.b];
	/** An element on each side, in A then B order; a side without one adds none. */
	const inside = <T extends Element = HTMLElement>(
		specimen: Specimen,
		selector: string,
	) =>
		sides(specimen).flatMap((side) => {
			const found = side.querySelector<T>(selector);
			return found ? [found] : [];
		});

	/** Start a CSS animation over on every element at once, in one frame. */
	function restart(elements: Element[], attribute: string, value = "on") {
		for (const element of elements) element.removeAttribute(attribute);
		void page.offsetWidth;
		for (const element of elements) element.setAttribute(attribute, value);
	}

	// ------------------------------------------------------------ Controls

	function inputs(specimen: Specimen) {
		const find = <T extends Element>(selector: string) =>
			specimen.root.querySelector<T>(selector);
		return {
			ms: find<HTMLInputElement>("[data-cal-ms]")!,
			msNumber: find<HTMLInputElement>("[data-cal-ms-number]")!,
			curve: find<HTMLSelectElement>("[data-cal-curve]"),
			points: Array.from(
				specimen.root.querySelectorAll<HTMLInputElement>("[data-cal-point]"),
			),
			rise: find<HTMLInputElement>("[data-cal-rise]"),
			riseNumber: find<HTMLInputElement>("[data-cal-rise-number]"),
			plotA: find<SVGPathElement>('[data-cal-plot="a"]'),
			plotB: find<SVGPathElement>('[data-cal-plot="b"]'),
			facts: find<HTMLElement>("[data-cal-facts]"),
			reveal: find<HTMLButtonElement>("[data-cal-reveal]")!,
			blind: find<HTMLInputElement>("[data-cal-blind]")!,
		};
	}

	/** Write B's values on B's container: the duration and the pair, since a
	 *  pair declared higher up does not follow a duration changed below it. */
	function write(specimen: Specimen) {
		const { b, term: name, values } = specimen;
		b.style.setProperty(`--kin-duration-${name}`, `${round(values.ms)}ms`);
		if (values.curve) {
			b.style.setProperty(
				`--kin-motion-${name}`,
				`${round(values.ms)}ms ${values.curve.css}`,
			);
		}
		if (values.rise !== undefined) {
			b.style.setProperty("--kin-appear-from", `0 ${decimal(values.rise)}rem`);
		}
	}

	/** Each side's label and reading, from what the browser computes there. */
	function label(specimen: Specimen) {
		const hidden = specimen.blind && !specimen.revealed;
		Array.from(specimen.box.children).forEach((side, index) => {
			const name = side.querySelector<HTMLElement>("[data-cal-name]")!;
			const value = side.querySelector<HTMLElement>("[data-cal-reading]")!;
			name.textContent = hidden
				? `Side ${index + 1}`
				: side === specimen.a
					? "A · tokens.css"
					: "B · sliders";
			value.textContent = reading(read(side, specimen.term), specimen.term);
			value.hidden = hidden;
		});
		const { reveal } = inputs(specimen);
		reveal.disabled = !specimen.blind || specimen.revealed;
	}

	function plot(specimen: Specimen) {
		const { plotA, plotB, facts: line } = inputs(specimen);
		if (!plotA || !plotB || !line) return;
		plotA.setAttribute("d", plotPath(specimen.base.curve));
		plotB.setAttribute("d", plotPath(specimen.values.curve));
		const a = facts(specimen.base.curve);
		const b = facts(specimen.values.curve);
		line.replaceChildren(
			...[a && `A: ${a}`, b && `B: ${b}`].filter(Boolean).map((text) => {
				const span = document.createElement("span");
				span.textContent = text as string;
				return span;
			}),
		);
	}

	/** Put B's values on its controls. */
	function show(specimen: Specimen) {
		const controls = inputs(specimen);
		const { values } = specimen;
		controls.ms.value = String(values.ms);
		controls.msNumber.value = String(round(values.ms));
		if (controls.curve && values.curve) {
			controls.curve.value = values.curve.name;
			const own = values.curve.name === "own";
			controls.points.forEach((input, index) => {
				input.disabled = own;
				const point = values.curve?.points?.[index];
				if (point !== undefined) input.value = decimal(point);
			});
		}
		if (controls.rise && controls.riseNumber && values.rise !== undefined) {
			controls.rise.value = String(values.rise);
			controls.riseNumber.value = decimal(values.rise);
		}
	}

	function update(specimen: Specimen) {
		write(specimen);
		label(specimen);
		plot(specimen);
		refresh();
	}

	function connect(specimen: Specimen) {
		const controls = inputs(specimen);
		const [min, max] = [Number(controls.ms.min), Number(controls.ms.max)];
		const clamp = (value: number, low: number, high: number) =>
			Math.min(high, Math.max(low, value));

		controls.ms.addEventListener("input", () => {
			specimen.values.ms = Number(controls.ms.value);
			controls.msNumber.value = controls.ms.value;
			update(specimen);
		});
		controls.msNumber.addEventListener("input", () => {
			const value = controls.msNumber.valueAsNumber;
			if (!Number.isFinite(value) || value < min || value > max) return;
			specimen.values.ms = Math.round(value);
			controls.ms.value = String(specimen.values.ms);
			update(specimen);
		});
		controls.msNumber.addEventListener("change", () => {
			const value = controls.msNumber.valueAsNumber;
			specimen.values.ms = Number.isFinite(value)
				? Math.round(clamp(value, min, max))
				: specimen.values.ms;
			show(specimen);
			update(specimen);
		});

		if (controls.curve) {
			// A curve no name fits (pass's steps) is offered as the term's own.
			if (specimen.base.curve?.name === "own") {
				const option = new Option(specimen.base.curve.css, "own");
				controls.curve.prepend(option);
			}
			controls.curve.addEventListener("change", () => {
				const name = controls.curve!.value;
				if (name === "own") {
					specimen.values.curve = specimen.base.curve && {
						...specimen.base.curve,
					};
				} else if (name === "custom") {
					// Custom starts from the points on show, or from linear when the
					// curve had none (pass's steps).
					const typed = controls.points.map((input) => input.value);
					const points = typed.every(Boolean)
						? pointsOf(typed.join(","))
						: undefined;
					specimen.values.curve = customCurve(
						points ?? specimen.values.curve?.points ?? [0, 0, 1, 1],
					);
				} else {
					specimen.values.curve = namedCurve(name);
				}
				show(specimen);
				update(specimen);
			});
			for (const input of controls.points) {
				input.addEventListener("input", () => {
					const points = pointsOf(
						controls.points.map((point) => point.value).join(","),
					);
					if (!points) return;
					specimen.values.curve = customCurve(points);
					controls.curve!.value = "custom";
					update(specimen);
				});
				input.addEventListener("change", () => show(specimen));
			}
			for (const preset of specimen.root.querySelectorAll<HTMLElement>(
				"[data-cal-preset]",
			)) {
				preset.addEventListener("click", () => {
					const points = pointsOf(preset.dataset.calPreset ?? "");
					if (!points) return;
					specimen.values.curve = customCurve(points);
					show(specimen);
					update(specimen);
				});
			}
		}

		if (controls.rise && controls.riseNumber) {
			const rise = controls.rise;
			const riseNumber = controls.riseNumber;
			rise.addEventListener("input", () => {
				specimen.values.rise = Number(rise.value);
				riseNumber.value = decimal(specimen.values.rise);
				update(specimen);
			});
			riseNumber.addEventListener("input", () => {
				const value = riseNumber.valueAsNumber;
				if (!Number.isFinite(value) || value < 0 || value > 1) return;
				specimen.values.rise = value;
				rise.value = String(value);
				update(specimen);
			});
			riseNumber.addEventListener("change", () => {
				const value = riseNumber.valueAsNumber;
				if (Number.isFinite(value)) specimen.values.rise = clamp(value, 0, 1);
				show(specimen);
				update(specimen);
			});
		}

		// Blind: the sides change places at random, unnamed, until revealed.
		controls.blind.addEventListener("change", () => {
			specimen.blind = controls.blind.checked;
			specimen.revealed = false;
			const swap = specimen.blind && Math.random() < 0.5;
			specimen.box.append(
				...(swap ? [specimen.b, specimen.a] : [specimen.a, specimen.b]),
			);
			specimen.root.toggleAttribute("data-cal-blinded", specimen.blind);
			specimen.root.removeAttribute("data-cal-revealed");
			label(specimen);
		});
		controls.reveal.addEventListener("click", () => {
			specimen.revealed = true;
			specimen.root.toggleAttribute("data-cal-revealed", true);
			label(specimen);
		});

		specimen.root
			.querySelector("[data-cal-reset]")!
			.addEventListener("click", () => {
				specimen.values = copyOf(specimen.base);
				show(specimen);
				update(specimen);
			});

		for (const button of specimen.root.querySelectorAll<HTMLElement>(
			"[data-cal-form-choice]",
		)) {
			button.addEventListener("click", () => {
				choose(specimen, button.dataset.calFormChoice!);
				refresh();
			});
		}
	}

	function choose(specimen: Specimen, form: string) {
		specimen.form = form;
		specimen.root.dataset.calForm = form;
		for (const button of specimen.root.querySelectorAll<HTMLElement>(
			"[data-cal-form-choice]",
		)) {
			button.setAttribute(
				"aria-pressed",
				String(button.dataset.calFormChoice === form),
			);
		}
		// A new form starts from rest.
		for (const screen of inside(specimen, "[data-cal-screen]")) {
			screen.removeAttribute("data-cal-layer");
		}
		for (const leavers of inside(specimen, "[data-cal-leavers]")) {
			clearTimeout(timers.get(specimen));
			leavers.removeAttribute("data-cal-leaving");
			leavers.dataset.calShow = form;
		}
	}

	// ----------------------------------------------------------- Specimens

	const timers = new Map<Specimen, number>();
	const settled = new Map<Specimen, number>();
	const places = new Map<Specimen, { room: number; open: boolean }>();
	let count = 0;
	const seeded = (() => {
		let state = 7;
		return () => {
			state = (state * 1664525 + 1013904223) % 4294967296;
			return state / 4294967296;
		};
	})();

	const later = (specimen: Specimen, run: () => void, wait: number) => {
		clearTimeout(timers.get(specimen));
		timers.set(
			specimen,
			window.setTimeout(() => {
				run();
				follow();
			}, wait),
		);
	};

	const plays: Record<string, (specimen: Specimen) => void> = {
		// C1: tone, a thumb and an arrow answering.
		control(specimen) {
			for (const side of sides(specimen)) {
				side.querySelector("[data-cal-press]")!.setAttribute("data-cal-on", "");
				const toggle =
					side.querySelector<HTMLInputElement>("[data-cal-switch]")!;
				toggle.checked = !toggle.checked;
				const details = side.querySelector<HTMLDetailsElement>(
					"[data-cal-disclosure]",
				)!;
				details.open = !details.open;
			}
			later(
				specimen,
				() => {
					for (const press of inside(specimen, "[data-cal-press]"))
						press.removeAttribute("data-cal-on");
				},
				PRESS,
			);
		},

		// C2: the rows below a new one make room; the fill follows its work.
		surface(specimen) {
			count++;
			const fill = (0.2 + seeded() * 0.75).toFixed(2);
			for (const side of sides(specimen)) {
				const list = side.querySelector<HTMLElement>("[data-cal-rows]")!;
				const before = new Map(
					Array.from(list.children, (row) => [
						row,
						row.getBoundingClientRect().top,
					]),
				);
				list.lastElementChild?.remove();
				for (const old of list.querySelectorAll("[data-cal-new]"))
					old.removeAttribute("data-cal-new");
				const row = document.createElement("li");
				row.className = "cal-row";
				row.dataset.calNew = "";
				row.innerHTML = `Task ${count}<small>queued</small>`;
				list.prepend(row);
				const { ms, easing } = term(list, "surface");
				for (const [old, top] of before) {
					const moved = old.isConnected
						? top - old.getBoundingClientRect().top
						: 0;
					if (!moved || !ms) continue;
					old.animate([{ translate: `0 ${moved}px` }, { translate: "0 0" }], {
						duration: ms,
						easing,
					});
				}
				side
					.querySelector<HTMLElement>('[data-cal-meter="surface"]')!
					.style.setProperty("--cal-value", fill);
			}
		},

		// L1: a dialog or a drawer arrives with its backdrop.
		layer(specimen) {
			restart(
				inside(specimen, "[data-cal-screen]"),
				"data-cal-layer",
				specimen.form,
			);
		},

		// L2: a menu arrives from its button.
		popover(specimen) {
			restart(inside(specimen, "[data-cal-anchor]"), "data-cal-open");
		},

		// L3: what was there is back at once, then leaves the way it came.
		exit(specimen) {
			const leavers = inside<HTMLElement>(specimen, "[data-cal-leavers]");
			for (const element of leavers) {
				element.removeAttribute("data-cal-leaving");
				element.dataset.calShow = specimen.form;
			}
			later(
				specimen,
				() => {
					for (const element of leavers)
						element.setAttribute("data-cal-leaving", "");
				},
				DWELL,
			);
		},

		// S1: the hand and the bar travel; the figure changes at once.
		settle(specimen) {
			const last = settled.get(specimen) ?? 0.3;
			const value = 0.1 + ((last - 0.1 + 0.3 + seeded() * 0.4) % 0.85);
			settled.set(specimen, value);
			for (const side of sides(specimen)) {
				side
					.querySelector<HTMLElement>("[data-cal-hand]")!
					.style.setProperty(
						"--cal-angle",
						`${Math.round(value * 300 - 150)}deg`,
					);
				side
					.querySelector<HTMLElement>('[data-cal-meter="settle"]')!
					.style.setProperty("--cal-value", value.toFixed(2));
				side.querySelector("[data-cal-figure]")!.textContent =
					`${Math.round(value * 100)}%`;
			}
		},

		// S2: the trace draws from its start; its band fades in with it.
		draw(specimen) {
			restart(
				sides(specimen).flatMap((side) =>
					Array.from(side.querySelectorAll("[data-cal-drawn]")),
				),
				"data-cal-drawn",
			);
		},

		// S3: a row rises, a mark grows at its anchor, or a row opens.
		appear(specimen) {
			count++;
			if (specimen.form === "grow") {
				restart(inside(specimen, "[data-cal-grow]"), "data-cal-grow");
				return;
			}
			for (const side of sides(specimen)) {
				const list = side.querySelector<HTMLElement>("[data-cal-rows]")!;
				list.lastElementChild?.remove();
				const row = document.createElement("li");
				row.className =
					specimen.form === "rise" ? "cal-row cal-rise" : "cal-row";
				row.innerHTML = `Report ${count}<small>done</small>`;
				list.prepend(row);
				if (specimen.form !== "open") continue;
				const { ms, easing } = term(row, "appear");
				if (!ms) continue;
				const style = getComputedStyle(row);
				const height = row.getBoundingClientRect().height;
				row.animate(
					[
						{
							height: "0px",
							paddingTop: "0px",
							paddingBottom: "0px",
							opacity: 0,
						},
						{
							height: `${height}px`,
							paddingTop: style.paddingTop,
							paddingBottom: style.paddingBottom,
							opacity: 1,
						},
					],
					{ duration: ms, easing },
				);
			}
		},

		// S4: the marks arrive in reading order, one step apart.
		stagger(specimen) {
			restart(inside(specimen, "[data-cal-stagger]"), "data-cal-on");
		},

		// W5: the light's dash closes into a ring, which then fades.
		close(specimen) {
			const boxes = inside<HTMLElement>(specimen, "[data-cal-ring]");
			const captions = inside(specimen, "[data-cal-close-caption]");
			for (const box of boxes) box.dataset.calRing = "dash";
			for (const caption of captions) caption.textContent = "Working";
			later(
				specimen,
				() => {
					for (const box of boxes)
						box.dataset.calRing = term(box, "close").ms ? "closing" : "gone";
					for (const caption of captions) caption.textContent = "Done";
				},
				DWELL,
			);
		},
	};

	// Work in flight: Replay starts both loops in step; End lets them go.
	function work(specimen: Specimen, running: boolean) {
		const areas = inside(specimen, "[data-cal-work]");
		if (running) restart(areas, "data-cal-running", "");
		else for (const area of areas) area.removeAttribute("data-cal-running");
		specimen.root.querySelector<HTMLButtonElement>("[data-cal-end]")!.disabled =
			!running;
	}

	// P1: the bar holds still while the room moves, with Observatory's keyframes:
	// onward and back slide 3rem the way the index runs; opening zooms from the
	// tile, and returning zooms back out to it.
	function frames(way: Way, origin: string): [Keyframe[], Keyframe[]] {
		const still = { opacity: 1, transform: "none" };
		switch (way) {
			case "onward":
				return [
					[still, { opacity: 0, transform: "translateX(-3rem)" }],
					[{ opacity: 0, transform: "translateX(3rem)" }, still],
				];
			case "back":
				return [
					[still, { opacity: 0, transform: "translateX(3rem)" }],
					[{ opacity: 0, transform: "translateX(-3rem)" }, still],
				];
			case "open":
				return [
					[
						{ ...still, transformOrigin: origin },
						{ opacity: 0, transform: "scale(1.5)", transformOrigin: origin },
					],
					[
						{ opacity: 0, transform: "scale(0.94)", transformOrigin: origin },
						{ ...still, transformOrigin: origin },
					],
				];
			case "return":
				return [
					[still, { opacity: 0, transform: "scale(0.97)" }],
					[
						{ opacity: 0, transform: "scale(1.35)", transformOrigin: origin },
						{ ...still, transformOrigin: origin },
					],
				];
		}
	}

	/** Where a view's tile sits within it, as a transform origin. */
	function tile(view: HTMLElement): string {
		const box = view.getBoundingClientRect();
		const target = view
			.querySelector("[data-cal-tile]")
			?.getBoundingClientRect();
		if (!target || !box.width || !box.height) return "50% 50%";
		const x = ((target.left + target.width / 2 - box.left) / box.width) * 100;
		const y = ((target.top + target.height / 2 - box.top) / box.height) * 100;
		return `${round(x, 1)}% ${round(y, 1)}%`;
	}

	function navigate(specimen: Specimen, way: Way) {
		const state = places.get(specimen) ?? { room: 0, open: false };
		if (way === "open" && state.open) return;
		if (way === "return" && !state.open) return;
		const next =
			way === "onward"
				? { room: (state.room + 1) % 3, open: false }
				: way === "back"
					? { room: (state.room + 2) % 3, open: false }
					: { room: state.room, open: way === "open" };
		const from = `${state.open ? "detail" : "room"}-${state.room}`;
		const to = `${next.open ? "detail" : "room"}-${next.room}`;
		for (const side of sides(specimen)) {
			const place = side.querySelector<HTMLElement>("[data-cal-place]")!;
			for (const animation of place.getAnimations({ subtree: true }))
				animation.finish();
			const leaving = place.querySelector<HTMLElement>(
				`[data-cal-view="${from}"]`,
			)!;
			const arriving = place.querySelector<HTMLElement>(
				`[data-cal-view="${to}"]`,
			)!;
			place.dataset.calAt = to;
			arriving.hidden = false;
			const { ms, easing } = term(place, "navigate");
			if (!ms) {
				leaving.hidden = true;
				continue;
			}
			const origin = tile(way === "open" ? leaving : arriving);
			const [leave, arrive] = frames(way, origin);
			const out = leaving.animate(leave, {
				duration: ms,
				easing,
				fill: "forwards",
			});
			out.finished
				.then(() => {
					if (place.dataset.calAt !== from) leaving.hidden = true;
					out.cancel();
				})
				.catch(() => {});
			arriving.animate(arrive, { duration: ms, easing });
		}
		places.set(specimen, next);
		const buttons = Array.from(
			specimen.root.querySelectorAll<HTMLButtonElement>("[data-cal-way]"),
		);
		const focused = buttons.find((button) => button === document.activeElement);
		for (const button of buttons) {
			const name = button.dataset.calWay;
			button.disabled =
				(name === "open" && next.open) || (name === "return" && !next.open);
		}
		// Open and Return hand focus to each other as they take turns.
		if (focused?.disabled) {
			buttons
				.find(
					(button) =>
						button.dataset.calWay === (way === "open" ? "return" : "open"),
				)
				?.focus();
		}
	}

	// --------------------------------------------------- Address and copy

	function curveParam(curve: Curve): string {
		if (curve.name === "custom")
			return (curve.points ?? []).map(decimal).join(",");
		if (curve.name === "own") return curve.css.replace(/\s+/g, "");
		return curve.name;
	}

	function curveFromParam(value: string, base?: Curve): Curve | undefined {
		if (named.has(value)) return namedCurve(value);
		if (/^[-\d.,]+$/.test(value)) {
			const points = pointsOf(value);
			return points && customCurve(points);
		}
		if (base?.name === "own" && value === base.css.replace(/\s+/g, ""))
			return { ...base };
		return undefined;
	}

	function address(): string {
		const parts: [string, string][] = [];
		if (getRate() !== 1) parts.push(["speed", String(getRate())]);
		for (const specimen of specimens) {
			if (specimen.form !== (specimen.forms[0] ?? ""))
				parts.push([`${specimen.id}.form`, specimen.form]);
			// A specimen whose B differs carries every value it has, so the
			// address shows exactly what was seen even after tokens.css moves.
			if (!changed(specimen)) continue;
			const { values } = specimen;
			parts.push([`${specimen.id}.ms`, String(round(values.ms))]);
			if (values.curve)
				parts.push([`${specimen.id}.curve`, curveParam(values.curve)]);
			if (values.rise !== undefined)
				parts.push([`${specimen.id}.rise`, decimal(values.rise)]);
		}
		return parts
			.map(
				([key, value]) =>
					`${encodeURIComponent(key)}=${encodeURIComponent(value).replace(/%2C/gi, ",")}`,
			)
			.join("&");
	}

	function restore(params: URLSearchParams) {
		const speed = Number(params.get("speed"));
		chooseSpeed([1, 0.25, 0.1].includes(speed) ? speed : 1);
		for (const specimen of specimens) {
			const get = (name: string) => params.get(`${specimen.id}.${name}`);
			const form = get("form");
			if (form && specimen.forms.includes(form)) choose(specimen, form);
			const controls = inputs(specimen);
			const ms = Number(get("ms") ?? NaN);
			if (get("ms") !== null && Number.isFinite(ms)) {
				specimen.values.ms = Math.round(
					Math.min(
						Number(controls.ms.max),
						Math.max(Number(controls.ms.min), ms),
					),
				);
			}
			const curve = get("curve");
			if (curve && specimen.values.curve) {
				specimen.values.curve =
					curveFromParam(curve, specimen.base.curve) ?? specimen.values.curve;
			}
			const rise = Number(get("rise") ?? NaN);
			if (
				get("rise") !== null &&
				Number.isFinite(rise) &&
				specimen.values.rise !== undefined
			) {
				specimen.values.rise = Math.min(1, Math.max(0, rise));
			}
		}
	}

	type Block = "root" | "productive" | "expressive" | "pairs";
	const selectors: Record<Block, string> = {
		root: ":root",
		productive: ':root,\n[data-kin-motion="productive"]',
		expressive: '[data-kin-motion="expressive"]',
		pairs: ":root,\n[data-kin-motion]",
	};

	const durationText = (name: string, ms: number) =>
		LOOPS.has(name) ? `${round(ms / 1000, 3)}s` : `${round(ms)}ms`;

	/** Every change, in tokens.css's own blocks, one line each with its specimen. */
	function block(query: string): { text: string; lines: number } {
		// With the system's less motion every registered token reads 0ms here,
		// so nothing it says about what was there would be true.
		if (systemAsksLess()) {
			return {
				text: "/* Your system asks for less motion, so the tokens read 0ms on this page.\n   Calibrate with it turned off; nothing here is copied. */\n",
				lines: 0,
			};
		}
		const out: Record<Block, string[]> = {
			root: [],
			productive: [],
			expressive: [],
			pairs: [],
		};
		// A pair or a rise asked for in one register is one value in tokens.css,
		// shared by both registers; the registers' asks are merged below.
		type Shared = {
			id: string;
			register: Register;
			value: string;
			was: string;
		};
		const shared = new Map<string, Shared[]>();
		const line = (property: string, value: string, note: string) =>
			`\t${property}: ${value}; /* ${note} */`;
		let lines = 0;

		for (const specimen of specimens) {
			const changes = differences(specimen);
			const { id, term: name, register, base, values } = specimen;
			const own: Block = register === "fixed" ? "root" : register;
			if (changes.ms) {
				out[own].push(
					line(
						`--kin-duration-${name}`,
						durationText(name, values.ms),
						`${id}, was ${durationText(name, base.ms)}`,
					),
				);
				lines++;
			}
			if (changes.curve && values.curve) {
				const value = `var(--kin-duration-${name}) ${values.curve.css}`;
				const was = curveName(base.curve);
				if (register === "fixed") {
					out.root.push(
						line(`--kin-motion-${name}`, value, `${id}, was ${was}`),
					);
					lines++;
				} else {
					const entries = shared.get(`--kin-motion-${name}`) ?? [];
					entries.push({ id, register, value, was });
					shared.set(`--kin-motion-${name}`, entries);
				}
			}
			if (
				changes.rise &&
				values.rise !== undefined &&
				base.rise !== undefined
			) {
				const entries = shared.get("--kin-appear-from") ?? [];
				entries.push({
					id,
					register,
					value: `0 ${decimal(values.rise)}rem`,
					was: `0 ${decimal(base.rise)}rem`,
				});
				shared.set("--kin-appear-from", entries);
			}
		}

		for (const [property, entries] of shared) {
			const home: Block = property === "--kin-appear-from" ? "root" : "pairs";
			const first = entries[0]!;
			if (entries.every((entry) => entry.value === first.value)) {
				const ids = entries.map((entry) => entry.id).join(", ");
				const both = entries.length === 1 ? "; serves both registers" : "";
				out[home].push(
					line(property, first.value, `${ids}, was ${first.was}${both}`),
				);
				lines++;
				continue;
			}
			// tokens.css holds one value for both registers here, so a line in
			// each register's block would never apply: say so, and let the
			// round choose.
			const asked = entries
				.map((entry) => `${entry.id} (${entry.register}) asks ${entry.value}`)
				.join("; ");
			out[home].push(
				`\t/* ${property}: the registers differ. ${asked}. tokens.css holds one value for both, was ${first.was}: choose one. */`,
			);
			lines++;
		}

		if (!lines) {
			return {
				text: "/* No changes: every B matches tokens.css. */\n",
				lines,
			};
		}
		const where = `${location.pathname}${query ? `?${query}` : ""}`;
		const blocks = (Object.keys(out) as Block[])
			.filter((key) => out[key].length)
			.map((key) => `${selectors[key]} {\n${out[key].join("\n")}\n}`);
		return {
			text: `/* Calibrated at ${where}\n   Each line replaces its own in src/styles/tokens.css. */\n\n${blocks.join("\n\n")}\n`,
			lines,
		};
	}

	// A browser limits how often a page rewrites its address (WebKit throws
	// past 100 times in ten seconds), and a dragged slider changes many times a
	// second, so the address follows once the values rest.
	let addressTimer = 0;
	function writeAddress(query: string) {
		clearTimeout(addressTimer);
		addressTimer = realTimeout(() => {
			try {
				history.replaceState(
					null,
					"",
					`${location.pathname}${query ? `?${query}` : ""}${location.hash}`,
				);
			} catch {
				// The values to copy still hold every change.
			}
		}, SETTLE_ADDRESS);
	}

	function refresh() {
		const query = address();
		writeAddress(query);
		const { text, lines } = block(query);
		copy.value = text;
		changes.textContent = lines
			? `${lines} ${lines === 1 ? "change" : "changes"} to copy`
			: "No changes";
		changes.toggleAttribute("data-changed", lines > 0);
		copyStatus.textContent = "";
	}

	// ------------------------------------------------------------- Start

	function chooseSpeed(speed: number) {
		setRate(speed);
		for (const button of document.querySelectorAll<HTMLElement>(
			"[data-cal-speed]",
		)) {
			button.setAttribute(
				"aria-pressed",
				String(Number(button.dataset.calSpeed) === speed),
			);
		}
	}

	for (const button of document.querySelectorAll<HTMLElement>(
		"[data-cal-speed]",
	)) {
		button.addEventListener("click", () => {
			chooseSpeed(Number(button.dataset.calSpeed));
			refresh();
		});
	}

	for (const specimen of specimens) {
		connect(specimen);
		const replay =
			specimen.root.querySelector<HTMLElement>("[data-cal-replay]");
		const end = specimen.root.querySelector<HTMLElement>("[data-cal-end]");
		replay?.addEventListener("click", () => {
			if (end) work(specimen, true);
			else plays[specimen.term]?.(specimen);
			follow();
		});
		end?.addEventListener("click", () => {
			work(specimen, false);
			follow();
		});
		for (const button of specimen.root.querySelectorAll<HTMLElement>(
			"[data-cal-way]",
		)) {
			button.addEventListener("click", () => {
				navigate(specimen, button.dataset.calWay as Way);
				follow();
			});
		}
		// A close ends on its own transition, then the ring fades.
		for (const box of inside(specimen, "[data-cal-ring]")) {
			box.querySelector("path")?.addEventListener("transitionend", (event) => {
				if (
					(event as TransitionEvent).propertyName === "stroke-dasharray" &&
					box.dataset.calRing === "closing"
				)
					box.dataset.calRing = "gone";
			});
		}
	}

	document
		.querySelector("[data-cal-reset-all]")!
		.addEventListener("click", () => {
			for (const specimen of specimens) {
				specimen.values = copyOf(specimen.base);
				show(specimen);
				write(specimen);
				label(specimen);
				plot(specimen);
			}
			refresh();
		});

	// The tailnet page is not a secure context, so the clipboard API is not
	// there; the older command copies the selection, where it still can.
	document
		.querySelector("[data-cal-select]")!
		.addEventListener("click", async () => {
			copy.focus();
			copy.select();
			let copied = false;
			if (window.isSecureContext && navigator.clipboard) {
				try {
					await navigator.clipboard.writeText(copy.value);
					copied = true;
				} catch {
					copied = false;
				}
			}
			if (!copied) {
				try {
					copied = document.execCommand("copy");
				} catch {
					copied = false;
				}
			}
			copyStatus.textContent = copied
				? "Copied."
				: "Selected. This page cannot copy here, so press Ctrl+C, or ⌘C on a Mac.";
		});

	if (systemAsksLess()) {
		document.querySelector<HTMLElement>("[data-cal-os]")!.hidden = false;
	}

	restore(new URLSearchParams(location.search));
	for (const specimen of specimens) {
		show(specimen);
		write(specimen);
		label(specimen);
		plot(specimen);
	}
	refresh();
}
