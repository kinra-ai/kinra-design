/**
 * The toasts on screen. `toast()` raises one and returns its id; `Toaster`
 * renders them, times them and lets them leave.
 */

/** @type {import("./toast.svelte.js").Toast[]} */
export const toasts = $state([]);

let next = 0;

/**
 * Raise a toast: a brief message about something that just happened.
 * @param {import("./toast.svelte.js").ToastRequest} request
 * @returns {number} its id, for `dismiss()`
 */
export function toast(request) {
	// A server render shares this module's state with every request it serves,
	// so a toast raised there would reach later readers.
	if (typeof window === "undefined") return 0;
	const id = ++next;
	const duration = request.duration ?? (request.tone === "error" ? 0 : 5000);
	toasts.push({ ...request, id, duration, leaving: false });
	return id;
}

/**
 * Let a toast leave; it fades out, then goes.
 * @param {number} id
 */
export function dismiss(id) {
	const entry = toasts.find((item) => item.id === id);
	if (entry) entry.leaving = true;
}

/**
 * Remove a toast at once. `Toaster` calls this when its exit has played.
 * @param {number} id
 */
export function remove(id) {
	const index = toasts.findIndex((item) => item.id === id);
	if (index >= 0) toasts.splice(index, 1);
}
