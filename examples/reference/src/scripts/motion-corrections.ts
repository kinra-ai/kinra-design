// The corrections in the motion lab, rebuilt from Kinra Observatory's history.
// Each before reproduces the motion its commit removed and each after the
// motion that replaced it: the same periods, curves, clocks and release, with
// the drawing simplified and synthetic data. Every check line says which rule
// of docs/motion.md the side keeps or breaks, measured as it runs.
import { follow, getRate, labNow, lessMotion } from "./motion-rate.ts";

const ease = "cubic-bezier(0.16, 1, 0.3, 1)";

/** A repeatable number in [0, 1) for each integer, so both sides share data. */
function noise(n: number) {
	let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
	x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
	return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

function check(side: Element, text: string, kept: boolean | null = null) {
	const line = side.querySelector<HTMLElement>("[data-lab-check]")!;
	line.textContent = text;
	if (kept === null) delete line.dataset.kept;
	else line.dataset.kept = String(kept);
}

function runButton(article: HTMLElement, start: () => void, stop: () => void) {
	const button = article.querySelector<HTMLButtonElement>("[data-lab-run]")!;
	const label = button.textContent!.trim();
	button.addEventListener("click", () => {
		const running = button.getAttribute("aria-pressed") === "true";
		button.setAttribute("aria-pressed", String(!running));
		button.textContent = running ? label : label.replace(/^Start|^Run/, "Stop");
		if (running) stop();
		else start();
		follow();
	});
}

// ------------------------------------------------------------- K1, the hand

function hand(article: HTMLElement) {
	const dials = Array.from(article.querySelectorAll<HTMLElement>("[data-k1]"));
	let timer = 0;
	const start = () => {
		// The lab's clock stands in for Kepler's: local time for the slow hands,
		// and every second-turning part shares the seconds hand's phase.
		const offset = -new Date().getTimezoneOffset() * 60000;
		const base = Date.now() - labNow();
		for (const dial of dials) {
			dial.toggleAttribute("data-k1-running", true);
			for (const part of dial.querySelectorAll<HTMLElement>("[data-k1-turn]")) {
				const period = Number(part.dataset.k1Turn);
				const now = base + labNow() + ("k1Local" in part.dataset ? offset : 0);
				const turn = part.animate(
					[{ transform: "rotate(0turn)" }, { transform: "rotate(1turn)" }],
					{
						duration: period,
						iterations: Infinity,
						easing: lessMotion()
							? `steps(${Math.round(period / 1000)})`
							: "linear",
					},
				);
				turn.currentTime = ((now % period) + period) % period;
			}
		}
		const measure = () => {
			for (const dial of dials) {
				const followers = Array.from(
					dial.querySelectorAll<HTMLElement>("[data-k1-follower]"),
				).map((part) => part.dataset.k1Follower);
				const turning = dial
					.getAnimations({ subtree: true })
					.filter(
						(animation) =>
							animation.effect?.getTiming().iterations === Infinity,
					).length;
				if (followers.length) {
					check(
						dial.parentElement!,
						`Rule 13 · breaks: ${turning} layers turn, and ${followers.join(", ")} follow the seconds hand.`,
						false,
					);
				} else {
					check(
						dial.parentElement!,
						`Rule 13 · keeps: ${turning} layers turn, the hands and a shadow; nothing follows.`,
						true,
					);
				}
			}
		};
		measure();
		timer = window.setInterval(measure, 1000);
	};
	const stop = () => {
		clearInterval(timer);
		for (const dial of dials) {
			dial.removeAttribute("data-k1-running");
			for (const animation of dial.getAnimations({ subtree: true }))
				animation.cancel();
			check(dial.parentElement!, "Stopped.");
		}
	};
	runButton(article, start, stop);
}

// ------------------------------------------------------------ K3, the lamps

function lamps(article: HTMLElement) {
	const before = article.querySelector<HTMLElement>("[data-k3-lamps]")!;
	const side = before.parentElement!;
	const bulbs = Array.from(
		before.querySelectorAll<HTMLElement>("[data-k3-lamp]"),
	);
	let flashes: number[] = [];
	let seconds = 0;
	let tick = 0;
	let poll = 0;
	const flash = (bulb: HTMLElement) => {
		// Svelte's {#key} made a new flash for every report, which restarts it.
		bulb.querySelector(".k3-flash")?.remove();
		if (lessMotion()) return;
		const element = document.createElement("span");
		element.className = "k3-flash";
		element.dataset.on = "";
		bulb.append(element);
		flashes.push(labNow());
		follow();
	};
	const measure = () => {
		const now = labNow();
		flashes = flashes.filter((time) => now - time < 10000);
		check(
			side,
			`Rule 3 · breaks: ${flashes.length} flashes in the last ten seconds, at rest.`,
			false,
		);
	};
	// The pulse lamp flashes on each of Kepler's seconds, about 4ms after it.
	const second = () => {
		flash(bulbs[0]);
		measure();
		seconds++;
		tick = window.setTimeout(second, 1000 + 4 - (labNow() % 1000));
		// Every five seconds a snapshot arrives, and each lamp whose latest
		// sample changed flashes with it.
		if (seconds % 5 === 0) {
			poll++;
			for (const [index, bulb] of bulbs.entries()) {
				if (index === 0) continue;
				if (
					noise(poll * 31 + index) < (bulb.dataset.glow === "ok" ? 0.7 : 0.2)
				) {
					flash(bulb);
				}
			}
		}
	};
	runButton(
		article,
		() => {
			seconds = 0;
			tick = window.setTimeout(second, 1000 + 4 - (labNow() % 1000));
			check(side, "Rule 3 · watching…", null);
		},
		() => {
			clearTimeout(tick);
			for (const element of before.querySelectorAll(".k3-flash"))
				element.remove();
			check(side, "Stopped.");
		},
	);
}

// ------------------------------------------------------------ K4, the strip

const SPAN = 60;
const PULSE_SCALES = [
	250, 500, 1000, 2000, 5000, 1e4, 2e4, 5e4, 1e5, 2e5, 5e5, 1e6, 1e7, 1e8, 5e8,
];

/** One pulse a second: its offset from Kepler's second in ns, with a stray every 23. */
function offset(second: number) {
	const a = noise(second * 2) || 1e-9;
	const b = noise(second * 2 + 1);
	const gauss = Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b);
	return Math.round(gauss * 140 + (second % 23 === 0 ? 4200 : 0));
}

const quantile = (values: number[], share: number) => {
	const sorted = [...values].sort((a, b) => a - b);
	return (
		sorted[Math.min(sorted.length - 1, Math.floor(share * sorted.length))] ?? 0
	);
};

function strip(article: HTMLElement) {
	const sides = Array.from(article.querySelectorAll<HTMLElement>("[data-k4]"));
	const stops: (() => void)[] = [];

	// Kepler's clock in the lab: whole seconds of lab time since a fixed origin.
	let origin = 0;
	const kepler = () => origin + labNow();

	/** onSecond as Observatory wrote it: wake about 4ms after each second. */
	function onSecond(
		run: (second: number) => void,
		late: (n: number) => number,
	) {
		let timer = 0;
		let count = 0;
		const tick = () => {
			const ms = kepler();
			const second = Math.floor(ms / 1000);
			// The update then lands a frame later, as Svelte's did.
			requestAnimationFrame(() => run(second));
			timer = window.setTimeout(tick, 1000 + 4 + late(count++) - (ms % 1000));
		};
		tick();
		return () => clearTimeout(timer);
	}

	function follower(side: HTMLElement, plot: HTMLElement, speed: () => number) {
		// Observatory's test: follow the eleventh newest dot every frame; each
		// frame must move it by the strip's speed, to within a pixel.
		const line = side.querySelector<SVGPolylineElement>("[data-k4-error]")!;
		const errors: { at: number; error: number }[] = [];
		let last: { x: number; at: number; second: number } | null = null;
		let frame = 0;
		const step = (at: number) => {
			const dots = Array.from(
				plot.querySelectorAll<HTMLElement>("[data-second]"),
			).sort((a, b) => Number(b.dataset.second) - Number(a.dataset.second));
			const dot = dots[10];
			if (dot) {
				const x = dot.getBoundingClientRect().x;
				const second = Number(dot.dataset.second);
				if (last && last.second === second) {
					errors.push({ at, error: x - last.x - speed() * (at - last.at) });
				}
				last = { x, at, second };
			}
			// The last two and a half seconds of lab time.
			const span = 2500 / getRate();
			while (errors.length && at - errors[0].at > span) errors.shift();
			line.setAttribute(
				"points",
				errors
					.slice(-120)
					.map(
						(entry, index) =>
							`${index},${(10 - Math.max(-10, Math.min(10, entry.error * 5))).toFixed(2)}`,
					)
					.join(" "),
			);
			const worst = errors.reduce(
				(most, entry) => Math.max(most, Math.abs(entry.error)),
				0,
			);
			if (errors.length > 20) {
				check(
					side,
					worst < 1
						? `Rule 8 · keeps: the followed dot moves with the strip to within ${worst.toFixed(2)}px each frame.`
						: `Rule 8 · breaks: the followed dot jumps up to ${worst.toFixed(1)}px off the strip's motion in one frame.`,
					worst < 1,
				);
			}
			frame = requestAnimationFrame(step);
		};
		frame = requestAnimationFrame(step);
		return () => cancelAnimationFrame(frame);
	}

	const dotAt = (strip: HTMLElement, second: number) => {
		let dot = strip.querySelector<HTMLElement>(`[data-second="${second}"]`);
		if (!dot) {
			dot = document.createElement("span");
			dot.className = "k4-dot";
			dot.dataset.second = String(second);
			strip.append(dot);
		}
		return dot;
	};

	// Before 7a780d5: a one-second glide that wraps on Kepler's second, and dots
	// re-laid on a timer that runs a frame or more late.
	function before(side: HTMLElement) {
		const plot = side.querySelector<HTMLElement>("[data-k4-strip]")!;
		const box = plot.parentElement!;
		const width = box.clientWidth;
		const height = box.clientHeight;
		const stepPx = (width - 44) / SPAN;
		const mid = (height - 4) / 2 + 2;
		let glide: Animation | undefined;
		if (!lessMotion()) {
			glide = plot.animate(
				[
					{ transform: "translateX(0)" },
					{ transform: `translateX(${-stepPx}px)` },
				],
				{ duration: 1000, iterations: Infinity, easing: "linear" },
			);
			glide.currentTime = kepler() % 1000;
		}
		const lay = (now: number) => {
			const ticks = Array.from({ length: SPAN }, (_, index) => now - index);
			const offsets = ticks.map(offset);
			const median = quantile(offsets, 0.5);
			const spread =
				quantile(
					offsets.map((value) => Math.abs(value - median)),
					0.98,
				) * 1.15;
			const reach = PULSE_SCALES.find((step) => step >= spread) ?? 1000;
			for (const element of plot.querySelectorAll<HTMLElement>(
				"[data-second]",
			)) {
				if (Number(element.dataset.second) <= now - SPAN) element.remove();
			}
			for (const [index, second] of ticks.entries()) {
				const dot = dotAt(plot, second);
				const y =
					mid -
					Math.max(-1, Math.min(1, (offsets[index] - median) / reach)) *
						(mid - 3);
				dot.style.left = `${(SPAN - 1 - (now - second)) * stepPx}px`;
				dot.style.top = `${y}px`;
				dot.toggleAttribute("data-newest", second === now);
			}
		};
		lay(Math.floor(kepler() / 1000));
		// The timer fires 4ms after the second, then 12 to 40ms late, as
		// Observatory's did under load; the glide wrapped exactly on time.
		const stopTimer = onSecond(
			lay,
			(n) => 12 + Math.round(noise(n + 991) * 28),
		);
		const stopFollow = follower(
			side,
			plot,
			() => (lessMotion() ? 0 : -stepPx / 1000) * rateOf(glide),
		);
		return () => {
			stopTimer();
			stopFollow();
			glide?.cancel();
			plot.replaceChildren();
		};
	}

	// After 7a780d5: one linear animation phase-locked to the clock; each dot
	// placed once by its own second; a scale centred on Kepler's second that
	// widens at once and narrows only after thirty updates.
	function after(side: HTMLElement) {
		const plot = side.querySelector<HTMLElement>("[data-k4-strip]")!;
		const box = plot.parentElement!;
		const band = side.querySelector<HTMLElement>("[data-k4-band]")!;
		const plotWidth = Math.max(0, box.clientWidth - 50);
		const stepPx = plotWidth / SPAN;
		const height = box.clientHeight;
		const mid = height / 2;
		const half = Math.max(1, mid - 4);
		const EPOCH = 1800;
		const run = EPOCH + 2 * SPAN;
		let scale = 1000;
		let narrower = 0;
		let anchor = Math.floor(kepler() / 1000 / EPOCH) * EPOCH - SPAN;
		let glide: Animation | undefined;
		const lock = () => {
			glide?.cancel();
			if (lessMotion()) return;
			glide = plot.animate(
				[
					{ transform: `translateX(${plotWidth}px)` },
					{ transform: `translateX(${plotWidth - run * stepPx}px)` },
				],
				{ duration: run * 1000, iterations: Infinity, easing: "linear" },
			);
			glide.currentTime = kepler() - anchor * 1000;
		};
		const place = (now: number) => {
			if (Math.floor(now / EPOCH) * EPOCH - SPAN !== anchor) {
				anchor = Math.floor(now / EPOCH) * EPOCH - SPAN;
				plot.replaceChildren();
				lock();
			}
			if (lessMotion()) {
				plot.style.transform = `translateX(${plotWidth - (now - anchor) * stepPx}px)`;
			}
			const recent = Array.from({ length: SPAN }, (_, index) => now - index);
			const offsets = recent.map(offset);
			const median = quantile(offsets, 0.5);
			const quartile = (quantile(offsets, 0.75) - quantile(offsets, 0.25)) / 2;
			const need = Math.abs(median) + 4 * quartile;
			const next =
				PULSE_SCALES.find((step) => step >= need) ?? PULSE_SCALES.at(-1)!;
			if (next >= scale) {
				scale = next;
				narrower = 0;
			} else if (++narrower >= 30) {
				scale = next;
				narrower = 0;
			}
			band.style.top = `${mid - ((median + quartile) / scale) * half}px`;
			band.style.height = `${((2 * quartile) / scale) * half}px`;
			for (const element of plot.querySelectorAll<HTMLElement>(
				"[data-second]",
			)) {
				if (Number(element.dataset.second) <= now - SPAN - 2) element.remove();
			}
			for (const [index, second] of recent.entries()) {
				const fresh = !plot.querySelector(`[data-second="${second}"]`);
				const dot = dotAt(plot, second);
				const value = offsets[index] / scale;
				dot.toggleAttribute("data-stray", Math.abs(value) > 1);
				dot.style.top = `${mid - Math.max(-1, Math.min(1, value)) * half}px`;
				if (fresh) dot.style.left = `${(second - anchor) * stepPx}px`;
				dot.toggleAttribute("data-newest", second === now);
			}
		};
		lock();
		place(Math.floor(kepler() / 1000));
		const stopTimer = onSecond(
			place,
			(n) => 12 + Math.round(noise(n + 991) * 28),
		);
		const stopFollow = follower(
			side,
			plot,
			() => (lessMotion() ? 0 : -stepPx / 1000) * rateOf(glide),
		);
		return () => {
			stopTimer();
			stopFollow();
			glide?.cancel();
			plot.replaceChildren();
			plot.style.transform = "";
		};
	}

	runButton(
		article,
		() => {
			origin = Math.floor(Date.now() / 1000) * 1000 - labNow() + 300;
			for (const side of sides) {
				check(side.parentElement!, "Following a dot…", null);
				stops.push(
					side.dataset.k4 === "before"
						? before(side.parentElement!)
						: after(side.parentElement!),
				);
			}
		},
		() => {
			while (stops.length) stops.pop()!();
			for (const side of sides) {
				check(side.parentElement!, "Stopped.");
				side
					.parentElement!.querySelector("[data-k4-error]")!
					.setAttribute("points", "");
			}
		},
	);
}

const rateOf = (animation?: Animation) => animation?.playbackRate ?? 1;

// ------------------------------------------------------------- K5, the dock

function dock(article: HTMLElement) {
	type Mode = "face" | "docking" | "docked" | "undocking";
	const toward = (from: DOMRect, to: DOMRect) =>
		`translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width})`;

	const pages = Array.from(
		article.querySelectorAll<HTMLElement>("[data-k5]"),
	).map((page) => {
		const dial = page.querySelector<HTMLElement>("[data-k5-dial]")!;
		const slot = page.querySelector<HTMLElement>("[data-k5-slot]")!;
		const hand = page.querySelector<HTMLElement>("[data-k5-hand]")!;
		const side = page.parentElement!;
		const before = page.dataset.k5 === "before";
		let mode: Mode = "face";
		let flight: Animation | null = null;
		let hold = 0;
		let busy = false;
		let landed = false;
		// The dial is measured in its own layout, together with its slot, and is
		// only ever drawn large and shrunk toward the slot.
		const docked = () => {
			const kept = dial.style.transform;
			dial.style.transform = "";
			const target = toward(
				dial.getBoundingClientRect(),
				slot.getBoundingClientRect(),
			);
			dial.style.transform = kept;
			return target;
		};

		function say() {
			if (mode === "docked") {
				check(
					side,
					before
						? "Rule 2 · breaks: it docked itself; nobody asked."
						: "Rule 2 · keeps: it docked because the console was chosen.",
					!before,
				);
			} else if (landed) {
				check(
					side,
					before
						? "The face, about to dock itself…"
						: "Rule 2 · keeps: the face stays until the console is chosen.",
					before ? null : true,
				);
			}
		}

		function land() {
			if (mode !== "docking" && mode !== "undocking") return;
			mode = mode === "docking" ? "docked" : "face";
			const current = flight;
			flight = null;
			if (current) {
				current.onfinish = null;
				current.cancel();
			}
			dial.style.transform = mode === "docked" ? docked() : "";
			say();
		}

		function move(open: boolean) {
			if (open === (mode === "docked" || mode === "docking")) return;
			clearTimeout(hold);
			mode = open ? "docking" : "undocking";
			const style = getComputedStyle(page);
			const duration = lessMotion()
				? 0
				: parseFloat(style.getPropertyValue("--kin-duration-navigate")) || 0;
			const easing =
				style
					.getPropertyValue("--kin-motion-navigate")
					.trim()
					.replace(/^[\d.]+m?s\s*/, "") || ease;
			if (!duration) return land();
			// Choosing again in flight turns the same animation back.
			if (flight) {
				flight.reverse();
				return;
			}
			const target = docked();
			dial.style.transform = "";
			flight = dial.animate(
				{ transform: open ? ["none", target] : [target, "none"] },
				{ duration, easing, fill: "forwards" },
			);
			flight.onfinish = land;
			follow();
		}

		// The old page held 1400ms once the hands had landed, while nobody was
		// on the dial, and then docked by itself.
		function waitThenDock() {
			clearTimeout(hold);
			if (!before || mode !== "face" || !landed || busy) return;
			hold = window.setTimeout(() => move(true), 1400);
		}
		const setBusy = (on: boolean) => {
			busy = on;
			if (on) clearTimeout(hold);
			else waitThenDock();
		};
		dial.addEventListener("pointerenter", () => setBusy(true));
		dial.addEventListener("pointerleave", () => setBusy(false));
		dial.addEventListener("focus", () => setBusy(true));
		dial.addEventListener("blur", () => setBusy(false));
		hand.addEventListener("transitionend", () => {
			landed = true;
			say();
			waitThenDock();
		});
		side
			.querySelector("[data-k5-open]")
			?.addEventListener("click", () => move(true));
		side
			.querySelector("[data-k5-return]")!
			.addEventListener("click", () => move(false));

		function visit() {
			clearTimeout(hold);
			flight?.cancel();
			flight = null;
			mode = "face";
			landed = false;
			dial.style.transform = "";
			// The hands land on the time from where they rest.
			hand.style.transition = "none";
			hand.style.setProperty("--k5-angle", "186deg");
			void getComputedStyle(hand).rotate;
			hand.style.transition = "";
			hand.style.setProperty(
				"--k5-angle",
				`${326 + Math.round(noise(Math.floor(Date.now() / 1000)) * 60)}deg`,
			);
			check(
				side,
				before
					? "The hands land; then the face waits to dock itself…"
					: "The hands land; the face stays.",
				null,
			);
			if (lessMotion()) {
				landed = true;
				say();
				waitThenDock();
			}
		}
		return { visit };
	});

	article.querySelector("[data-lab-visit]")!.addEventListener("click", () => {
		for (const page of pages) page.visit();
		follow();
	});
}

// ---------------------------------------------------------- K6, the entries

function entries(article: HTMLElement) {
	const pages = Array.from(article.querySelectorAll<HTMLElement>("[data-k6]"));
	const loaded = new Map<HTMLElement, number>();

	const seen = (element: Element, scroller: Element) => {
		const box = element.getBoundingClientRect();
		const frame = scroller.getBoundingClientRect();
		return (
			box.height > 0 &&
			box.bottom > Math.max(0, frame.top) &&
			box.top < Math.min(innerHeight, frame.bottom)
		);
	};

	const waiting = new Map<HTMLElement, () => void>();
	// Scroll events arrive before the frame that shows the new position is
	// painted, so an instrument jumped to starts its entry in the frame it first
	// appears in (Observatory's inview.ts).
	window.addEventListener(
		"scroll",
		() => {
			for (const [page, release] of [...waiting]) {
				if (seen(page.querySelector("[data-k6-instrument]")!, page)) release();
			}
		},
		{ capture: true, passive: true },
	);

	function load(page: HTMLElement) {
		const old = page.querySelector<HTMLElement>("[data-k6-instrument]")!;
		const instrument = old.cloneNode(true) as HTMLElement;
		instrument.removeAttribute("data-inview");
		page.scrollTop = 0;
		const after = page.dataset.k6 === "after";
		if (after && !seen(old, page)) {
			instrument.dataset.inview = "waiting";
			waiting.set(page, () => {
				waiting.delete(page);
				instrument.removeAttribute("data-inview");
				follow();
				report(page, instrument);
			});
		}
		instrument.dataset.k6Mounted = "";
		old.replaceWith(instrument);
		loaded.set(page, labNow());
		check(
			page.parentElement!,
			after
				? "Whole while it waits below; its entry begins when it is first seen."
				: "Its entry began at load, out of sight.",
			null,
		);
		follow();
	}

	function report(page: HTMLElement, instrument: HTMLElement) {
		const trace = instrument.querySelector<SVGPathElement>(".k6-trace")!;
		const frames: string[] = [];
		const line =
			page.parentElement!.querySelector<HTMLElement>("[data-k6-frames]")!;
		const sample = () => {
			frames.push(
				parseFloat(getComputedStyle(trace).strokeDashoffset || "0").toFixed(2),
			);
			if (frames.length < 8) requestAnimationFrame(sample);
			else {
				line.textContent = `Frames after the jump: ${frames.join(" ")}`;
				const first = Number(frames[0]);
				const kept =
					page.dataset.k6 === "after" ? first > 0.99 || lessMotion() : false;
				check(
					page.parentElement!,
					kept
						? "Rule 7 · keeps: its first frame was its start."
						: `Rule 7 · breaks: it was ${Math.round((1 - first) * 100)}% drawn in the first frame it was seen.`,
					kept,
				);
			}
		};
		requestAnimationFrame(sample);
	}

	article.querySelector("[data-lab-load]")!.addEventListener("click", () => {
		for (const page of pages) load(page);
	});
	article.querySelector("[data-lab-jump]")!.addEventListener("click", () => {
		for (const page of pages) {
			if (!loaded.has(page)) load(page);
			const instrument = page.querySelector<HTMLElement>(
				"[data-k6-instrument]",
			)!;
			if (page.dataset.k6 === "before") {
				page.scrollTop = instrument.offsetTop - 8;
				report(page, instrument);
			} else {
				page.scrollTop = instrument.offsetTop - 8;
				if (!waiting.has(page)) report(page, instrument);
			}
		}
	});
}

export function mountCorrections(container: HTMLElement) {
	const find = (name: string) =>
		container.querySelector<HTMLElement>(`[data-lab-correction="${name}"]`);
	const k1 = find("hand");
	if (k1) hand(k1);
	const k3 = find("lamps");
	if (k3) lamps(k3);
	const k4 = find("strip");
	if (k4) strip(k4);
	const k5 = find("dock");
	if (k5) dock(k5);
	const k6 = find("entries");
	if (k6) entries(k6);
}
