export type Face =
	| "rest"
	| "send"
	| "sending"
	| "working"
	| "queue"
	| "shell"
	| "command"
	| "uploading"
	| "blocked"
	| "watching"
	| "waiting";

export const faceNames: Record<Face, string>;
export const pressable: Set<Face>;

/** Animates caller-owned markup. The caller owns labels and action state. */
export class KeyEngine {
	/**
	 * Measures the key, reading its motion terms from the tokens on it.
	 *
	 * @throws {Error} when Design's tokens are not loaded on the key.
	 */
	constructor(key: HTMLElement, face: Face, turn?: boolean);
	set(
		face: Face,
		how?: { instant?: boolean; force?: boolean; turn?: boolean },
	): void;
	expectSent(): void;
	/** Measures again and redraws the current face in place. */
	resize(): void;
	destroy(): void;
}
