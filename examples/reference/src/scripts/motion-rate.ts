// The motion lab's speed and clock. Every animation on the page plays at the
// lab's rate, every timer waits in lab time, and a specimen that runs its own
// frames reads the lab clock, so a tenth of the speed slows everything
// together and nothing falls out of step.

let rate = 1;
let simulatedLess = false;
let base = performance.now();
let labBase = 0;
const listeners = new Set<() => void>();

/** Milliseconds of lab time: real time scaled by the lab's speed. */
export function labNow(): number {
	return labBase + (performance.now() - base) * rate;
}

export function getRate(): number {
	return rate;
}

export function setRate(next: number): void {
	labBase = labNow();
	base = performance.now();
	rate = next;
	applyRate();
	for (const listener of listeners) listener();
}

export function onChange(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

let systemLess: MediaQueryList | undefined;

/** Whether the system asks for less motion. The lab never overrides it. */
export function systemAsksLess(): boolean {
	return systemLess?.matches ?? false;
}

/** Less motion, asked for by the system or simulated by the lab. */
export function lessMotion(): boolean {
	return systemAsksLess() || simulatedLess;
}

export function setSimulatedLess(on: boolean): void {
	simulatedLess = on;
	for (const listener of listeners) listener();
}

/** Play every animation on the page at the lab's rate. */
export function applyRate(): void {
	for (const animation of document.getAnimations()) {
		if (animation.playbackRate === rate) continue;
		if (animation.playState === "running" && animation.startTime !== null) {
			animation.updatePlaybackRate(rate);
		} else {
			animation.playbackRate = rate;
		}
	}
}

// New animations take the rate in the frame they start; a sweep follows them
// while anything runs and stops when the page is still.
let sweeping = 0;
function sweep() {
	applyRate();
	const busy = document
		.getAnimations()
		.some(
			(animation) => animation.playState === "running" || animation.pending,
		);
	sweeping = busy ? requestAnimationFrame(sweep) : 0;
}

export function follow(): void {
	applyRate();
	if (!sweeping) sweeping = requestAnimationFrame(sweep);
}

/**
 * Install the lab's clock on the page: the corner key's engine and every
 * timer hear the lab's speed and its simulated less motion. Called once, by
 * the lab, before any specimen starts.
 */
export function install(): void {
	const nativeMatch = window.matchMedia.bind(window);
	systemLess = nativeMatch("(prefers-reduced-motion: reduce)");

	// Script that asks whether to move (the corner key's engine) hears the lab's
	// simulated preference as well as the system's.
	window.matchMedia = (query: string) => {
		const list = nativeMatch(query);
		if (!/prefers-reduced-motion:\s*reduce/.test(query)) return list;
		return new Proxy(list, {
			get(target, property) {
				if (property === "matches") return target.matches || simulatedLess;
				const value = Reflect.get(target, property, target);
				return typeof value === "function" ? value.bind(target) : value;
			},
		});
	};

	// Timers wait in lab time, so a sequence started by script keeps pace with
	// the animations it starts.
	const nativeTimeout = window.setTimeout.bind(window);
	window.setTimeout = ((
		handler: TimerHandler,
		timeout?: number,
		...rest: unknown[]
	) =>
		nativeTimeout(
			handler,
			(Number(timeout) || 0) / rate,
			...rest,
		)) as typeof window.setTimeout;

	document.addEventListener("transitionrun", follow, true);
	document.addEventListener("animationstart", follow, true);
}
