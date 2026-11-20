// A tip says in a few plain words what a thing is or does, under the pointer
// and the keyboard, in the catalog's `.kin-tooltip`.
//
// One tip shows at a time, in one chip that every tip shares, created on
// first use. It stands in the top layer beside the thing it explains, above
// it where there is room and below it otherwise, so a drawer, a dialog or a
// clipped table never covers it. It waits a moment before showing, so a
// pointer crossing the page raises nothing; while one shows, or has just
// gone, the next follows at once. It never takes the pointer. Leaving, a
// press, a scroll, a change of focus and Escape put it away, though a tip
// that came with the keyboard's focus follows its target as the page scrolls
// it into view. None of them is claimed, so Escape still reaches the page
// and closes a drawer. A control
// carries its tip as its description, for assistive technology; the tip
// never names it.
//
// A touch screen does not hover. A tap on words or a mark that does nothing
// else shows its tip, and the next tap puts it away; a tip on a control stays
// out of touch's reach, since the tap is the control's. So a tip only adds to
// what the page says. Where a mark's tip does carry words found nowhere else,
// attach it with `told`: the mark then takes the keyboard's focus too.
//
//   <button {@attach tip("Sort by this column")}>
//   <time {@attach tip(date(at))}>
//   <span class="kin-status" {@attach told("Why this part reads as it does")}>

/** @import { Attachment } from "svelte/attachments" */
import { place } from "./placement.js";

/** How long the pointer rests before a tip shows, in milliseconds. */
const REST = 450;
/** How long a tip that has gone keeps the next one warm. */
const WARM = 350;
/** The gap between a tip and its target, and the least it keeps from the window's edges. */
const GAP = 6;
const GUTTER = 8;

/**
 * What takes a press or the keyboard's focus for itself. A region that only
 * script focuses (`tabindex="-1"`, such as the page's main area) is not one.
 */
const CONTROL =
	'a[href], button, input, select, textarea, summary, label, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])';
/** What can take focus, and so is read with a description. */
const FOCUSABLE =
	"a[href], button, input, select, textarea, summary, [tabindex]";

/** @type {HTMLElement | null} */
let chip = null;
/** @type {HTMLElement | null} */
let descriptions = null;
/** The node whose tip shows, and the one whose tip is about to. */
/** @type {HTMLElement | null} */
let owner = null;
/** @type {HTMLElement | null} */
let waiting = null;
/** The showing tip came with the keyboard's focus, which a scroll keeps. */
let focused = false;
/** The node whose tip a press put away, so a tap on it again does not show it. */
/** @type {HTMLElement | null} */
let pressed = null;
/** @type {ReturnType<typeof setTimeout> | undefined} */
let timer;
let closedAt = -Infinity;
let attached = 0;
let serial = 0;

function element() {
	if (chip?.isConnected) return chip;
	chip = document.createElement("div");
	chip.className = "kin-tooltip";
	chip.setAttribute("role", "tooltip");
	chip.setAttribute("popover", "manual");
	// Its words reach assistive technology as the target's description.
	chip.setAttribute("aria-hidden", "true");
	document.body.append(chip);
	return chip;
}

/** The hidden home of every tip's description, which `aria-describedby` reads. */
function home() {
	if (descriptions?.isConnected) return descriptions;
	descriptions = document.createElement("div");
	descriptions.hidden = true;
	document.body.append(descriptions);
	return descriptions;
}

/**
 * @param {HTMLElement} tip
 * @param {HTMLElement} target
 */
function stand(tip, target) {
	const { side } = place(tip, target, {
		side: "above",
		align: "center",
		gap: GAP,
		gutter: GUTTER,
	});
	tip.dataset.side = side;
}

/**
 * @param {HTMLElement} target
 * @param {string} text
 * @param {string} hint
 * @param {boolean} byFocus
 */
function show(target, text, hint, byFocus) {
	waiting = null;
	const rect = target.getBoundingClientRect();
	if (!target.isConnected || (!rect.width && !rect.height)) return;
	// A control whose own popover shows drops its tip, which would repeat it.
	if (target.getAttribute("aria-expanded") === "true") return;
	const tip = element();
	tip.textContent = text;
	if (hint) {
		const more = document.createElement("span");
		more.className = "kin-tooltip__hint";
		more.textContent = hint;
		tip.append(more);
	}
	owner = target;
	focused = byFocus;
	try {
		if (!tip.matches(":popover-open")) tip.showPopover();
	} catch {
		// A browser without popovers keeps the page's own words.
		owner = null;
		return;
	}
	stand(tip, target);
}

/**
 * Puts the showing tip away; given a node, only that node's tip, shown or
 * waiting. Moving on keeps the next tip warm; a press, a scroll or Escape
 * does not, so checking a column of boxes raises nothing.
 * @param {HTMLElement} [target]
 * @param {boolean} [warmNext]
 */
export function hideTip(target, warmNext = true) {
	if (!target || waiting === target) {
		clearTimeout(timer);
		waiting = null;
	}
	if (!owner || (target && owner !== target)) return;
	owner = null;
	closedAt = warmNext ? performance.now() : -Infinity;
	if (chip?.matches(":popover-open")) chip.hidePopover();
}

/** @param {Event} event */
function away(event) {
	if (event instanceof KeyboardEvent && event.key !== "Escape") return;
	if (event.type === "scroll") {
		// A scroll moves a showing tip's target from under the pointer; one
		// still waiting shows where its target lands. The keyboard's focus
		// stays as the page scrolls it into view, so its tip goes along.
		if (!owner) return;
		if (focused && chip) {
			const rect = owner.getBoundingClientRect();
			if (rect.bottom > 0 && rect.top < innerHeight) {
				stand(chip, owner);
				return;
			}
		}
	}
	if (event.type === "pointerdown") pressed = owner;
	hideTip(undefined, false);
}

const AWAY = /** @type {const} */ ([
	"pointerdown",
	"keydown",
	"scroll",
	"blur",
]);

function listen() {
	// None is claimed, so each still does its own work.
	for (const name of AWAY)
		addEventListener(name, away, { capture: true, passive: true });
}

function forget() {
	for (const name of AWAY) removeEventListener(name, away, { capture: true });
	clearTimeout(timer);
	chip?.remove();
	descriptions?.remove();
	chip = descriptions = owner = waiting = pressed = null;
	focused = false;
	closedAt = -Infinity;
}

/**
 * @param {HTMLElement} node
 * @param {string} id
 */
function describe(node, id) {
	const ids = (node.getAttribute("aria-describedby") ?? "")
		.split(/\s+/)
		.filter(Boolean);
	if (!ids.includes(id))
		node.setAttribute("aria-describedby", [...ids, id].join(" "));
}

/**
 * @param {HTMLElement} node
 * @param {string} id
 */
function undescribe(node, id) {
	const ids = (node.getAttribute("aria-describedby") ?? "")
		.split(/\s+/)
		.filter((each) => each && each !== id);
	if (ids.length) node.setAttribute("aria-describedby", ids.join(" "));
	else node.removeAttribute("aria-describedby");
}

/**
 * @param {string | null | undefined | false} text
 * @param {string | null | undefined | false} hint
 * @param {boolean} reach
 * @returns {Attachment<HTMLElement>}
 */
function attach(text, hint, reach) {
	return (node) => {
		if (!text) return;
		const words = text;
		const more = hint || "";
		if (attached++ === 0) listen();
		// Words or a mark that is no control, and inside none: a tap is free
		// to show the tip, and `told` may give it the keyboard's focus.
		const plain = !node.closest(CONTROL);
		const reached = reach && plain && !node.hasAttribute("tabindex");
		if (reached) node.tabIndex = 0;

		// A control describes itself by its tip. When its name already says
		// the tip's words, only the hint is left to add.
		const named =
			node.getAttribute("aria-label") === words ||
			node.textContent?.trim() === words;
		const description = named
			? more
			: more
				? `${words.replace(/[.:]$/, "")}. ${more}`
				: words;
		/** @type {HTMLElement | null} */
		let said = null;
		const id = `kin-tip-${++serial}`;
		if (description && node.matches(FOCUSABLE)) {
			said = document.createElement("span");
			said.id = id;
			said.textContent = description;
			home().append(said);
			describe(node, id);
		}
		// The product may write its own `aria-describedby` again; the tip's
		// words return before anyone reads them.
		const keep = () => {
			if (said) describe(node, id);
		};

		/**
		 * @param {number} wait
		 * @param {boolean} [byFocus]
		 */
		const soon = (wait, byFocus = false) => {
			keep();
			clearTimeout(timer);
			waiting = node;
			const warm = owner || performance.now() - closedAt < WARM;
			timer = setTimeout(
				() => show(node, words, more, byFocus),
				warm ? 0 : wait,
			);
		};
		/** @param {PointerEvent} event */
		const enter = (event) => {
			if (event.pointerType !== "touch") soon(REST);
		};
		// A finger lifting leaves, as a pointer does; its tap's tip stays
		// until the next press anywhere.
		/** @param {Event} event */
		const leave = (event) => {
			if (event instanceof PointerEvent && event.pointerType === "touch")
				return;
			hideTip(node);
		};
		// A tap ends in a click, after the browser has moved focus for it and
		// the press has put tips away, so the tip shows on the click.
		let touched = false;
		/** @param {PointerEvent} event */
		const lift = (event) => {
			touched = event.pointerType === "touch";
		};
		const tap = () => {
			if (!touched) return;
			touched = false;
			const shown = pressed === node;
			pressed = null;
			if (!shown) soon(0);
		};
		const focus = () => {
			if (node.matches(":focus-visible")) soon(REST / 2, true);
		};
		node.addEventListener("pointerenter", enter);
		node.addEventListener("pointerleave", leave);
		node.addEventListener("focus", focus);
		node.addEventListener("blur", leave);
		if (plain) {
			node.addEventListener("pointerup", lift);
			node.addEventListener("click", tap);
		}
		return () => {
			node.removeEventListener("pointerenter", enter);
			node.removeEventListener("pointerleave", leave);
			node.removeEventListener("focus", focus);
			node.removeEventListener("blur", leave);
			node.removeEventListener("pointerup", lift);
			node.removeEventListener("click", tap);
			if (said) {
				undescribe(node, id);
				said.remove();
			}
			if (reached) node.removeAttribute("tabindex");
			hideTip(node, false);
			if (pressed === node) pressed = null;
			if (--attached === 0) forget();
		};
	};
}

/**
 * Shows `text`, and a quieter `hint` beneath it, when the pointer rests on
 * the node, the keyboard reaches it, or a finger taps it where a tap does
 * nothing else. Nothing to say attaches nothing.
 * @param {string | null | undefined | false} text
 * @param {string | null | undefined | false} [hint]
 * @returns {Attachment<HTMLElement>}
 */
export function tip(text, hint) {
	return attach(text, hint, false);
}

/**
 * A tip whose words are found nowhere else on the page, on a mark that is no
 * control: the mark also takes the keyboard's focus and carries the words as
 * its description, so they can be read without a mouse. Inside a link or a
 * button it is an ordinary tip, since focus stops at the control; say those
 * words on the page instead.
 * @param {string | null | undefined | false} text
 * @param {string | null | undefined | false} [hint]
 * @returns {Attachment<HTMLElement>}
 */
export function told(text, hint) {
	return attach(text, hint, true);
}
