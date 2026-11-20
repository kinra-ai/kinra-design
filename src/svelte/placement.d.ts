/** The least a placed layer keeps from the window's edges, in pixels (12). */
export const VIEWPORT_GUTTER: number;
/** How far a layer stands off its anchor, in pixels (6). */
export const ANCHOR_GAP: number;

/** The four edges, in viewport pixels. */
export interface Insets {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

/** A box in viewport pixels; a `DOMRect` is one. */
export interface Box {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

/** A point in viewport pixels, such as a pointer's `clientX` and `clientY`. */
export interface Point {
	x: number;
	y: number;
}

/** What a layer is placed beside: an element, a box, or a point. */
export type Anchor = Element | Box | Point;

export interface PlaceOptions {
	/** The side the layer prefers; it takes the other when only that has room. Below by default. */
	side?: "below" | "above" | undefined;
	/** The anchor's edge the layer lines up with, in the line's direction. Its inline start by default. */
	align?: "start" | "center" | "end" | undefined;
	/** Pixels between the anchor and the layer; `ANCHOR_GAP` by default. */
	gap?: number | undefined;
	/** Pixels kept from the window's edges; `VIEWPORT_GUTTER` by default. */
	gutter?: number | undefined;
	/** The device's insets, where the product reads its own; `insets()` by default. */
	insets?: Insets | undefined;
	/** The line's direction; read from the anchor element, else the layer, by default. */
	direction?: "ltr" | "rtl" | undefined;
}

/** Where `place` put the layer, and on which side of its anchor. */
export interface Placement {
	left: number;
	top: number;
	side: "below" | "above";
}

/** The safe-area insets now, in pixels; zero on the server. */
export function insets(): Insets;

/**
 * Places a shown, fixed `layer` beside `anchor` inside the viewport: sets its
 * `left` and `top` and returns them. Too tall for either side of an element
 * or box, it keeps to the roomier side with its `max-height` set to that
 * room, so it scrolls rather than covering its anchor; at a point it moves in.
 */
export function place(
	layer: HTMLElement,
	anchor: Anchor,
	options?: PlaceOptions,
): Placement;

/**
 * Places `layer` again on every scroll and resize, once a frame, until the
 * returned function is called. `onlost` runs instead when the anchor element
 * is gone or has left the viewport, or the anchor function answers null.
 */
export function follow(
	layer: HTMLElement,
	anchor: Anchor | (() => Anchor | null),
	options?: PlaceOptions & { onlost?: (() => void) | undefined },
): () => void;
