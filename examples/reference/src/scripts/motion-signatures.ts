// Signatures and context in the motion lab. A signature is timing that belongs
// to the thing itself (docs/motion.md, Signatures); the context specimens put
// the terms to work together in each register.
import { follow, labNow, lessMotion } from "./motion-rate.ts";

function runButton(
	button: HTMLButtonElement,
	start: () => void,
	stop: () => void,
) {
	const label = button.textContent!.trim();
	const stopLabel = label.replace(/^Start|^Show/, (word) =>
		word === "Show" ? "Hide" : "Stop",
	);
	button.addEventListener("click", () => {
		// The label says the state, so the state is not also pressed.
		const running = button.hasAttribute("data-running");
		button.toggleAttribute("data-running", !running);
		button.textContent = running ? label : stopLabel;
		if (running) stop();
		else start();
		follow();
	});
}

// ------------------------------------------------------- X1, the live edge

function edge(article: HTMLElement) {
	const edges = Array.from(
		article.querySelectorAll<HTMLElement>("[data-lab-edge-state]"),
	);
	runButton(
		article.querySelector<HTMLButtonElement>("[data-lab-run]")!,
		() => {
			for (const each of edges) each.dataset.edge = each.dataset.labEdgeState!;
		},
		() => {
			for (const each of edges) each.dataset.edge = "ready";
		},
	);
}

// ------------------------------------------------------ X2, the escapement

/**
 * Observatory's beat: in each second the hand holds on the last mark, swings
 * to the next and 0.6° past it in 60ms, falls back to it by 100ms, and holds.
 * signature: the escapement's own gait, struck on the clock's second.
 */
function beatKeyframes(): Keyframe[] {
	const frames: Keyframe[] = [];
	for (let second = 0; second < 60; second++) {
		frames.push({
			offset: second / 60,
			transform: `rotate(${(second - 1) * 6}deg)`,
			easing: "cubic-bezier(0.3, 0, 0.25, 1)",
		});
		frames.push({
			offset: (second + 0.06) / 60,
			transform: `rotate(${second * 6 + 0.6}deg)`,
			easing: "ease-in-out",
		});
		frames.push({
			offset: (second + 0.1) / 60,
			transform: `rotate(${second * 6}deg)`,
			easing: "linear",
		});
	}
	frames.push({ offset: 1, transform: `rotate(${59 * 6}deg)` });
	return frames;
}

function escapement(article: HTMLElement) {
	const hand = article.querySelector<HTMLElement>("[data-x2-hand]")!;
	const caption = article.querySelector<HTMLElement>("[data-x2-caption]")!;
	const gait = article.querySelector<HTMLButtonElement>("[data-lab-gait]")!;
	let turn: Animation | undefined;
	let pending = 0;
	let running = false;
	const locked = () => gait.getAttribute("aria-pressed") === "true";
	const set = () => {
		turn?.cancel();
		if (!running) return;
		const beat = locked() && !lessMotion();
		turn = hand.animate(
			beat
				? beatKeyframes()
				: [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
			{
				duration: 60000,
				iterations: Infinity,
				easing: beat ? "linear" : lessMotion() ? "steps(60)" : "linear",
			},
		);
		turn.currentTime = labNow() % 60000;
		caption.textContent = lessMotion()
			? "Stepping once a second, with less motion."
			: beat
				? "Beating dead seconds: locked to the GPS pulse."
				: "Sweeping: coasting since the last pulse.";
		follow();
	};
	runButton(
		article.querySelector<HTMLButtonElement>("[data-lab-run]")!,
		() => {
			running = true;
			set();
		},
		() => {
			running = false;
			clearTimeout(pending);
			turn?.cancel();
			caption.textContent = "Stopped.";
		},
	);
	gait.addEventListener("click", () => {
		const next = !locked();
		gait.setAttribute("aria-pressed", String(next));
		// A change of gait waits until just after a second, and keeps the phase.
		clearTimeout(pending);
		pending = window.setTimeout(set, 1000 - (labNow() % 1000) + 120);
	});
}

// ------------------------------------------------------------ X3, playback

function playback(article: HTMLElement) {
	const ops: number[][] = JSON.parse(
		article.querySelector("[data-x3-ops]")!.textContent!,
	);
	const tool = article.querySelector<SVGCircleElement>("[data-x3-tool]")!;
	const caption = article.querySelector<HTMLElement>("[data-x3-caption]")!;
	const line = article.querySelector<HTMLElement>("[data-lab-check]")!;
	const play = article.querySelector<HTMLButtonElement>("[data-lab-play]")!;
	const lengths = ops
		.slice(1)
		.map((point, index) =>
			Math.hypot(point[0] - ops[index][0], point[1] - ops[index][1]),
		);
	const total = lengths.reduce((sum, length) => sum + length, 0);
	// Relay 0070: a program plays in ten to forty seconds, six plus three a span.
	const playMs = 1000 * Math.min(40, Math.max(10, 6 + 3 * (ops.length - 1)));
	let progress = 0;
	let playing = false;
	let last = 0;
	let frame = 0;
	let hop = 0;
	let drawn = 0;
	let late = 0;

	const place = (share: number) => {
		let distance = share * total;
		let index = 0;
		while (index < lengths.length - 1 && distance > lengths[index]) {
			distance -= lengths[index];
			index++;
		}
		const t = Math.min(1, distance / lengths[index]);
		const [x1, y1] = ops[index];
		const [x2, y2] = ops[index + 1];
		tool.setAttribute("cx", String(x1 + (x2 - x1) * t));
		tool.setAttribute("cy", String(y1 + (y2 - y1) * t));
		const reached =
			share >= 1
				? ops.length
				: distance >= lengths[index] - 1e-9
					? index + 2
					: index + 1;
		caption.textContent = `Operation ${reached} of ${ops.length}`;
		if (!playing) late++;
		drawn++;
	};
	const stop = (why: string) => {
		if (!playing) return;
		playing = false;
		cancelAnimationFrame(frame);
		clearTimeout(hop);
		play.removeAttribute("data-running");
		play.textContent = "Play";
		late = 0;
		line.textContent = `${why}; ${drawn} frames drawn while playing.`;
		// Nothing is drawn after it stops: checked a second later.
		window.setTimeout(() => {
			if (!playing) {
				line.textContent = `${why}. Rule 9 · keeps: ${late} frames drawn since it stopped.`;
				line.dataset.kept = String(late === 0);
			}
		}, 1000);
	};
	const step = () => {
		const now = labNow();
		progress = Math.min(1, progress + (now - last) / playMs);
		last = now;
		place(progress);
		if (progress >= 1) return stop("Stopped at the program's end");
		frame = requestAnimationFrame(step);
	};
	const start = () => {
		if (progress >= 1) progress = 0;
		playing = true;
		drawn = 0;
		play.toggleAttribute("data-running", true);
		play.textContent = "Pause";
		line.textContent = "Playing.";
		delete line.dataset.kept;
		if (lessMotion()) {
			// An operation at a time: the first after 600ms, then every 900ms.
			// The share of the path at each operation, so a hop lands on it.
			const shares = lengths.reduce(
				(at, length) => [...at, at.at(-1)! + length / total],
				[0],
			);
			const next = () => {
				const index = shares.findIndex((share) => share > progress + 1e-9);
				progress = index === -1 ? 1 : shares[index];
				place(progress);
				if (progress >= 1) return stop("Stopped at the program's end");
				hop = window.setTimeout(next, 900);
			};
			hop = window.setTimeout(next, 600);
			return;
		}
		last = labNow();
		frame = requestAnimationFrame(step);
	};
	play.addEventListener("click", () => (playing ? stop("Paused") : start()));
	new IntersectionObserver((entries) => {
		if (!entries.some((entry) => entry.isIntersecting))
			stop("Stopped off screen");
	}).observe(tool.ownerSVGElement!);
	document.addEventListener("visibilitychange", () => {
		if (document.hidden) stop("Stopped in a hidden tab");
	});
}

export function mountSignatures(container: HTMLElement) {
	const find = (name: string) =>
		container.querySelector<HTMLElement>(`[data-lab-signature="${name}"]`);
	const x1 = find("edge");
	if (x1) edge(x1);
	const x2 = find("escapement");
	if (x2) escapement(x2);
	const x3 = find("playback");
	if (x3) playback(x3);
}

// ----------------------------------------------------------------- Context

function toast(region: HTMLElement, title: string) {
	const element = document.createElement("div");
	element.className = "kin-toast";
	element.dataset.tone = "success";
	element.style.position = "static";
	element.innerHTML = `<p class="kin-toast__title">${title}</p><p class="kin-toast__body">Every row was read.</p>`;
	region.append(element);
	while (region.children.length > 2) region.firstElementChild?.remove();
	window.setTimeout(() => {
		element.dataset.leaving = "";
		element.addEventListener("animationend", () => element.remove(), {
			once: true,
		});
		follow();
	}, 2600);
}

function productive(article: HTMLElement) {
	const runs = article.querySelector<HTMLElement>("[data-x4-runs]")!;
	const toasts = article.querySelector<HTMLElement>("[data-x4-toasts]")!;
	const figure = article.querySelector<HTMLElement>("[data-x4-figure]")!;
	let count = 0;
	article.querySelector("[data-x4-start]")!.addEventListener("click", () => {
		count++;
		const run = runs.firstElementChild!.cloneNode(true) as HTMLElement;
		run.classList.add("lab-appear");
		run.querySelector(".kin-list__title")!.textContent = `Import ${count}`;
		run.querySelector(".kin-list__meta")!.textContent = "Running";
		run.querySelector<HTMLElement>(".kin-pattern-live-edge")!.dataset.edge =
			"working";
		runs.prepend(run);
		while (runs.children.length > 4) runs.lastElementChild?.remove();
		follow();
	});
	article.querySelector("[data-x4-finish]")!.addEventListener("click", () => {
		const run = Array.from(
			runs.querySelectorAll<HTMLElement>(".kin-pattern-live-edge"),
		).find((each) => each.dataset.edge === "working");
		if (!run) return;
		const row = run.closest("li")!;
		row.querySelector(".kin-list__meta")!.textContent = "Done";
		if (lessMotion()) run.dataset.edge = "ready";
		else {
			// The closing state lasts exactly as long as the edge's gather.
			run.dataset.edge = "closing";
			window.setTimeout(() => {
				run.dataset.edge = "ready";
			}, 1100);
		}
		toast(
			toasts,
			`${row.querySelector(".kin-list__title")!.textContent} finished`,
		);
		follow();
	});
	article.querySelector("[data-x4-sample]")!.addEventListener("click", () => {
		// A productive sample lands at once.
		figure.textContent = `${20 + Math.round(Math.random() * 70)}%`;
	});
}

function expressive(article: HTMLElement) {
	const hand = article.querySelector<HTMLElement>("[data-x5-hand]")!;
	const figure = article.querySelector<HTMLElement>("[data-x5-figure]")!;
	const line = article.querySelector<HTMLElement>("[data-x5-line]")!;
	article.querySelector("[data-x5-sight]")!.addEventListener("click", () => {
		for (const path of article.querySelectorAll("[data-lab-drawn]")) {
			path.setAttribute("data-lab-drawn", "");
			void getComputedStyle(path).animationName;
			path.setAttribute("data-lab-drawn", "on");
		}
		const marks = article.querySelector<HTMLElement>("[data-x5-marks]")!;
		marks.removeAttribute("data-lab-on");
		void getComputedStyle(marks).animationName;
		marks.setAttribute("data-lab-on", "");
		follow();
	});
	let reading = 12.4;
	article.querySelector("[data-x5-reading]")!.addEventListener("click", () => {
		reading = Math.round(((reading + 7 + Math.random() * 30) % 60) * 10) / 10;
		// The figure changes at once; the needle settles; the words arrive afresh.
		figure.textContent = `${reading} ns`;
		hand.style.setProperty(
			"--lab-angle",
			`${Math.round((reading / 60) * 300 - 150)}deg`,
		);
		line.textContent = `Kepler leads the pulse by ${reading} ns.`;
		line.classList.remove("lab-appear");
		void getComputedStyle(line).animationName;
		line.classList.add("lab-appear");
		follow();
	});
}

export function mountContext(container: HTMLElement) {
	const x4 = container.querySelector<HTMLElement>(
		'[data-lab-context="productive"]',
	);
	if (x4) productive(x4);
	const x5 = container.querySelector<HTMLElement>(
		'[data-lab-context="expressive"]',
	);
	if (x5) expressive(x5);
}
