/**
 * Graphite's tones (/tones/): the ladder as shipped, the ladder it replaced,
 * the ladders considered, and the measurements that judged them. Pure
 * functions, so the page and Node compute the same values;
 * tests/unit/tones.test.js holds tokens.css to SHIPPED and SHIPPED to the
 * rule in docs/catalog.md.
 *
 * Only graphite changed. Paper keeps its values: every token is written as
 * light-dark(<paper>, <graphite>).
 */

export type Params = {
	/** OKLCH lightness between page, panel and raised: ground → surface → raised. */
	step: number;
	/** OKLCH lightness from the page down to ground-deep. */
	deep: number;
	/** OKLCH lightness added to the page itself (0 keeps the old #101114). */
	lift: number;
};

export type Ladder = {
	deep: string;
	ground: string;
	surface: string;
	raised: string;
	rule: string;
	ruleStrong: string;
	muted: string;
	edge: string;
	/** Alphas of the translucent layers, as fractions. */
	card: number;
	hover: number;
	liftHover: number;
	well: number;
	wellHover: number;
	stepAlpha: number;
};

export const TEXT = "#e3e3e6";
export const SUBTLE = "#b4b8bf";
const BLACK = "#000000";

/** The step, in OKLCH lightness, that graphite's tones stand apart. */
export const STEP = 0.045;

/** Graphite as tokens.css shipped it to 0.8.0: steps of about 0.026. */
export const BEFORE: Ladder = {
	deep: "#0c0d10",
	ground: "#101114",
	surface: "#14171d",
	raised: "#1a1d23",
	rule: "#2a2e36",
	ruleStrong: "#3a3f49",
	muted: "#8c9099",
	edge: "#626975",
	card: 0.035,
	hover: 0.06,
	liftHover: 0.1,
	well: 0.22,
	wellHover: 0.3,
	stepAlpha: 0.05,
};

/**
 * Graphite as tokens.css ships it: ladder({ step: 0.045, deep: 0.045,
 * lift: 0.02 }), chosen by Blake on 2026-11-20.
 */
export const SHIPPED: Ladder = {
	deep: "#0b0c0f",
	ground: "#141518",
	surface: "#1d2026",
	raised: "#282b31",
	rule: "#343840",
	ruleStrong: "#444953",
	muted: "#9b9fa8",
	edge: "#6d7480",
	card: 0.054,
	hover: 0.06,
	liftHover: 0.1,
	well: 0.266,
	wellHover: 0.346,
	stepAlpha: 0.05,
};

const GROUND_L = 0.1779;

// --- colour arithmetic -----------------------------------------------------

const channels = (hex: string) =>
	[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex = (values: number[]) =>
	"#" +
	values
		.map((v) =>
			Math.round(Math.max(0, Math.min(255, v)))
				.toString(16)
				.padStart(2, "0"),
		)
		.join("");
const linear = (c: number) => {
	const v = c / 255;
	return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const encode = (x: number) => {
	const v = Math.max(0, Math.min(1, x));
	return (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055) * 255;
};

export const luminance = (h: string) => {
	const [r, g, b] = channels(h).map(linear);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** CIE L*, 0 to 100. */
export const lstar = (h: string) => {
	const y = luminance(h);
	return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (y * 24389) / 27;
};

/** L* as seen through a uniform veil of light, a fraction of white. */
export const veiled = (h: string, veil: number) => {
	const y = (luminance(h) + veil) / (1 + veil);
	return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (y * 24389) / 27;
};

export const ratio = (a: string, b: string) => {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
};

export const oklab = (h: string) => {
	const [r, g, b] = channels(h).map(linear);
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	return [
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
	];
};

export const okl = (h: string) => oklab(h)[0];

export const oklch = (L: number, C: number, H: number) => {
	const a = C * Math.cos((H * Math.PI) / 180);
	const b = C * Math.sin((H * Math.PI) / 180);
	const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
	return hex(
		[
			4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
			-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
			-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
		].map(encode),
	);
};

/** One colour laid over another at an alpha, composited as the browser does. */
export const over = (top: string, alpha: number, base: string) => {
	const t = channels(top);
	const b = channels(base);
	return hex(t.map((v, i) => alpha * v + (1 - alpha) * b[i]));
};

/** The alpha at which `top` over `base` moves OKLCH lightness by `delta`. */
const alphaFor = (top: string, base: string, delta: number) => {
	let lo = 0;
	let hi = 1;
	for (let i = 0; i < 40; i++) {
		const mid = (lo + hi) / 2;
		const moved = okl(over(top, mid, base)) - okl(base);
		if (Math.abs(moved) < Math.abs(delta)) lo = mid;
		else hi = mid;
	}
	return Math.round(((lo + hi) / 2) * 1000) / 1000;
};

/** The least lift of a colour's OKLCH lightness that meets every floor. */
const lifted = (h: string, floors: [string, number][]) => {
	const [L, a, b] = oklab(h);
	const C = Math.hypot(a, b);
	const H = (Math.atan2(b, a) * 180) / Math.PI;
	for (let add = 0; add < 0.3; add += 0.002) {
		const candidate = add === 0 ? h : oklch(L + add, C, H);
		if (floors.every(([on, floor]) => ratio(candidate, on) >= floor)) {
			return candidate;
		}
	}
	return h;
};

// --- the ladder ------------------------------------------------------------

export function ladder(p: Params): Ladder {
	const g = GROUND_L + p.lift;
	const surface = oklch(g + p.step, 0.013, 264.2);
	const raised = oklch(g + 2 * p.step, 0.012, 264.3);
	const deep = oklch(g - p.deep, 0.007, 271);
	const card = alphaFor(TEXT, surface, p.step);
	const cardTone = over(TEXT, card, surface);
	// A hover keeps its alpha unless a full step needs half a point more:
	// less moves a row by under 0.1 L*, too little to see.
	const needed = alphaFor(TEXT, cardTone, p.step);
	const hover = needed >= BEFORE.hover + 0.005 ? needed : BEFORE.hover;
	const well = Math.max(BEFORE.well, alphaFor(BLACK, surface, -0.8 * p.step));
	// Muted text holds against a full step over the lightest tones, whatever
	// alpha the hover keeps.
	const full = Math.max(hover, needed);
	const lightest = [over(TEXT, full, raised), over(TEXT, full, cardTone)];
	return {
		deep,
		ground: p.lift === 0 ? BEFORE.ground : oklch(g, 0.006, 271),
		surface,
		raised,
		rule: oklch(g + p.step + 0.097, 0.016, 264.3),
		ruleStrong: oklch(g + p.step + 0.163, 0.018, 264.3),
		muted: lifted(
			BEFORE.muted,
			lightest.map((on) => [on, 4.5] as [string, number]),
		),
		edge: lifted(BEFORE.edge, [
			[cardTone, 3],
			[raised, 3],
		]),
		card,
		hover,
		liftHover:
			Math.round(Math.max(BEFORE.liftHover, hover + 0.04) * 1000) / 1000,
		well,
		wellHover: Math.round((well + 0.08) * 1000) / 1000,
		stepAlpha: Math.max(BEFORE.stepAlpha, alphaFor(TEXT, deep, 0.8 * p.step)),
	};
}

// --- measurements ----------------------------------------------------------

export type Pair = { name: string; where: string; a: string; b: string };

/** Every place two graphite tones meet with no line between them. */
export function pairs(t: Ladder): Pair[] {
	const card = over(TEXT, t.card, t.surface);
	return [
		{
			name: "Page | deep",
			where: "Code, a header band or a table head on the page",
			a: t.ground,
			b: t.deep,
		},
		{
			name: "Page | panel",
			where: "A panel or specimen on the page",
			a: t.ground,
			b: t.surface,
		},
		{
			name: "Shelf | panel",
			where: "The application frame: chrome and its work",
			a: t.deep,
			b: t.surface,
		},
		{
			name: "Panel | card",
			where: "A card, bounded list or empty state on a panel",
			a: t.surface,
			b: card,
		},
		{
			name: "Page | card",
			where: "A card straight on the page",
			a: t.ground,
			b: over(TEXT, t.card, t.ground),
		},
		{
			name: "Panel | well",
			where: "An input, badge or progress track on a panel",
			a: t.surface,
			b: over(BLACK, t.well, t.surface),
		},
		{
			name: "Panel | raised",
			where: "A toast, drawer or popover over a panel",
			a: t.surface,
			b: t.raised,
		},
		{
			name: "Card | hover",
			where: "A row under the pointer",
			a: card,
			b: over(TEXT, t.hover, card),
		},
	];
}

export function checks(t: Ladder) {
	const card = over(TEXT, t.card, t.surface);
	const lightest = over(TEXT, t.hover, t.raised);
	return [
		{
			name: "Muted text on the lightest tone",
			value: ratio(t.muted, lightest),
			floor: 4.5,
		},
		{ name: "Muted text on a card", value: ratio(t.muted, card), floor: 4.5 },
		{
			name: "Subtle text on the lightest tone",
			value: ratio(SUBTLE, lightest),
			floor: 4.5,
		},
		{ name: "Control edge on a card", value: ratio(t.edge, card), floor: 3 },
		{
			name: "Control edge on a raised layer",
			value: ratio(t.edge, t.raised),
			floor: 3,
		},
	];
}

// --- CSS -------------------------------------------------------------------

const pct = (alpha: number) => `${Math.round(alpha * 1000) / 10}%`;
const ink = (alpha: number) =>
	`color-mix(in srgb, var(--kin-color-text) ${pct(alpha)}, transparent)`;
const shade = (alpha: number) =>
	`rgb(0 0 0 / ${Math.round(alpha * 1000) / 1000})`;

/**
 * Declarations for a ladder. Tokens that read a changed token are declared
 * again, because a var() in a custom property resolves where it is declared.
 */
export function declarations(t: Ladder): [string, string][] {
	return [
		["--kin-color-ground-deep", `light-dark(#eeede9, ${t.deep})`],
		["--kin-color-ground", `light-dark(#f6f5f2, ${t.ground})`],
		["--kin-color-surface", `light-dark(#fdfcf9, ${t.surface})`],
		["--kin-color-surface-raised", `light-dark(#ffffff, ${t.raised})`],
		["--kin-color-text-muted", `light-dark(#585e68, ${t.muted})`],
		["--kin-color-rule", `light-dark(#d3d6dc, ${t.rule})`],
		["--kin-color-rule-strong", `light-dark(#b3b8c1, ${t.ruleStrong})`],
		["--kin-color-control-edge", `light-dark(#7f8691, ${t.edge})`],
		[
			"--kin-surface-card",
			`light-dark(rgb(255 255 255 / 0.9), ${ink(t.card)})`,
		],
		["--kin-surface-hover", `light-dark(${ink(0.06)}, ${ink(t.hover)})`],
		[
			"--kin-surface-lift-hover",
			`light-dark(${ink(0.1)}, ${ink(t.liftHover)})`,
		],
		["--kin-surface-step", `light-dark(${ink(0.05)}, ${ink(t.stepAlpha)})`],
		[
			"--kin-surface-well",
			`light-dark(rgb(21 23 28 / 0.04), ${shade(t.well)})`,
		],
		[
			"--kin-surface-well-hover",
			`light-dark(rgb(21 23 28 / 0.065), ${shade(t.wellHover)})`,
		],
		["--kin-surface-lift", "var(--kin-surface-hover)"],
		[
			"--kin-border-subtle",
			"color-mix(in srgb, var(--kin-color-rule) 68%, transparent)",
		],
		[
			"--kin-border-quiet",
			"color-mix(in srgb, var(--kin-color-rule) 42%, transparent)",
		],
		[
			"--kin-surface-panel",
			"color-mix(in srgb, var(--kin-color-surface) 92%, transparent)",
		],
		[
			"--kin-surface-raised",
			"color-mix(in srgb, var(--kin-color-surface-raised) 88%, transparent)",
		],
		["--kin-surface-nested", "var(--kin-color-surface)"],
		[
			"--kin-backdrop",
			"color-mix(in srgb, var(--kin-color-ground-deep) 62%, transparent)",
		],
		["--kin-shell-shelf", "var(--kin-color-ground-deep)"],
		["--kin-shell-panel", "var(--kin-color-surface)"],
		["--kin-shell-flush", "var(--kin-color-ground)"],
	];
}

export const css = (t: Ladder, selector: string) =>
	`${selector} {\n${declarations(t)
		.map(([name, value]) => `\t${name}: ${value};`)
		.join("\n")}\n}\n`;

// --- the ladders compared on /tones/ ---------------------------------------

export const PRESETS: {
	id: string;
	label: string;
	note: string;
	tones: Ladder;
}[] = [
	{
		id: "before",
		label: "Before",
		note: "steps of about 0.026, to 0.8.0",
		tones: BEFORE,
	},
	{
		id: "a",
		label: "Considered: steps 0.040",
		note: "step 0.04 · deep 0.035 · page +0",
		tones: ladder({ step: 0.04, deep: 0.035, lift: 0 }),
	},
	{
		id: "b",
		label: "Considered: steps 0.050",
		note: "step 0.05 · deep 0.045 · page +0",
		tones: ladder({ step: 0.05, deep: 0.045, lift: 0 }),
	},
	{
		id: "now",
		label: "Shipped: steps 0.045, page lifted",
		note: "step 0.045 · deep 0.045 · page +0.02",
		tones: SHIPPED,
	},
];
