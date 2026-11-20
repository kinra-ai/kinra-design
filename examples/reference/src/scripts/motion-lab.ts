// The motion lab (/motion/): its controls, its live readings of the motion
// tokens, and every specimen. A specimen moves only when asked, by the term it
// shows, read from the element that moves, so a column's register and the
// lab's speed and less-motion controls reach it.
import {
	follow,
	getRate,
	lessMotion,
	onChange,
	setRate,
	install,
	setSimulatedLess,
	systemAsksLess,
} from "./motion-rate.ts";
import {
	KeyEngine,
	type Face,
} from "@kinra/web/registry/patterns/corner-key/corner-key.js";
import { mountCorrections } from "./motion-corrections.ts";

/** Start the lab on /motion/. */
export function startLab(): void {
	install();
	const lab = document.querySelector<HTMLElement>("[data-lab]")!;
	const status = document.querySelector<HTMLElement>("[data-lab-status]")!;
	const lessToggle = document.querySelector<HTMLInputElement>(
		"[data-lab-less-toggle]",
	)!;

	// ---------------------------------------------------------------- Tokens

	/** A duration as the browser or the doc writes it, in ms. */
	function ms(value: string): number {
		const text = value.trim();
		const number = parseFloat(text);
		if (!Number.isFinite(number)) return 0;
		return text.endsWith("ms") ? number : number * 1000;
	}

	// Curves by their four numbers, since a minifier may rewrite how they are
	// written (0.16 as .16).
	const curveNames: Record<string, string> = {
		"0.16,1,0.3,1": "out",
		"0.7,0,0.84,0": "in",
		"0.4,0,0.2,1": "standard",
		"0.2,0,0,1": "bloom",
		"0.4,0,0,1": "morph",
	};
	const curveName = (curve: string) => {
		if (curve.startsWith("cubic-bezier")) {
			const points = (curve.match(/-?[\d.]+/g) ?? []).map(Number).join(",");
			return curveNames[points] ?? curve;
		}
		if (curve.startsWith("steps")) return "steps";
		return curve;
	};

	/** A term's duration and curve where the element stands. */
	function term(element: Element, name: string) {
		const style = getComputedStyle(element);
		const duration = ms(style.getPropertyValue(`--kin-duration-${name}`));
		const pair = style.getPropertyValue(`--kin-motion-${name}`).trim();
		const easing = pair.replace(/^[\d.]+m?s\s*/, "") || "linear";
		return { ms: lessMotion() ? 0 : duration, easing };
	}

	function readings() {
		for (const reading of lab.querySelectorAll<HTMLElement>(
			"[data-lab-reading]",
		)) {
			const name = reading.dataset.labReading!;
			const style = getComputedStyle(reading);
			const duration = ms(style.getPropertyValue(`--kin-duration-${name}`));
			const pair = style.getPropertyValue(`--kin-motion-${name}`).trim();
			const curve = pair.replace(/^[\d.]+m?s\s*/, "").replace(/\s+/g, "");
			const time =
				duration === 0
					? "none"
					: duration >= 1000
						? `${duration / 1000}s`
						: `${duration}ms`;
			reading.textContent =
				name === "stagger"
					? duration === 0
						? time
						: `${time} step`
					: duration === 0 || !curve
						? time
						: `${time} · ${curveName(curve)}`;
		}
	}

	// ---------------------------------------------------------------- Controls

	function pressed(selector: string, active: (button: HTMLElement) => boolean) {
		for (const button of document.querySelectorAll<HTMLElement>(selector)) {
			button.setAttribute("aria-pressed", String(active(button)));
		}
	}

	let register = "both";

	function report() {
		const speed = getRate();
		const registerName =
			register === "both" ? "both registers" : `${register} only`;
		const less = systemAsksLess()
			? "less motion (system)"
			: lessMotion()
				? "less motion (simulated)"
				: "full motion";
		status.textContent = `${speed}× · ${registerName} · ${less}`;
		const params = new URLSearchParams(location.search);
		if (speed === 1) params.delete("speed");
		else params.set("speed", String(speed));
		if (register === "both") params.delete("register");
		else params.set("register", register);
		if (lessToggle.checked && !systemAsksLess()) params.set("less", "1");
		else params.delete("less");
		const query = params.toString();
		history.replaceState(
			null,
			"",
			`${location.pathname}${query ? `?${query}` : ""}${location.hash}`,
		);
	}

	function chooseSpeed(speed: number) {
		setRate(speed);
		pressed(
			"[data-lab-speed]",
			(button) => Number(button.dataset.labSpeed) === speed,
		);
	}

	function chooseRegister(choice: string) {
		register = choice;
		lab.dataset.labShow = choice;
		pressed(
			"[data-lab-register-choice]",
			(b) => b.dataset.labRegisterChoice === choice,
		);
	}

	// Less motion, simulated: the shipped reduced-motion rules, scoped to the lab,
	// so what it shows is what a reader who asks for less motion sees.
	let lessSheet: HTMLStyleElement | undefined;

	function scopedReducedRules(): string {
		const out: string[] = [];
		const visit = (rules: CSSRuleList, wrap: (css: string) => string) => {
			for (const rule of Array.from(rules)) {
				if (rule instanceof CSSImportRule && rule.styleSheet) {
					visit(rule.styleSheet.cssRules, wrap);
				} else if (rule instanceof CSSLayerBlockRule) {
					visit(rule.cssRules, (css) =>
						wrap(`@layer ${rule.name} {\n${css}\n}`),
					);
				} else if (rule instanceof CSSSupportsRule) {
					visit(rule.cssRules, (css) =>
						wrap(`@supports ${rule.conditionText} {\n${css}\n}`),
					);
				} else if (rule instanceof CSSMediaRule) {
					if (
						/prefers-reduced-motion\s*:\s*reduce/.test(rule.media.mediaText)
					) {
						const body = Array.from(rule.cssRules)
							.map((inner) => inner.cssText)
							.join("\n")
							.replace(/:root\b/g, ":scope")
							.replace(/(^|[\s,(}])html(?![\w-])/g, "$1:scope");
						out.push(wrap(`@scope ([data-lab-less]) {\n${body}\n}`));
					} else if (!/prefers-reduced-motion/.test(rule.media.mediaText)) {
						visit(rule.cssRules, (css) =>
							wrap(`@media ${rule.media.mediaText} {\n${css}\n}`),
						);
					}
				}
			}
		};
		for (const sheet of Array.from(document.styleSheets)) {
			if (sheet.ownerNode === lessSheet) continue;
			try {
				visit(sheet.cssRules, (css) => css);
			} catch {
				// A sheet from another origin keeps its rules to itself.
			}
		}
		return out.join("\n");
	}

	function chooseLess(on: boolean) {
		lessSheet?.remove();
		lessSheet = undefined;
		if (on) {
			lessSheet = document.createElement("style");
			lessSheet.textContent = scopedReducedRules();
			document.head.append(lessSheet);
		}
		lab.toggleAttribute("data-lab-less", on);
		setSimulatedLess(on);
	}

	// ---------------------------------------------------------------- Curves

	/** A CSS cubic-bezier as a function of progress (Newton, then bisection). */
	function bezier(x1: number, y1: number, x2: number, y2: number) {
		const at = (a: number, b: number, t: number) =>
			((1 - 3 * b + 3 * a) * t + (3 * b - 6 * a)) * t * t + 3 * a * t;
		return {
			x: (t: number) => at(x1, x2, t),
			y: (t: number) => at(y1, y2, t),
		};
	}

	/** The share of its time a curve takes to cover a share of its distance. */
	function timeTo(points: number[], share: number) {
		const curve = bezier(points[0], points[1], points[2], points[3]);
		let low = 0;
		let high = 1;
		for (let index = 0; index < 50; index++) {
			const middle = (low + high) / 2;
			if (curve.y(middle) < share) low = middle;
			else high = middle;
		}
		return curve.x(high);
	}

	function curves() {
		for (const card of lab.querySelectorAll<HTMLElement>("[data-lab-curve]")) {
			const points = card.dataset.points!.split(",").map(Number);
			const shares = [0.5, 0.83, 0.95];
			const times = shares.map((share) => timeTo(points, share));
			const marks = card.querySelector("[data-lab-marks]")!;
			marks.innerHTML = shares
				.map((share, index) => {
					const x = (times[index] * 100).toFixed(2);
					const y = (100 - share * 100).toFixed(2);
					return `<path class="lab-curve__mark" d="M${x} 100V${y}H0" />`;
				})
				.join("");
			card.querySelector("[data-lab-facts]")!.textContent = shares
				.map(
					(share, index) =>
						`${Math.round(share * 100)}% at ${Math.round(times[index] * 100)}%`,
				)
				.join(" · ");
			const dot = card.querySelector<HTMLElement>("[data-lab-dot]")!;
			const plot = card.querySelector<HTMLElement>(".lab-curve__plot")!;
			const easing =
				card.dataset.labCurve === "linear"
					? "linear"
					: `cubic-bezier(${points.join(", ")})`;
			card
				.querySelector("[data-lab-play-curve]")!
				.addEventListener("click", () => {
					if (lessMotion()) return;
					const { width, height } = plot.getBoundingClientRect();
					// Time runs across at an even pace; the curve sets how far up the
					// change has come.
					dot.animate([{ translate: "0 0" }, { translate: `${width}px 0` }], {
						duration: 1000,
						easing: "linear",
					});
					dot.animate(
						[
							{ transform: "translateY(0)" },
							{ transform: `translateY(${-height}px)` },
						],
						{ duration: 1000, easing },
					);
					follow();
				});
		}
	}

	// ---------------------------------------------------------------- Specimens

	const specimens = new Map<string, HTMLElement>();
	for (const element of lab.querySelectorAll<HTMLElement>(
		"[data-lab-specimen]",
	)) {
		specimens.set(element.dataset.labSpecimen!, element);
	}

	function on(
		name: string,
		selector: string,
		run: (specimen: HTMLElement) => void,
	) {
		const specimen = specimens.get(name);
		if (!specimen) return;
		for (const control of specimen.querySelectorAll<HTMLElement>(selector)) {
			control.addEventListener("click", () => {
				run(specimen);
				follow();
			});
		}
	}

	const columns = (specimen: HTMLElement) =>
		Array.from(specimen.querySelectorAll<HTMLElement>(".lab-col"));

	/** Start a CSS animation over: drop it, let the style settle, put it back. */
	function restart(element: Element, attribute: string, value = "on") {
		element.setAttribute(attribute, "");
		void getComputedStyle(element).animationName;
		element.setAttribute(attribute, value);
	}

	const seeded = (() => {
		let state = 7;
		return () => {
			state = (state * 1664525 + 1013904223) % 4294967296;
			return state / 4294967296;
		};
	})();

	// C1 control: tone, a thumb and an arrow answering.
	on("control", "[data-lab-replay]", (specimen) => {
		const press = specimen.querySelector<HTMLElement>("[data-lab-press]")!;
		press.toggleAttribute("data-lab-on", true);
		setTimeout(() => press.removeAttribute("data-lab-on"), 700);
		const toggle =
			specimen.querySelector<HTMLInputElement>("[data-lab-switch]")!;
		toggle.checked = !toggle.checked;
		const details = specimen.querySelector<HTMLDetailsElement>(
			"[data-lab-disclosure]",
		)!;
		details.open = !details.open;
	});

	// C2 surface: the rows below a new one make room; the fill follows its work.
	let surfaceCount = 0;
	on("surface", "[data-lab-replay]", (specimen) => {
		const list = specimen.querySelector<HTMLElement>("[data-lab-rows]")!;
		const before = new Map(
			Array.from(list.children).map((row) => [
				row,
				row.getBoundingClientRect().top,
			]),
		);
		list.lastElementChild?.remove();
		const row = document.createElement("li");
		row.className = "lab-row";
		row.dataset.labNew = "";
		row.innerHTML = `Task ${++surfaceCount}<small>queued</small>`;
		for (const old of list.querySelectorAll("[data-lab-new]"))
			old.removeAttribute("data-lab-new");
		list.prepend(row);
		const { ms: duration, easing } = term(list, "surface");
		for (const [old, top] of before) {
			if (!old.isConnected) continue;
			const moved = top - old.getBoundingClientRect().top;
			if (!moved || !duration) continue;
			old.animate([{ translate: `0 ${moved}px` }, { translate: "0 0" }], {
				duration,
				easing,
			});
		}
		const meter = specimen.querySelector<HTMLElement>("[data-lab-meter]")!;
		meter.style.setProperty("--lab-value", (0.2 + seeded() * 0.75).toFixed(2));
	});

	// The corner key's own engine, for the terms it is the source of.
	const engines = new Map<string, KeyEngine>();
	function engine(id: string, face: Face) {
		let existing = engines.get(id);
		if (!existing) {
			const key = document.getElementById(id) as HTMLButtonElement;
			existing = new KeyEngine(key, face);
			engines.set(id, existing);
		}
		return existing;
	}

	// C3 bloom: the fill grows from the pinned corner when there is something to
	// send, and goes back into it when the draft empties.
	const bloomKey = engine("lab-key-bloom", "rest");
	on("bloom", "[data-lab-replay]", () => bloomKey.set("send"));
	on("bloom", "[data-lab-withdraw]", () => bloomKey.set("rest"));

	// C4 morph: one icon becomes another in one movement.
	const morphKey = engine("lab-key-morph", "send");
	const morphSpecimen = specimens.get("morph");
	for (const button of morphSpecimen?.querySelectorAll<HTMLElement>(
		"[data-lab-face]",
	) ?? []) {
		button.addEventListener("click", () => {
			morphKey.set(button.dataset.labFace as Face, { turn: false });
			follow();
		});
	}

	// Toasts: Design's own arrival and exit.
	function raiseToast(column: HTMLElement, title: string, leaveAfter?: number) {
		const region = column.querySelector<HTMLElement>("[data-lab-toasts]")!;
		const toast = document.createElement("div");
		toast.className = "kin-toast";
		toast.dataset.tone = "primary";
		toast.style.position = "static";
		toast.innerHTML = `<p class="kin-toast__title">${title}</p><p class="kin-toast__body">The board is saved.</p>`;
		region.append(toast);
		while (region.children.length > 2) region.firstElementChild?.remove();
		if (leaveAfter !== undefined) {
			setTimeout(() => {
				toast.dataset.leaving = "";
				toast.addEventListener("animationend", () => toast.remove(), {
					once: true,
				});
				follow();
			}, leaveAfter);
		}
		return toast;
	}

	// L1 layer: a dialog, a drawer and a toast arrive from where they live.
	on("layer", "[data-lab-replay]", (specimen) => {
		raiseToast(columns(specimen)[0], "Saved", 2600);
	});
	for (const opener of specimens
		.get("layer")
		?.querySelectorAll<HTMLElement>("[data-lab-open]") ?? []) {
		opener.addEventListener("click", () => {
			document
				.querySelector<HTMLDialogElement>(`#${opener.dataset.labOpen}`)!
				.showModal();
			follow();
		});
	}
	for (const closer of document.querySelectorAll<HTMLElement>(
		"[data-lab-close]",
	)) {
		closer.addEventListener("click", () => closer.closest("dialog")!.close());
	}

	// L3 exit: a toast arrives, then leaves the way it came, faster.
	on("exit", "[data-lab-replay]", (specimen) => {
		raiseToast(columns(specimen)[0], "Copied", 900);
	});

	// S1 settle: the hand and the bar travel; the figure changes at once.
	function settleTo(specimen: HTMLElement, value: number) {
		for (const column of columns(specimen)) {
			column
				.querySelector<HTMLElement>("[data-lab-hand]")!
				.style.setProperty(
					"--lab-angle",
					`${Math.round(value * 300 - 150)}deg`,
				);
			column
				.querySelector<HTMLElement>("[data-lab-meter]")!
				.style.setProperty("--lab-value", value.toFixed(2));
			column.querySelector("[data-lab-figure]")!.textContent =
				`${Math.round(value * 100)}%`;
		}
	}
	// Each new value lands well away from the last, so the change is seen.
	let settled = 0.3;
	on("settle", "[data-lab-replay]", (specimen) => {
		settled = 0.1 + ((settled - 0.1 + 0.3 + seeded() * 0.4) % 0.85);
		settleTo(specimen, settled);
	});
	on("settle", "[data-lab-twice]", (specimen) => {
		settled = 0.18;
		settleTo(specimen, 0.92);
		setTimeout(() => {
			settleTo(specimen, settled);
			follow();
		}, 260);
	});

	// S2 draw: the trace draws from its start; its band fades in with it.
	on("draw", "[data-lab-replay]", (specimen) => {
		for (const path of specimen.querySelectorAll("[data-lab-drawn]")) {
			restart(path, "data-lab-drawn");
		}
	});

	// S3 appear: a row rises in; a new choice's reading arrives afresh.
	let appearCount = 0;
	on("appear", "[data-lab-replay]", (specimen) => {
		appearCount++;
		for (const column of columns(specimen)) {
			const list = column.querySelector<HTMLElement>("[data-lab-rows]")!;
			list.lastElementChild?.remove();
			const row = document.createElement("li");
			row.className = "lab-row lab-appear";
			row.innerHTML = `Report ${appearCount}<small>done</small>`;
			list.prepend(row);
		}
	});
	const readingsText = [
		"The last hour: 12 readings, all within 2ms.",
		"The last day: 288 readings, two late.",
		"The last week: 2016 readings, the spread halved on Tuesday.",
	];
	let readingIndex = 0;
	on("appear", "[data-lab-choice]", (specimen) => {
		readingIndex = (readingIndex + 1) % readingsText.length;
		for (const line of specimen.querySelectorAll<HTMLElement>(
			"[data-lab-reading-line]",
		)) {
			line.textContent = readingsText[readingIndex];
			line.classList.remove("lab-appear");
			void getComputedStyle(line).animationName;
			line.classList.add("lab-appear");
		}
	});

	// S4 stagger: the marks wait for half the trace, then grow one step apart.
	on("stagger", "[data-lab-replay]", (specimen) => {
		for (const path of specimen.querySelectorAll("[data-lab-drawn]"))
			restart(path, "data-lab-drawn");
		for (const marks of specimen.querySelectorAll("[data-lab-marks]")) {
			marks.removeAttribute("data-lab-on");
			void getComputedStyle(marks).animationName;
			marks.setAttribute("data-lab-on", "");
		}
	});

	// P1 navigate: the bar holds still while the page slides the way the index
	// runs. A simulation of a view transition, at the term's timing.
	function navigate(specimen: HTMLElement, direction: 1 | -1) {
		for (const column of columns(specimen)) {
			const place = column.querySelector<HTMLElement>("[data-lab-place]")!;
			const rooms = Array.from(
				place.querySelectorAll<HTMLElement>("[data-lab-room]"),
			);
			const current = rooms.findIndex((room) => !room.hidden);
			const next = (current + direction + rooms.length) % rooms.length;
			const leaving = rooms[current];
			const arriving = rooms[next];
			for (const room of rooms)
				for (const animation of room.getAnimations()) animation.finish();
			const { ms: duration, easing } = term(place, "navigate");
			arriving.hidden = false;
			if (!duration) {
				leaving.hidden = true;
				continue;
			}
			const away = `${-3 * direction}rem 0`;
			const toward = `${3 * direction}rem 0`;
			leaving
				.animate(
					[
						{ opacity: 1, translate: "0 0" },
						{ opacity: 0, translate: away },
					],
					{
						duration,
						easing,
					},
				)
				.finished.then(() => {
					leaving.hidden = true;
				})
				.catch(() => {});
			arriving.animate(
				[
					{ opacity: 0, translate: toward },
					{ opacity: 1, translate: "0 0" },
				],
				{
					duration,
					easing,
				},
			);
		}
	}
	on("navigate", "[data-lab-replay]", (specimen) => navigate(specimen, 1));
	on("navigate", "[data-lab-back]", (specimen) => navigate(specimen, -1));

	// Work in flight: nothing runs until the work starts, and stops when it ends.
	type Work = {
		start(specimen: HTMLElement): void;
		end(specimen: HTMLElement): void;
	};
	const traceKey = engine("lab-key-trace", "rest");
	const closeKey = engine("lab-key-close", "rest");
	const caption = (specimen: HTMLElement, text: string) => {
		for (const line of specimen.querySelectorAll("[data-lab-work-caption]"))
			line.textContent = text;
	};
	const edge = (specimen: HTMLElement) =>
		specimen.querySelector<HTMLElement>(".kin-pattern-live-edge")!;
	const edgeCaption = (specimen: HTMLElement, text: string) => {
		specimen.querySelector("[data-lab-edge-caption]")!.textContent = text;
	};
	const closing = new Map<HTMLElement, number>();

	const work: Record<string, Work> = {
		trace: {
			start(specimen) {
				traceKey.set("working", { turn: true });
				caption(specimen, "Working");
				edge(specimen).dataset.edge = "agents";
				edge(specimen).dataset.sparks = "2";
				edgeCaption(specimen, "Two agents working");
			},
			end(specimen) {
				traceKey.set("rest", { turn: false });
				caption(specimen, "Idle");
				edge(specimen).dataset.edge = "ready";
				delete edge(specimen).dataset.sparks;
				edgeCaption(specimen, "Ready");
			},
		},
		sweep: {
			start(specimen) {
				specimen.querySelector("[data-lab-sweep]")!.innerHTML =
					'<span class="kin-skeleton" data-shape="heading"></span><span class="kin-skeleton" data-shape="text"></span><span class="kin-skeleton" data-shape="text"></span><progress class="kin-progress" aria-label="Loading the report"></progress>';
			},
			end(specimen) {
				specimen.querySelector("[data-lab-sweep]")!.innerHTML =
					'<p class="lab-caption">The report has loaded.</p>';
			},
		},
		pulse: {
			start(specimen) {
				const mark = specimen.querySelector<HTMLElement>(
					"[data-lab-status-mark]",
				)!;
				mark.dataset.state = "running";
				mark.textContent = "Running";
				specimen.querySelector("[data-lab-log]")!.setAttribute("data-live", "");
			},
			end(specimen) {
				const mark = specimen.querySelector<HTMLElement>(
					"[data-lab-status-mark]",
				)!;
				mark.dataset.state = "success";
				mark.textContent = "Done";
				specimen.querySelector("[data-lab-log]")!.removeAttribute("data-live");
			},
		},
		pass: {
			start(specimen) {
				specimen.querySelector("[data-lab-pass]")!.innerHTML =
					'<span class="kin-spinner" aria-hidden="true"></span><p class="lab-caption">Indexing</p>';
			},
			end(specimen) {
				specimen.querySelector("[data-lab-pass]")!.innerHTML =
					'<p class="lab-caption">Indexed.</p>';
			},
		},
		close: {
			start(specimen) {
				clearTimeout(closing.get(specimen));
				closeKey.set("working", { turn: true });
				caption(specimen, "Working");
				edge(specimen).dataset.edge = "working";
				edgeCaption(specimen, "Working");
			},
			end(specimen) {
				closeKey.set("rest", { turn: false });
				caption(specimen, "Idle");
				edgeCaption(specimen, "Complete");
				if (lessMotion()) {
					edge(specimen).dataset.edge = "ready";
					return;
				}
				// The closing state lasts exactly as long as its gather.
				edge(specimen).dataset.edge = "closing";
				closing.set(
					specimen,
					window.setTimeout(() => {
						edge(specimen).dataset.edge = "ready";
					}, 1100),
				);
			},
		},
	};

	for (const [name, behaviour] of Object.entries(work)) {
		const specimen = specimens.get(name);
		const button = specimen?.querySelector<HTMLElement>("[data-lab-work]");
		if (!specimen || !button) continue;
		const ends = specimen.querySelector("[data-lab-end]");
		button.addEventListener("click", () => {
			// Beside an End of its own, the button only starts the work.
			if (ends) {
				behaviour.start(specimen);
				follow();
				return;
			}
			const running = button.getAttribute("aria-pressed") === "true";
			button.setAttribute("aria-pressed", String(!running));
			button.textContent = running ? "Start the work" : "End the work";
			if (running) behaviour.end(specimen);
			else behaviour.start(specimen);
			follow();
		});
		ends?.addEventListener("click", () => {
			behaviour.end(specimen);
			follow();
		});
	}

	// ---------------------------------------------------------------- Start

	for (const button of document.querySelectorAll<HTMLElement>(
		"[data-lab-speed]",
	)) {
		button.addEventListener("click", () =>
			chooseSpeed(Number(button.dataset.labSpeed)),
		);
	}
	for (const button of document.querySelectorAll<HTMLElement>(
		"[data-lab-register-choice]",
	)) {
		button.addEventListener("click", () => {
			chooseRegister(button.dataset.labRegisterChoice!);
			report();
		});
	}
	lessToggle.addEventListener("change", () => chooseLess(lessToggle.checked));

	const params = new URLSearchParams(location.search);
	const speed = Number(params.get("speed"));
	chooseSpeed([1, 0.25, 0.1].includes(speed) ? speed : 1);
	chooseRegister(
		["productive", "expressive"].includes(params.get("register") ?? "")
			? params.get("register")!
			: "both",
	);
	if (systemAsksLess()) {
		lessToggle.checked = true;
		lessToggle.disabled = true;
		document.querySelector<HTMLElement>("[data-lab-os]")!.hidden = false;
	} else if (params.get("less") === "1") {
		lessToggle.checked = true;
		chooseLess(true);
	}

	onChange(() => {
		readings();
		report();
	});
	matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
		"change",
		() => {
			location.reload();
		},
	);

	curves();
	readings();
	report();
	mountCorrections(lab.querySelector<HTMLElement>("[data-lab-corrections]")!);
}
