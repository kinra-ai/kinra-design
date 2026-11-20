import type { ConfirmRequest } from "./types.js";

/**
 * Ask the reader to confirm an action. Resolves `true` when they confirm and
 * `false` when they turn back, press Escape, or another request replaces it,
 * and at once on the server.
 * Mount one `ConfirmHost` to render it.
 */
export function confirm(request: ConfirmRequest): Promise<boolean>;

/** The request on screen; `ConfirmHost` reads it. */
export const pending: {
	request: (ConfirmRequest & { answer: (value: boolean) => void }) | null;
};
