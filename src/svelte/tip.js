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
	if (byFocus) {
		follow();
		return;
	}
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

/** @param {HTMLElement} target */
function inView(target) {
	const rect = target.getBoundingClientRect();
	return rect.bottom > 0 && rect.top < innerHeight;
}

/**
 * A tip that came with the keyboard's focus follows its control as the page
 * scrolls, as it does while focus scrolls the control into view: out of view
 * it waits, and back in view it shows again.
 */
function follow() {
	if (!owner || !chip) return;
	if (!inView(owner)) {
		if (chip.matches(":popover-open")) chip.hidePopover();
		return;
	}
	try {
		if (!chip.matches(":popover-open")) chip.showPopover();
	} catch {
		return;
	}
	stand(chip, owner);
}

/** @param {Event} event */
function away(event) {
	if (event.type === "scroll") {
		if (!owner) return;
		if (focused) {
			follow();
			return;
		}
	}
	if (event.type === "pointerdown") pressed = owner;
	hideTip(undefined, false);
}

/**
 * Escape puts a showing tip away and goes no further, so a dialog or drawer
 * behind it stays open: a tip is dismissed without moving focus (WCAG
 * 1.4.13). With no tip showing, Escape is left alone.
 * @param {KeyboardEvent} event
 */
function escape(event) {
	if (event.key !== "Escape" || !owner || !chip?.matches(":popover-open"))
		return;
	event.preventDefault();
	event.stopPropagation();
	hideTip(undefined, false);
}

const AWAY = /** @type {const} */ (["pointerdown", "scroll", "blur"]);

function listen() {
	for (const name of AWAY)
		addEventListener(name, away, { capture: true, passive: true });
	addEventListener("keydown", escape, { capture: true });
}

function forget() {
	for (const name of AWAY) removeEventListener(name, away, { capture: true });
	removeEventListener("keydown", escape, { capture: true });
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
 * @typedef {object} Record
 * @property {number} holds
 * @property {(text: string, hint: string) => void} update
 * @property {() => void} detach
 */

/**
 * One record per node. New words for the same node, such as Copy becoming
 * Copied, update it in place: Svelte attaches the new attachment and
 * detaches the old one in the same turn, in either order, and the record
 * outlives that, so the tip keeps showing and the node keeps its focus.
 * @type {WeakMap<HTMLElement, Record>}
 */
const records = new WeakMap();

/**
 * @param {string | null | undefined | false} text
 * @param {string | null | undefined | false} hint
 * @param {boolean} reach
 * @returns {Attachment<HTMLElement>}
 */
function attach(text, hint, reach) {
	return (node) => {
		if (!text) return;
		let record = records.get(node);
		if (record) {
			record.holds++;
			record.update(text, hint || "");
		} else {
			record = setup(node, text, hint || "", reach);
			records.set(node, record);
		}
		const mine = record;
		return () => {
			mine.holds--;
			queueMicrotask(() => {
				if (mine.holds > 0 || records.get(node) !== mine) return;
				records.delete(node);
				mine.detach();
			});
		};
	};
}

/**
 * @param {HTMLElement} node
 * @param {string} first
 * @param {string} firstHint
 * @param {boolean} reach
 * @returns {Record}
 */
function setup(node, first, firstHint, reach) {
	let words = first;
	let more = firstHint;
	if (attached++ === 0) listen();
	const plain = !node.closest(CONTROL);
	const reached = reach && plain && !node.hasAttribute("tabindex");
	if (reached) node.tabIndex = 0;

	/** @type {HTMLElement | null} */
	let said = null;
	const id = `kin-tip-${++serial}`;
	const description = () => {
		const named =
			node.getAttribute("aria-label") === words ||
			node.textContent?.trim() === words;
		return named
			? more
			: more
				? `${words.replace(/[.:]$/, "")}. ${more}`
				: words;
	};
	const say = () => {
		const text = node.matches(FOCUSABLE) ? description() : "";
		if (!text) {
			if (said) {
				undescribe(node, id);
				said.remove();
				said = null;
			}
			return;
		}
		if (!said) {
			said = document.createElement("span");
			said.id = id;
			home().append(said);
		}
		said.textContent = text;
		describe(node, id);
	};
	say();
	// A product that rewrites aria-describedby, as a field does when an error
	// arrives, keeps the tip's words in the description.
	const watch = new MutationObserver(() => {
		if (said && !said.isConnected) home().append(said);
		if (said) describe(node, id);
	});
	watch.observe(node, { attributeFilter: ["aria-describedby"] });

	/**
	 * @param {number} wait
	 * @param {boolean} [byFocus]
	 */
	const soon = (wait, byFocus = false) => {
		if (said) describe(node, id);
		clearTimeout(timer);
		waiting = node;
		const warm = owner || performance.now() - closedAt < WARM;
		timer = setTimeout(() => show(node, words, more, byFocus), warm ? 0 : wait);
	};
	/** @param {PointerEvent} event */
	const enter = (event) => {
		if (event.pointerType !== "touch") soon(REST);
	};
	/** @param {Event} event */
	const leave = (event) => {
		if (event instanceof PointerEvent && event.pointerType === "touch") return;
		hideTip(node);
	};
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
	return {
		holds: 1,
		update(text, hint) {
			if (text === words && hint === more) return;
			words = text;
			more = hint;
			say();
			// The showing tip takes its new words where it stands.
			if (owner === node) show(node, words, more, focused);
		},
		detach() {
			watch.disconnect();
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
		},
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
