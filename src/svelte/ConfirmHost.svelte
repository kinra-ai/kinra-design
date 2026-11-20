<!--
@component
Renders the request `confirm()` makes, as a narrow alert dialog. Mount it
once, beside the product's root layout. Focus starts on the way back, at the
footer's start; the action takes its end; Escape answers no. A request that
replaces one still on screen moves focus back to the way back, so a press
meant for the first never confirms the second.
-->
<script lang="ts">
	import { tick } from "svelte";
	import Button from "./Button.svelte";
	import Dialog from "./Dialog.svelte";
	import { pending } from "./confirm.svelte.js";

	type Request = NonNullable<typeof pending.request>;

	let open = $state(false);
	let shown = $state.raw<Request | null>(null);
	let element = $state<HTMLDialogElement | null>(null);
	const uid = $props.id();

	$effect(() => {
		const next = pending.request;
		if (!next || next === shown) return;
		const replacing = open && element?.open;
		shown = next;
		open = true;
		if (replacing) {
			void tick().then(() =>
				element
					?.querySelector<HTMLElement>("[data-confirm='cancel']")
					?.focus({ preventScroll: true }),
			);
		}
	});

	// The answer is settled the moment the reader gives it; the dialog then
	// closes and gives focus back before it leaves the page.
	function answer(value: boolean) {
		shown?.answer(value);
		open = false;
	}
</script>

{#if shown}
	<Dialog
		bind:open
		bind:element
		size="narrow"
		role="alertdialog"
		title={shown.title}
		aria-describedby={shown.body ? `${uid}-body` : undefined}
		closable={false}
		initialFocus="[data-confirm='cancel']"
		onclose={() => {
			// Escape, or anything else that closed it unanswered, is a no.
			if (shown && pending.request === shown) shown.answer(false);
			if (!pending.request) shown = null;
		}}
	>
		{#if shown.body}<p id={`${uid}-body`}>{shown.body}</p>{/if}
		{#if shown.items?.length}
			<ul class="kin-stack" data-space="tight">
				{#each shown.items as item, index (index)}<li>{item}</li>{/each}
			</ul>
		{/if}
		{#snippet footer()}
			<Button
				variant="quiet"
				data-confirm="cancel"
				onclick={() => answer(false)}>{shown?.cancel ?? "Cancel"}</Button
			>
			<Button
				variant={shown?.tone === "error" ? "danger" : "primary"}
				data-confirm="action"
				onclick={() => answer(true)}>{shown?.action}</Button
			>
		{/snippet}
	</Dialog>
{/if}
