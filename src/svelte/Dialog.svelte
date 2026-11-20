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
	import type { Snippet } from "svelte";
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
		class: className,
		...rest
	}: Props = $props();

	const uid = $props.id();
	const titleId = `${uid}-title`;
	const descriptionId = `${uid}-description`;
	const formId = `${uid}-form`;
	let opener: Element | null = null;
	let pressedOutside = false;

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
			dialog.close();
		}
	});

	async function request() {
		if (busy) return;
		if (canClose && !(await canClose())) return;
		open = false;
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
	oncancel={(event) => {
		event.preventDefault();
		void request();
	}}
	onclose={() => {
		// The platform may close a modal on its own, such as on a second
		// Escape; the state follows it either way.
		open = false;
		const back = opener;
		opener = null;
		restore(back);
		onclose?.();
	}}
	onpointerdown={(event) => {
		pressedOutside = light && event.target === event.currentTarget;
	}}
	onclick={(event) => {
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
