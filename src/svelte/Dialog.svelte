<!--
@component
A `.kin-dialog` on a native modal `dialog`. `open` binds both ways. It
names itself by its title, describes itself by its description, takes focus
to the first control in its body (or its title, when the body holds none),
and gives focus back to whatever held it when it closes.

Escape, the close button and, with `light`, a press on the backdrop all ask
`canClose` first, and nothing closes while `busy`. With `onsubmit` the body
is a form; the footer snippet receives its id, for a submit button outside
it:

```svelte
<Dialog bind:open title="New session" onsubmit={start}>
	<Field label="Goal"><Input bind:value={goal} /></Field>
	{#snippet footer({ form, close })}
		<Button variant="ghost" onclick={close}>Cancel</Button>
		<Button variant="primary" type="submit" {form}>Start session</Button>
	{/snippet}
</Dialog>
```
-->
<script lang="ts">
	import { tick, untrack, type Snippet } from "svelte";
	import type { HTMLDialogAttributes } from "svelte/elements";
	import IconButton from "./IconButton.svelte";
	import { focusable, restore } from "./focus.js";
	import type { Content, DialogControls } from "./types.js";

	interface Props extends Omit<
		HTMLDialogAttributes,
		"title" | "open" | "onsubmit"
	> {
		open?: boolean;
		title: Content;
		description?: Content | undefined | null;
		size?: "narrow" | "wide" | undefined;
		/** Closes when the backdrop is pressed. */
		light?: boolean;
		/** Work is in flight: the dialog stays open and says so. */
		busy?: boolean;
		/** Asked before Escape, the close button or the backdrop closes it. */
		canClose?: () => boolean | Promise<boolean>;
		/** Shows the close button in the header. */
		closable?: boolean;
		closeLabel?: string;
		/** A selector inside the dialog for the first focus. */
		initialFocus?: string | undefined;
		/** Makes the body a form. */
		onsubmit?: (
			event: SubmitEvent & { currentTarget: HTMLFormElement },
		) => void;
		onclose?: () => void;
		children: Snippet;
		footer?: Snippet<[DialogControls]>;
		/** Puts the footer's first action at its start. */
		footerJustify?: "between" | undefined;
		/** The dialog element. */
		element?: HTMLDialogElement | null;
		/** Internal: a `Drawer` reuses the dialog. */
		edge?: "end" | "start" | "bottom" | undefined;
	}

	let {
		open = $bindable(false),
		title,
		description,
		size,
		light = false,
		busy = false,
		canClose,
		closable = true,
		closeLabel = "Close",
		initialFocus,
		onsubmit,
		onclose,
		children,
		footer,
		footerJustify,
		element = $bindable(null),
		edge,
		oncancel: userCancel,
		onkeydown: userKeydown,
		onpointerdown: userPointerdown,
		onclick: userClick,
		class: className,
		...rest
	}: Props = $props();

	const uid = $props.id();
	const titleId = `${uid}-title`;
	const descriptionId = `${uid}-description`;
	const formId = `${uid}-form`;
	let opener: Element | null = null;
	let pressedOutside = false;
	/** The next close was asked for: by `request()` or by `open` itself. */
	let allowed = false;
	/** Whatever held focus in the fields when work began. */
	let waiting: Element | null = null;
	let destroyed = false;

	function arrive(dialog: HTMLDialogElement) {
		const target =
			(initialFocus && dialog.querySelector<HTMLElement>(initialFocus)) ||
			dialog
				.querySelector(".kin-dialog__body")
				?.querySelector<HTMLElement>(focusable) ||
			dialog.querySelector<HTMLElement>(`#${CSS.escape(titleId)}`);
		target?.focus({ preventScroll: true });
	}

	$effect(() => {
		const dialog = element;
		if (!dialog) return;
		if (open && !dialog.open) {
			opener = document.activeElement;
			dialog.showModal();
			arrive(dialog);
		} else if (!open && dialog.open) {
			allowed = true;
			dialog.close();
		}
	});

	// Removed while open, it still closes properly: focus goes back and the
	// product hears of it.
	$effect(() => {
		const dialog = element;
		if (!dialog) return;
		return () => {
			destroyed = true;
			if (!dialog.open) return;
			dialog.close();
			const back = opener;
			opener = null;
			restore(back);
			open = false;
			onclose?.();
		};
	});

	// Work in flight disables the fields, and a disabled field drops focus;
	// the title holds it meanwhile and gives it back when the work ends.
	$effect.pre(() => {
		if (!busy) return;
		const dialog = untrack(() => element);
		const active = document.activeElement;
		if (dialog && active?.closest(".kin-dialog__fields")) {
			waiting = active;
			dialog
				.querySelector<HTMLElement>(`#${CSS.escape(titleId)}`)
				?.focus({ preventScroll: true });
		}
		return () => {
			const back = waiting;
			waiting = null;
			if (!back) return;
			void tick().then(() => {
				if (document.activeElement?.id === titleId) restore(back);
			});
		};
	});

	async function request() {
		if (busy) return;
		if (canClose && !(await canClose())) return;
		allowed = true;
		open = false;
		// A dialog a product opened itself closes as well.
		if (element?.open) element.close();
	}

	const controls: DialogControls = {
		form: formId,
		close: () => void request(),
	};
</script>

<dialog
	aria-labelledby={titleId}
	aria-describedby={description ? descriptionId : undefined}
	{...rest}
	bind:this={element}
	class={[edge ? "kin-drawer" : "kin-dialog", className]}
	data-size={edge ? undefined : size}
	data-side={edge === "end" ? undefined : edge}
	aria-busy={busy || undefined}
	onkeydown={(event) => {
		userKeydown?.(event);
		// Escape is the dialog's to answer: the platform's own cancel cannot
		// be refused a second time, so it never reaches it. A popover inside
		// that Escape closes goes first.
		if (event.key !== "Escape" || event.defaultPrevented) return;
		if (
			event.currentTarget.querySelector(':popover-open:not([popover="manual"])')
		)
			return;
		event.preventDefault();
		void request();
	}}
	oncancel={(event) => {
		userCancel?.(event);
		event.preventDefault();
		void request();
	}}
	onclose={(event) => {
		const dialog = event.currentTarget;
		// Opened again before this event arrived, or already torn down.
		if (destroyed || dialog.open) return;
		if (!allowed && (busy || canClose)) {
			// The platform closed it on its own; work in flight or a guard
			// keeps it open, and the guard is asked as Escape would.
			dialog.showModal();
			if (!busy) void request();
			return;
		}
		allowed = false;
		open = false;
		const back = opener;
		opener = null;
		restore(back);
		onclose?.();
	}}
	onpointerdown={(event) => {
		userPointerdown?.(event);
		pressedOutside = light && event.target === event.currentTarget;
	}}
	onclick={(event) => {
		userClick?.(event);
		// Only a press and release both on the backdrop: a drag that starts
		// inside the box and ends outside it does not close it.
		if (pressedOutside && event.target === event.currentTarget) {
			const box = event.currentTarget.getBoundingClientRect();
			const inside =
				event.clientX >= box.left &&
				event.clientX <= box.right &&
				event.clientY >= box.top &&
				event.clientY <= box.bottom;
			if (!inside) void request();
		}
		pressedOutside = false;
	}}
>
	<div class="kin-dialog__header">
		<div>
			<h2 class="kin-dialog__title" id={titleId} tabindex="-1">
				{#if typeof title === "function"}{@render title()}{:else}{title}{/if}
			</h2>
			{#if description}
				<p class="kin-caption" id={descriptionId}>
					{#if typeof description === "function"}{@render description()}{:else}{description}{/if}
				</p>
			{/if}
		</div>
		{#if closable}
			<IconButton
				class="kin-dialog__close"
				size="compact"
				label={closeLabel}
				disabled={busy}
				onclick={() => void request()}
			>
				<svg
					viewBox="0 0 16 16"
					aria-hidden="true"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></svg
				>
			</IconButton>
		{/if}
	</div>
	{#if onsubmit}
		<form
			class="kin-dialog__body"
			id={formId}
			onsubmit={(event) => {
				event.preventDefault();
				// A submit button outside the disabled fields still submits.
				if (busy) return;
				onsubmit(event);
			}}
		>
			<fieldset class="kin-dialog__fields" disabled={busy}>
				{@render children()}
			</fieldset>
		</form>
	{:else}
		<div class="kin-dialog__body">{@render children()}</div>
	{/if}
	{#if footer}
		<div class="kin-dialog__footer" data-justify={footerJustify}>
			{@render footer(controls)}
		</div>
	{/if}
</dialog>
