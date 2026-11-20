/**
 * The one pending confirmation. `ConfirmHost` renders it; `confirm()` asks
 * and resolves with the reader's answer. A new request answers the one before
 * it with `false`.
 */

class Pending {
	/**
	 * Raw, not deep, so the request on screen is the very object `confirm()`
	 * made and identity holds.
	 * @type {(import("./types.js").ConfirmRequest & { answer: (value: boolean) => void }) | null}
	 */
	request = $state.raw(null);
}

export const pending = new Pending();

/**
 * Ask the reader to confirm an action.
 * @param {import("./types.js").ConfirmRequest} request
 * @returns {Promise<boolean>}
 */
export function confirm(request) {
	// A server render has no reader to ask, and a module's state there is
	// shared by every request it serves.
	if (typeof window === "undefined") return Promise.resolve(false);
	pending.request?.answer(false);
	return new Promise((resolve) => {
		const entry = {
			...request,
			/** @param {boolean} value */
			answer(value) {
				if (pending.request === entry) pending.request = null;
				resolve(value);
			},
		};
		pending.request = entry;
	});
}
