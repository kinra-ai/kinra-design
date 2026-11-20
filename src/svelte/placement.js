// Where a layer stands when script, not CSS, places it: a menu beneath its
// control or at the pointer, a tip above what it explains. The layer is
// `position: fixed` (a `[popover]` is, in the top layer), so every figure here
// is in viewport pixels, as `getBoundingClientRect` measures them.

/** The least a placed layer keeps from the window's edges, in pixels. */
export const VIEWPORT_GUTTER = 12;

/**
 * How far a layer stands off its anchor: near enough to read as attached,
 * far enough not to sit on its focus ring.
 */
export const ANCHOR_GAP = 6;

/** @typedef {{ top: number; right: number; bottom: number; left: number }} Insets */
/** @typedef {{ left: number; top: number; right: number; bottom: number }} Box */
/** @typedef {{ x: number; y: number }} Point */
/** @typedef {Element | Box | Point} Anchor */
/**
 * @typedef {object} PlaceOptions
 * @property {"below" | "above"} [side]
 * @property {"start" | "center" | "end"} [align]
 * @property {number} [gap]
 * @property {number} [gutter]
 * @property {Insets} [insets]
 * @property {"ltr" | "rtl"} [direction]
 */
/** @typedef {{ left: number; top: number; side: "below" | "above" }} Placement */

/** @type {Insets} */
const NONE = { top: 0, right: 0, bottom: 0, left: 0 };

/** @type {Insets | null} */
let glass = null;
let watching = false;

/**
 * What the safe-area insets resolve to now, in pixels. `env()` cannot be read
 * back from script, so a hidden probe takes all four as padding and its
 * computed style answers. The reading is kept until the viewport changes.
 * @returns {Insets}
 */
export function insets() {
	if (glass) return glass;
	if (typeof document === "undefined" || !document.body) return NONE;
	if (!watching) {
		watching = true;
		const forget = () => (glass = null);
		addEventListener("resize", forget);
		addEventListener("orientationchange", forget);
	}
	const probe = document.createElement("div");
	probe.style.cssText =
		"position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none;" +
		"padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)";
	document.body.append(probe);
	const style = getComputedStyle(probe);
	/** @param {string} edge */
	const read = (edge) =>
		parseFloat(style.getPropertyValue(`padding-${edge}`)) || 0;
	glass = {
		top: read("top"),
		right: read("right"),
		bottom: read("bottom"),
		left: read("left"),
	};
	probe.remove();
	return glass;
}

/**
 * The anchor as a box: an element's border box, or a point as a box with no
 * size.
 * @param {Anchor} anchor
 * @returns {Box}
 */
function box(anchor) {
	if (anchor instanceof Element) return anchor.getBoundingClientRect();
	if ("left" in anchor) return anchor;
	return { left: anchor.x, right: anchor.x, top: anchor.y, bottom: anchor.y };
}

/**
 * Places `layer` beside `anchor` and inside the viewport, and returns where.
 *
 * Vertically it stands on `side` (below by default), `gap` pixels off, and
 * takes the other side when its own lacks the room and the other has more.
 * Too tall for either, it keeps to the roomier side and its `max-height` is
 * set to that room, so it scrolls rather than covering its anchor.
 * Inline it lines up with the anchor's `align` edge (its inline start by
 * default, which is its right edge right to left), lining up with the other
 * edge when that would cross the window. Either way it keeps `gutter` pixels
 * from every edge, or the safe-area inset where the device asks for more. A
 * point anchors as a box with no size, so a menu opens from the pointer. The
 * layer must be shown, so it can be measured.
 *
 * @param {HTMLElement} layer
 * @param {Anchor} anchor
 * @param {PlaceOptions} [options]
 * @returns {Placement}
 */
export function place(layer, anchor, options = {}) {
	const {
		side = "below",
		align = "start",
		gap = ANCHOR_GAP,
		gutter = VIEWPORT_GUTTER,
	} = options;
	const edges = options.insets ?? insets();
	const rect = box(anchor);
	const point = !(anchor instanceof Element) && !("left" in anchor);
	// Measured at its own height, not one an earlier placement held it to,
	// and put back where it was scrolled: following the page re-places it on
	// every scroll, and the reader's place in a long menu stays.
	const scrolled = layer.scrollTop;
	layer.style.maxHeight = "";
	const width = layer.offsetWidth;
	const height = layer.offsetHeight;
	const view = document.documentElement;
	const near = {
		x: Math.max(gutter, edges.left),
		y: Math.max(gutter, edges.top),
	};
	const far = {
		x: view.clientWidth - Math.max(gutter, edges.right),
		y: view.clientHeight - Math.max(gutter, edges.bottom),
	};
	const from = anchor instanceof Element ? anchor : layer;
	const rtl = (options.direction ?? getComputedStyle(from).direction) === "rtl";

	// Inline: the anchor's start edge is its left one left to right.
	const start = rtl ? rect.right - width : rect.left;
	const end = rtl ? rect.left : rect.right - width;
	const fits = (/** @type {number} */ x) => x >= near.x && x + width <= far.x;
	let left =
		align === "center"
			? rect.left + (rect.right - rect.left) / 2 - width / 2
			: align === "end"
				? end
				: start;
	if (align !== "center" && !fits(left)) {
		const other = align === "end" ? start : end;
		if (fits(other)) left = other;
	}
	left = Math.max(near.x, Math.min(left, far.x - width));

	// Block: the preferred side, unless it lacks the room the other has.
	const room = {
		below: far.y - (rect.bottom + gap),
		above: rect.top - gap - near.y,
	};
	const other = side === "below" ? "above" : "below";
	/** @type {"below" | "above"} */
	const chosen = room[side] < height && room[other] > room[side] ? other : side;
	let size = height;
	if (!point && room[chosen] < height) {
		// Too tall for either side: it keeps to its anchor and scrolls, rather
		// than sliding over the control it belongs to. A point has nothing to
		// cover, so a menu at the pointer moves in instead.
		size = Math.max(0, Math.floor(room[chosen]));
		layer.style.maxHeight = `${size}px`;
	}
	let top = chosen === "below" ? rect.bottom + gap : rect.top - gap - size;
	top = Math.max(near.y, Math.min(top, far.y - size));

	layer.style.left = `${Math.round(left)}px`;
	layer.style.top = `${Math.round(top)}px`;
	layer.scrollTop = scrolled;
	return { left, top, side: chosen };
}

/**
 * Whether an element still stands in the viewport, with a box to anchor to.
 * @param {Element} element
 */
function visible(element) {
	if (!element.isConnected) return false;
	const rect = element.getBoundingClientRect();
	if (!rect.width && !rect.height) return false;
	return (
		rect.bottom > 0 &&
		rect.top < innerHeight &&
		rect.right > 0 &&
		rect.left < innerWidth
	);
}

/**
 * Places `layer` again whenever anything scrolls or the window resizes, once
 * a frame, until the returned function stops it. `anchor` may be a function
 * that answers where the anchor is now. When the anchor is gone, has no box,
 * or has left the viewport, `onlost` is called instead, so a menu can close
 * rather than hang at the window's edge, detached from its control.
 *
 * @param {HTMLElement} layer
 * @param {Anchor | (() => Anchor | null)} anchor
 * @param {PlaceOptions & { onlost?: () => void }} [options]
 * @returns {() => void}
 */
export function follow(layer, anchor, options = {}) {
	const { onlost, ...placing } = options;
	let frame = 0;
	/** @param {Event} event */
	const update = (event) => {
		// The layer's own scrolling moves nothing it is placed by.
		if (event.target instanceof Node && layer.contains(event.target)) return;
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			const where = typeof anchor === "function" ? anchor() : anchor;
			if (!where || (where instanceof Element && !visible(where))) {
				onlost?.();
				return;
			}
			place(layer, where, placing);
		});
	};
	addEventListener("scroll", update, { capture: true, passive: true });
	addEventListener("resize", update);
	return () => {
		cancelAnimationFrame(frame);
		removeEventListener("scroll", update, { capture: true });
		removeEventListener("resize", update);
	};
}
