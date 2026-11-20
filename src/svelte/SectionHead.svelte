<!--
@component
A `.kin-section-head`: one step below the page head. A name, a count or
state beside it, compact actions at the end, and a description beneath. With
`tone`, the name carries its group's square.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import type { Content, HeadingLevel, Tone } from "./types.js";

	interface Props extends Omit<HTMLAttributes<HTMLElement>, "title"> {
		title: Content;
		/** Defaults to 2; a dialog's sections take 3. */
		level?: HeadingLevel;
		summary?: Content | number | undefined | null;
		description?: Content | undefined | null;
		/** The group's state, drawn as its square. */
		tone?: Tone | undefined;
		actions?: Snippet;
		heading?: HTMLHeadingElement | null;
		headingProps?: HTMLAttributes<HTMLHeadingElement>;
	}

	let {
		title,
		level = 2,
		summary,
		description,
		tone,
		actions,
		heading = $bindable(null),
		headingProps,
		class: className,
		...rest
	}: Props = $props();
</script>

<header {...rest} class={["kin-section-head", className]} data-tone={tone}>
	<svelte:element
		this={`h${level}`}
		{...headingProps}
		bind:this={heading}
		class={["kin-section-head__title", headingProps?.class]}
		>{#if typeof title === "function"}{@render title()}{:else}{title}{/if}</svelte:element
	>
	{#if summary != null && summary !== ""}
		<p class="kin-section-head__summary">
			{#if typeof summary === "function"}{@render summary()}{:else}{summary}{/if}
		</p>
	{/if}
	{#if actions}<div class="kin-section-head__actions">
			{@render actions()}
		</div>{/if}
	{#if description}
		<p class="kin-section-head__description">
			{#if typeof description === "function"}{@render description()}{:else}{description}{/if}
		</p>
	{/if}
</header>
