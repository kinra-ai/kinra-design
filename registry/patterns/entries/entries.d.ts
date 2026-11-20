/**
 * Holds the CSS entries inside `element` until it is first seen, then lets
 * them play once from their start. Returns the cleanup.
 */
export function inview(element: Element): () => void;

/**
 * Runs `run` once, the first time `element` is seen: at once if it is on
 * screen now. Returns the cleanup, which cancels a run still waiting.
 */
export function firstSight(element: Element, run: () => void): () => void;

export interface FramesOptions {
	/** The longest step `dt` reports, in seconds. 0.1 by default. */
	maxDt?: number;
	/** Hears each start (true) and stop (false) of the loop. */
	running?: (on: boolean) => void;
}

/**
 * Calls `frame` with the frame's time and the seconds since the frame before
 * on each animation frame, while `element` is on screen and its page is
 * shown. Returns the cleanup.
 */
export function frames(
	element: Element,
	frame: (now: number, dt: number) => void,
	options?: FramesOptions,
): () => void;
