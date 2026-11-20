export interface ShellState {
	/** Below the breakpoint: the sidebar is a drawer. */
	readonly narrow: boolean;
	/** The rail alone beside the page. The drawer ignores it and keeps it. */
	readonly folded: boolean;
	/** The drawer is open. */
	readonly open: boolean;
	/** Fold or unfold beside the page. */
	fold(folded: boolean): void;
	/**
	 * Open or close the drawer. Closing gives focus back to the drawer's
	 * control, or with `"page"` to the page, as following a link does.
	 */
	drawer(open: boolean, restore?: "menu" | "page"): void;
	/** Fold beside the page, or open and close the drawer, as the chord does. */
	toggle(): void;
	/** Measure the hairline again and give the page any focus it is owed. */
	settle(): void;
	/** The element the page scrolls in now: the page, or the document. */
	scroller(): Element | null;
}

export function shellState(): ShellState | undefined;
export function setShellState(context: ShellState): ShellState;
/** Whether the platform's fold chord is ⌘B rather than Ctrl+B. */
export function onMac(): boolean;
/** The fold chord's name, as the platform writes it. */
export function chordLabel(): string;
/** Whether a key press is the fold chord. */
export function isChord(event: KeyboardEvent): boolean;
