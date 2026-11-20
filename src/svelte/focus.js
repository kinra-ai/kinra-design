/** Elements that take focus from the keyboard. */
export const focusable = [
	"a[href]",
	"button:not([disabled])",
	"input:not([disabled]):not([type='hidden'])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	"[contenteditable]:not([contenteditable='false'])",
	"[tabindex]:not([tabindex='-1'])",
]
	.map((selector) => `${selector}:not([inert] *)`)
	.join(", ");

/**
 * Move focus without scrolling, unless the element has left the document or
 * now stands behind something inert.
 * @param {Element | null | undefined} element
 * @returns {boolean} whether focus moved
 */
export function restore(element) {
	if (!(element instanceof HTMLElement) && !(element instanceof SVGElement)) {
		return false;
	}
	if (!element.isConnected || element.closest("[inert]")) return false;
	element.focus({ preventScroll: true });
	return document.activeElement === element;
}
