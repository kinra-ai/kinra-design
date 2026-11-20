/**
 * The one pending confirmation. `ConfirmHost` renders it; `confirm()` asks
 * and resolves with the reader's answer. A new request answers the one before
 * it with `false`.
 */

/** @type {{ request: (import("./types.js").ConfirmRequest & { answer: (value: boolean) => void }) | null }} */
export const pending = $state({ request: null });

/**
 * Ask the reader to confirm an action.
 * @param {import("./types.js").ConfirmRequest} request
 * @returns {Promise<boolean>}
 */
export function confirm(request) {
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
