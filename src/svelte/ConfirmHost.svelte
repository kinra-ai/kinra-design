<!--
@component
Renders the request `confirm()` makes, as a narrow dialog. Mount it once,
beside the product's root layout. The way back takes the footer's start and
the action its end; Escape answers no.
-->
<script lang="ts">
	import Button from "./Button.svelte";
	import Dialog from "./Dialog.svelte";
	import { pending } from "./confirm.svelte.js";

	let open = $state(false);
	let choice = false;
	const request = $derived(pending.request);

	$effect(() => {
		if (request) {
			choice = false;
			open = true;
		}
	});

	// Close first and answer once the dialog has closed, so it gives focus
	// back before it leaves the page.
	function answer(value: boolean) {
		choice = value;
		open = false;
	}
</script>

{#if request}
	<Dialog
		bind:open
		size="narrow"
		title={request.title}
		closable={false}
		initialFocus="[data-confirm='cancel']"
		onclose={() => {
			const value = choice;
			choice = false;
			request?.answer(value);
		}}
	>
		{#if request.body}<p>{request.body}</p>{/if}
		{#if request.items?.length}
			<ul class="kin-stack" data-space="tight">
				{#each request.items as item, index (index)}<li>{item}</li>{/each}
			</ul>
		{/if}
		{#snippet footer()}
			<Button
				variant="quiet"
				data-confirm="cancel"
				onclick={() => answer(false)}>{request.cancel ?? "Cancel"}</Button
			>
			<Button
				variant={request.tone === "error" ? "danger" : "primary"}
				data-confirm="action"
				onclick={() => answer(true)}>{request.action}</Button
			>
		{/snippet}
	</Dialog>
{/if}
