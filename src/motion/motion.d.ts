/**
 * @kinra/web/motion reads the motion terms of docs/motion.md where an element
 * stands. Load @kinra/web/styles/tokens.css, alone or through the full
 * styles, before reading; nothing runs on import.
 */

/** A term with a duration and a curve. Stagger is a step: read it with stagger(). */
export type Term =
	| "control"
	| "surface"
	| "bloom"
	| "morph"
	| "layer"
	| "popover"
	| "exit"
	| "settle"
	| "draw"
	| "appear"
	| "navigate"
	| "trace"
	| "sweep"
	| "pulse"
	| "pass"
	| "close";

/** The loops of work in flight. */
export type Loop = "trace" | "sweep" | "pulse" | "pass";

/**
 * How much of a change is done at each moment of its time, both from 0 to 1.
 * Progress outside 0 to 1 holds the nearer end.
 */
export type Ease = (t: number) => number;

export interface Motion {
	/** The duration in milliseconds where the element stands; 0 with less motion. */
	ms: number;
	/** The curve as CSS writes it, for the Web Animations API. */
	easing: string;
	/** The same curve as a function of progress, for a tween. */
	ease: Ease;
}

/**
 * A term's duration and curve, read from the element it moves, so a
 * subtree's register holds. Throws, naming the token, when the stylesheet
 * is not loaded.
 */
export function motion(term: Term, element?: Element): Motion;

/** A loop's period in milliseconds; never 0, not even with less motion. */
export function period(loop: Loop, element?: Element): number;

/** The step between members arriving together, in milliseconds; 0 with less motion. */
export function stagger(element?: Element): number;

/** A CSS cubic-bezier() as a function of progress. */
export function bezier(x1: number, y1: number, x2: number, y2: number): Ease;

/**
 * A CSS timing function as a function of progress: linear, ease, ease-in,
 * ease-out, ease-in-out, step-start, step-end, cubic-bezier() or steps().
 */
export function easing(css: string): Ease;

/** Whether the reader asked for less motion. */
export function reduced(): boolean;

/** Calls `fn` whenever the preference for less motion changes. Returns the unsubscribe function. */
export function onReduced(fn: (reduced: boolean) => void): () => void;
