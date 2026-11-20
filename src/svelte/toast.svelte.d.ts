import type { Snippet } from "svelte";
import type { Tone } from "./types.js";

export interface ToastRequest {
	title?: string;
	body?: string | Snippet;
	tone?: Tone;
	/** One thing the reader can do about it, such as View or Undo. */
	action?: { label: string; onselect: () => void };
	/**
	 * Milliseconds on screen while not pointed at or focused. 5000 by default;
	 * an error stays until dismissed. 0 keeps any toast until dismissed.
	 */
	duration?: number;
}

export interface Toast extends ToastRequest {
	readonly id: number;
	duration: number;
	leaving: boolean;
}

/** The toasts on screen, oldest first. */
export const toasts: Toast[];
/** Raise a toast. Mount one `Toaster` to render it. Returns its id, or 0 on the server, where nothing is raised. */
export function toast(request: ToastRequest): number;
/** Let a toast leave; it fades out, then goes. */
export function dismiss(id: number): void;
/** Remove a toast at once. */
export function remove(id: number): void;
