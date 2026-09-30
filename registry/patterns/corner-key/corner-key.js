// Candidate corner key engine, derived from Kinra Space at
// 8589b8a (src/lib/cornerKey.ts). See README.md for evidence and ownership.
// Animates caller-owned markup; no dependencies, automatic initialization,
// network use, or application state. CSS renders every face without script.
const LOOKS = {
	rest: { glyph: "arrow" },
	send: { glyph: "arrow", fill: true, lean: true },
	sending: { glyph: "stop", ink: "text", trace: "muted" },
	working: { glyph: "stop", ink: "text", trace: "live" },
	queue: { glyph: "queue", fill: true, lean: true, trace: "live" },
	shell: { glyph: "shell", fill: true },
	command: { glyph: "slash", fill: true },
	uploading: { glyph: "arrow", trace: "live" },
	blocked: { glyph: "alert", ink: "error", tone: "error" },
	watching: { glyph: "arrow", ink: "faint" },
	waiting: { glyph: "dots", pulse: true },
};
const STROKE = 2.25;
const EASE_IN = "cubic-bezier(0.4, 0, 1, 1)";
const EASE_MORPH = "cubic-bezier(0.4, 0, 0, 1)";
const EASE_BLOOM = "cubic-bezier(0.2, 0, 0, 1)";
const EASE_FOLD = "cubic-bezier(0.4, 0, 0.2, 1)";
const line = (x1, y1, x2, y2, w = STROKE, r = w / 2) => ({
	x1,
	y1,
	x2,
	y2,
	w,
	r,
});
const dot = (x, y, w = 2.75) => line(x, y, x, y, w, w / 2);
// A hidden stroke has no width and waits where it will grow from.
const hide = (x, y) => line(x, y, x, y, 0, 0);
const block = (size, r) => line(12, 12, 12, 12, size, r);
const GLYPHS = {
	arrow: [
		line(12, 18.5, 12, 5.5),
		line(6.5, 11, 12, 5.5),
		line(17.5, 11, 12, 5.5),
		hide(12, 5.5),
	],
	stop: [block(10, 2.5), block(10, 2.5), block(10, 2.5), hide(12, 12)],
	queue: [
		line(12, 19.5, 12, 10),
		line(7.5, 14.5, 12, 10),
		line(16.5, 14.5, 12, 10),
		line(6.5, 5, 17.5, 5),
	],
	shell: [
		line(13.5, 17.5, 18.5, 17.5),
		line(6, 17, 11, 12),
		line(6, 7, 11, 12),
		hide(16, 17.5),
	],
	slash: [line(15, 5, 9, 19), hide(12, 12), hide(12, 12), hide(12, 12)],
	alert: [line(12, 6, 12, 13), dot(12, 18), hide(12, 9.5), hide(12, 9.5)],
	dots: [dot(6.5, 12), dot(12, 12), dot(17.5, 12), hide(12, 12)],
};
// Between a line icon and the solid Stop, strokes first fold into one upright
// line and only then widen, so they never smear into a blob.
const SPINE = [
	line(12, 7, 12, 17),
	line(12, 7, 12, 17),
	line(12, 7, 12, 17),
	hide(12, 7),
];
const SOLID = new Set(["stop"]);
/** A face's accessible name when nothing more particular applies. */
export const faceNames = {
	rest: "Send message",
	send: "Send message",
	sending: "Sending…",
	working: "Stop work",
	queue: "Queue message",
	shell: "Run command line",
	command: "Run command",
	uploading: "Send message",
	blocked: "Send message",
	watching: "Send message",
	waiting: "Send message",
};
/** The faces a press acts on; the rest are named and shown, not pressed. */
export const pressable = new Set([
	"send",
	"queue",
	"shell",
	"command",
	"working",
]);
// The faces that say only that this page is away from a turn: they carry no
// light, and a turn that ends while one shows closes none.
const AWAY = new Set(["waiting", "watching"]);
// Animations the engine started, as against the CSS transitions on the same
// elements, which it leaves alone.
const running = (element) =>
	element
		.getAnimations()
		.filter((animation) => !("transitionProperty" in animation));
const clip = ([top, right, bottom, left]) =>
	`inset(${top}% ${right}% ${bottom}% ${left}%)`;
// A stroke as a pose: centre, angle, length, width, corner radius. A line
// repeats every 180°. A square block stands upright like the spine it widens
// from, and a dot never turns.
function pose(stroke) {
	const len = Math.hypot(stroke.x2 - stroke.x1, stroke.y2 - stroke.y1);
	const solid = !len && stroke.w > 0 && stroke.r < stroke.w / 2;
	let angle = len
		? (Math.atan2(stroke.y2 - stroke.y1, stroke.x2 - stroke.x1) * 180) / Math.PI
		: solid
			? 90
			: 0;
	if (len) {
		while (angle > 90) angle -= 180;
		while (angle <= -90) angle += 180;
	}
	return {
		x: (stroke.x1 + stroke.x2) / 2,
		y: (stroke.y1 + stroke.y2) / 2,
		len,
		angle,
		w: stroke.w,
		r: stroke.r,
		period: len || solid ? 180 : 0,
	};
}
// The equivalent angle nearest the stroke's current one, so nothing spins.
function turnTo(from, to, period) {
	if (!period) return from;
	let angle = to;
	while (angle - from > period / 2 + 0.01) angle -= period;
	while (from - angle > period / 2 + 0.01) angle += period;
	return angle;
}
export class KeyEngine {
	key;
	fill;
	flash;
	glyphs;
	traces;
	slots;
	reduce;
	resizeObserver;
	onMotion = () => {
		if (this.face) this.set(this.face, { instant: true, force: true });
	};
	motion = {
		bloom: 260,
		retract: 200,
		lift: 260,
		morph: 320,
		fold: 400,
		close: 300,
		blink: 480,
	};
	easing = { bloom: EASE_BLOOM, lift: EASE_IN, morph: EASE_MORPH };
	face;
	glyph;
	turn = false;
	timers = [];
	// The closed ring's fade, which only the light's own next change cancels.
	fading;
	loops = [];
	sent = -Infinity;
	u = 1;
	offset = 0;
	corner = [100, 0, 0, 100];
	constructor(key, face, turn = false) {
		this.key = key;
		const view = key.ownerDocument.defaultView;
		this.reduce = view.matchMedia("(prefers-reduced-motion: reduce)");
		this.fill = key.querySelector(".kin-pattern-corner-key__fill");
		this.flash = key.querySelector(".kin-pattern-corner-key__flash");
		this.glyphs = [...key.querySelectorAll(".kin-pattern-corner-key__glyph")];
		this.traces = [
			...key.querySelectorAll(".kin-pattern-corner-key__trace path"),
		];
		const [under, over] = this.glyphs.map((glyph) => [
			...glyph.querySelectorAll(".kin-pattern-corner-key__stroke"),
		]);
		this.slots = under.map((node, index) => ({
			nodes: [node, over[index]],
			bars: [node.firstElementChild, over[index].firstElementChild],
			pose: pose(hide(12, 12)),
		}));
		this.measure();
		this.set(face, { instant: true, turn });
		key.toggleAttribute("data-enhanced", true);
		this.resizeObserver = new view.ResizeObserver(() => this.resize());
		this.resizeObserver.observe(key);
		const bend = key.querySelector(".kin-pattern-corner-key__bend");
		if (bend) this.resizeObserver.observe(bend);
		this.reduce.addEventListener("change", this.onMotion);
	}
	/**
	 * The next change away from a lit face is a message leaving: the fill lifts
	 * out of the top instead of falling back into its corner. It holds for the
	 * next change only, and not past a moment in which nothing changed.
	 */
	expectSent() {
		this.sent = performance.now();
	}
	/** The key's size, corner or direction changed: redraw the current face in place. */
	resize() {
		this.measure();
		if (this.face) this.set(this.face, { instant: true, force: true });
	}
	destroy() {
		this.resizeObserver.disconnect();
		this.reduce.removeEventListener("change", this.onMotion);
		this.key.removeAttribute("data-enhanced");
		this.timers.forEach(clearTimeout);
		clearTimeout(this.fading);
		this.loops.forEach((animation) => animation.cancel());
		for (const element of [this.fill, this.flash, ...this.glyphs])
			running(element).forEach((animation) => animation.cancel());
		for (const slot of this.slots)
			[...slot.nodes, ...slot.bars].forEach((node) => {
				running(node).forEach((animation) => animation.cancel());
				node.removeAttribute("style");
			});
		this.fill.style.removeProperty("clip-path");
	}
	// The icon is 44% of the key: 21px with a 2px stroke in a 48px key. The
	// light runs just inside the key's own edge and bends with its one rounded
	// corner, which is the end corner of the surface it sits in.
	measure() {
		const style = getComputedStyle(this.key);
		const duration = (name, fallback) => {
			const value = style.getPropertyValue("--kin-duration-" + name).trim();
			const number = parseFloat(value);
			return Number.isFinite(number)
				? number * (value.endsWith("ms") ? 1 : 1000)
				: fallback;
		};
		for (const name of ["bloom", "retract", "lift", "morph", "fold", "close"])
			this.motion[name] = duration(name, this.motion[name]);
		this.motion.blink = duration("deliberate", this.motion.blink);
		for (const name of ["bloom", "lift", "morph"])
			this.easing[name] =
				style.getPropertyValue("--kin-ease-" + name).trim() ||
				this.easing[name];
		const size = this.key.offsetWidth || 48;
		const icon = size * 0.44;
		this.u = icon / 24;
		this.offset = (size - icon) / 2;
		const rtl = style.direction === "rtl";
		this.corner = rtl ? [100, 100, 0, 0] : [100, 0, 0, 100];
		const width = Math.max(2, Math.round(size / 24));
		const radius = parseFloat(style.borderEndEndRadius) || 0;
		const inner = width / 2;
		const outer = size - inner;
		const bend = Math.max(0, radius - inner);
		const arc = (x, sweep) =>
			bend ? `A${bend} ${bend} 0 0 ${sweep} ${x} ${outer}` : "";
		const d = rtl
			? `M${outer} ${inner}H${inner}V${outer - bend}${arc(inner + bend, 0)}H${outer}Z`
			: `M${inner} ${inner}H${outer}V${outer - bend}${arc(outer - bend, 1)}H${inner}Z`;
		this.key.style.setProperty("--kin-pattern-key-trace-width", `${width}px`);
		this.traces.forEach((path) => {
			path.ownerSVGElement?.setAttribute("viewBox", `0 0 ${size} ${size}`);
			path.setAttribute("d", d);
		});
	}
	still() {
		return this.reduce.matches;
	}
	later(run, ms) {
		this.timers.push(setTimeout(run, ms));
	}
	css(p) {
		const { u, offset } = this;
		return {
			transform: `translate(${offset + p.x * u}px, ${offset + p.y * u}px) rotate(${p.angle}deg)`,
			bar: {
				width: `${(p.len + p.w) * u}px`,
				height: `${p.w * u}px`,
				borderRadius: `${p.r * u}px`,
			},
		};
	}
	apply(slot, p) {
		const shape = this.css(p);
		slot.nodes.forEach((node) => (node.style.transform = shape.transform));
		slot.bars.forEach((bar) => Object.assign(bar.style, shape.bar));
		slot.pose = p;
	}
	// Where a stroke is right now, even halfway through a change.
	read(slot) {
		const [node] = slot.nodes;
		const [bar] = slot.bars;
		const moving = running(node).length > 0;
		const sizing = running(bar).length > 0;
		if (moving || sizing) {
			const p = { ...slot.pose };
			if (moving) {
				const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
				p.x = (matrix.e - this.offset) / this.u;
				p.y = (matrix.f - this.offset) / this.u;
				p.angle = (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
			}
			if (sizing) {
				const style = getComputedStyle(bar);
				p.w = parseFloat(style.height) / this.u;
				p.len = Math.max(0, parseFloat(style.width) / this.u - p.w);
				p.r = parseFloat(style.borderTopLeftRadius) / this.u;
			}
			slot.pose = p;
		}
		[...slot.nodes, ...slot.bars].forEach((element) =>
			running(element).forEach((animation) => animation.cancel()),
		);
		this.apply(slot, slot.pose);
	}
	// The fill's clip right now, as top, right, bottom and left in percent.
	readFill() {
		const value = getComputedStyle(this.fill).clipPath || "";
		running(this.fill).forEach((animation) => animation.cancel());
		const match = /inset\(([^)]*)\)/.exec(value);
		if (!match) return [...this.corner];
		const [top, right = top, bottom = top, left = right] = match[1]
			.trim()
			.split(/\s+/)
			.map(parseFloat);
		return [top, right, bottom, left];
	}
	morph(name, timing) {
		const via =
			timing &&
			this.glyph &&
			this.glyph !== name &&
			SOLID.has(name) !== SOLID.has(this.glyph)
				? SPINE
				: undefined;
		this.glyph = name;
		GLYPHS[name].forEach((shape, index) => {
			const slot = this.slots[index];
			const from = slot.pose;
			const middle = via && pose(via[index]);
			if (middle)
				middle.angle = turnTo(from.angle, middle.angle, middle.period);
			const to = pose(shape);
			to.angle = turnTo((middle || from).angle, to.angle, to.period);
			const start = this.css(from);
			const end = this.css(to);
			this.apply(slot, to);
			if (!timing) return;
			if (middle) {
				const turn = this.css(middle);
				const options = {
					duration: this.motion.fold,
					delay: timing.delay,
					fill: "backwards",
				};
				slot.nodes.forEach((node) =>
					node.animate(
						[
							{ transform: start.transform, easing: EASE_FOLD },
							{
								transform: turn.transform,
								offset: 0.45,
								easing: this.easing.morph,
							},
							{ transform: end.transform },
						],
						options,
					),
				);
				slot.bars.forEach((bar) =>
					bar.animate(
						[
							{ ...start.bar, easing: EASE_FOLD },
							{ ...turn.bar, offset: 0.45, easing: this.easing.morph },
							end.bar,
						],
						options,
					),
				);
				return;
			}
			const options = {
				duration: timing.duration,
				delay: timing.delay + index * timing.stagger,
				easing: this.easing.morph,
				fill: "backwards",
			};
			slot.nodes.forEach((node) =>
				node.animate(
					[{ transform: start.transform }, { transform: end.transform }],
					options,
				),
			);
			slot.bars.forEach((bar) => bar.animate([start.bar, end.bar], options));
		});
	}
	settleGlyphs() {
		this.glyphs.forEach((glyph) =>
			running(glyph).forEach((animation) => animation.cancel()),
		);
		running(this.flash).forEach((animation) => animation.cancel());
	}
	// The fill carries its own copy of the light, which shows only where the fill
	// does, so it runs only while some of the fill is out of its corner
	// (kin-pattern-corner-key.css). Growing again, it rejoins the light where the key's own
	// copy has run to, so the two meet at the fill's edge.
	lit(shown) {
		this.key.toggleAttribute("data-lit", shown);
		if (!shown) return;
		const [own, copy] = this.traces.map((path) =>
			path.getAnimations().find((animation) => "animationName" in animation),
		);
		if (!own || !copy) return;
		if (own.startTime === null) copy.currentTime = own.currentTime;
		else copy.startTime = own.startTime;
	}
	// The fill is back in its corner once a movement that takes it there ends,
	// unless another has taken its place.
	emptied(movement) {
		movement.finished.then(
			() => this.lit(false),
			() => {},
		);
	}
	// Waking: the fill grows out of the pinned corner and blinks once as it lands.
	bloom() {
		const now = this.readFill();
		this.settleGlyphs();
		this.lit(true);
		this.fill.style.clipPath = clip([0, 0, 0, 0]);
		this.fill.animate(
			[{ clipPath: clip(now) }, { clipPath: clip([0, 0, 0, 0]) }],
			{
				duration: this.motion.bloom,
				easing: this.easing.bloom,
			},
		);
		this.flash.animate(
			[
				{ opacity: 0.55 },
				{ opacity: 0.08, offset: 0.2 },
				{ opacity: 0.38, offset: 0.36 },
				{ opacity: 0 },
			],
			{ duration: this.motion.blink, easing: "ease-out" },
		);
		this.glyphs.forEach((glyph) =>
			glyph.animate(
				[
					{ transform: `translateY(${this.u * 4}px)` },
					{ transform: "translateY(0px)" },
				],
				{
					duration: 340,
					delay: 20,
					easing: this.easing.bloom,
					fill: "backwards",
				},
			),
		);
	}
	// Going dark: the fill falls back into the corner it came from.
	retract() {
		const now = this.readFill();
		this.fill.style.clipPath = clip(this.corner);
		this.emptied(
			this.fill.animate(
				[{ clipPath: clip(now) }, { clipPath: clip(this.corner) }],
				{
					duration: this.motion.retract,
					easing: this.easing.lift,
				},
			),
		);
	}
	// Sent: the fill lifts out of the top, the way the message travels, and the
	// icon kicks.
	lift() {
		const now = this.readFill();
		this.settleGlyphs();
		this.fill.style.clipPath = clip(this.corner);
		this.emptied(
			this.fill.animate(
				[
					{ clipPath: clip(now) },
					{ clipPath: clip([now[0], now[1], 100 - now[0], now[3]]) },
				],
				{ duration: this.motion.lift, easing: this.easing.lift },
			),
		);
		this.glyphs.forEach((glyph) =>
			glyph.animate(
				[
					{ transform: "translateY(0px)" },
					{ transform: `translateY(${-this.u * 3}px)`, offset: 0.35 },
					{ transform: "translateY(0px)" },
				],
				{ duration: 340, easing: "cubic-bezier(0.3, 0, 0.2, 1)" },
			),
		);
	}
	// Work in flight runs a light along the edge; the end of a turn closes it
	// into a ring before it fades.
	trace(light, closing) {
		const { dataset } = this.key;
		clearTimeout(this.fading);
		if (light) dataset.trace = light;
		else if (dataset.trace && closing) {
			dataset.trace = "closing";
			this.fading = setTimeout(
				() => delete this.key.dataset.trace,
				this.motion.close + 20,
			);
		} else delete dataset.trace;
	}
	pulse(look) {
		this.loops.forEach((animation) => animation.cancel());
		this.loops = [];
		if (!look.pulse || this.still()) return;
		this.slots.slice(0, 3).forEach((slot, index) =>
			this.loops.push(
				slot.bars[0].animate(
					[{ opacity: 1 }, { opacity: 0.25, offset: 0.45 }, { opacity: 1 }],
					{
						duration: 1050,
						delay: index * 175,
						iterations: Infinity,
						easing: "ease-in-out",
					},
				),
			),
		);
	}
	/**
	 * Show a face, and whether a turn is in flight: at once, or by the
	 * movement that says how it changed.
	 */
	set(face, how = {}) {
		const turn = how.turn ?? this.turn;
		if (this.face === face && this.turn === turn && !how.force) return;
		const prev = this.face && LOOKS[this.face];
		const next = LOOKS[face];
		if (!next) throw new RangeError("Unknown corner key face: " + face);
		// A turn that ends closes its light; one that only stops being watched from
		// here, or waits for the connection, lets it go without a ring. While a
		// turn runs, a face with no light of its own, a command or a line for the
		// workspace, carries the turn's.
		const ended = this.turn && !turn && !AWAY.has(face);
		const light = next.trace ?? (turn && !AWAY.has(face) ? "live" : undefined);
		const still = how.instant || !prev || this.still();
		this.turn = turn;
		if (this.face === face && !how.force) {
			// Only the turn changed: the light follows it, and nothing else moves.
			this.trace(light, ended && !still);
			return;
		}
		this.face = face;
		const { dataset } = this.key;
		dataset.face = face;
		dataset.ink = next.ink || "muted";
		this.key.toggleAttribute("data-lean", !!next.lean);
		if (next.tone) dataset.tone = next.tone;
		else delete dataset.tone;
		this.timers.forEach(clearTimeout);
		this.timers = [];
		this.loops.forEach((animation) => animation.cancel());
		this.loops = [];
		const sent = performance.now() - this.sent < 1500;
		this.sent = -Infinity;
		this.trace(light, ended && !still);
		if (still) {
			this.slots.forEach((slot) => this.read(slot));
			this.settleGlyphs();
			this.morph(next.glyph);
			this.readFill();
			this.fill.style.clipPath = clip(next.fill ? [0, 0, 0, 0] : this.corner);
			this.lit(!!next.fill);
			this.pulse(next);
			return;
		}
		let delay = 0;
		if (next.fill && !prev.fill) this.bloom();
		else if (prev.fill && !next.fill) {
			if (sent || face === "sending") {
				this.lift();
				delay = 40;
			} else this.retract();
		}
		if (ended) delay = 180;
		// Only a change of icon interrupts strokes that are still moving.
		if (prev.glyph !== next.glyph) {
			this.slots.forEach((slot) => this.read(slot));
			this.morph(next.glyph, {
				duration: this.motion.morph,
				delay,
				stagger: 18,
			});
		}
		if (next.pulse)
			this.later(() => this.pulse(LOOKS[this.face]), delay + this.motion.morph);
	}
}
