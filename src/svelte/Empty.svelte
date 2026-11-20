<!--
@component
A `.kin-empty`: what an empty collection means. With a title it is the full
shape, with its body and at most the one legitimate next step; without one it
is a compact muted sentence, which takes a list row's padding inside a list.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import type { Content } from "./types.js";

	interface Props extends Omit<HTMLAttributes<HTMLElement>, "title"> {
		title?: Content | undefined;
		align?: "center" | undefined;
		/** The explanation, or the whole sentence when there is no title. */
		children: Snippet;
		/** The next step, when there is a legitimate one. */
		actions?: Snippet;
		/**
		 * The element. Inside a `ul` or `ol`, such as a `List`, use `li`.
		 * Defaults to `div`.
		 */
		as?: "div" | "li";
	}

	let {
		title,
		align,
		children,
		actions,
		as = "div",
		class: className,
		...rest
	}: Props = $props();
</script>

<svelte:element
	this={as}
	{...rest}
	class={["kin-empty", className]}
	data-align={align}
>
	{#if title}
		<p class="kin-empty__title">
			{#if typeof title === "string"}{title}{:else}{@render title()}{/if}
		</p>
		<div class="kin-empty__body">{@render children()}</div>
		{#if actions}{@render actions()}{/if}
	{:else}
		{@render children()}
		{#if actions}{@render actions()}{/if}
	{/if}
</svelte:element>
