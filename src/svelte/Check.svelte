<!--
@component
A `.kin-check`: a native checkbox and its label, with an optional hint
beneath the words. `checked` binds. For one choice among several, use
`Radio`; for a setting that takes effect at once, `Switch`.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLInputAttributes } from "svelte/elements";
	import type { Content } from "./types.js";

	interface Props extends Omit<HTMLInputAttributes, "type" | "children"> {
		hint?: Content | undefined;
		element?: HTMLInputElement | null;
		/** The label. */
		children: Snippet;
	}

	let {
		checked = $bindable(false),
		indeterminate = $bindable(false),
		hint,
		element = $bindable(null),
		children,
		class: className,
		...rest
	}: Props = $props();
</script>

<label class={["kin-check", className]}>
	<input
		{...rest}
		type="checkbox"
		bind:checked
		bind:indeterminate
		bind:this={element}
	/>
	<span>
		{@render children()}
		{#if hint}
			<span class="kin-check__hint"
				>{#if typeof hint === "string"}{hint}{:else}{@render hint()}{/if}</span
			>
		{/if}
	</span>
</label>
