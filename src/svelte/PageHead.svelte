<!--
@component
A `.kin-page-head`: what the page is. Its title, a quiet summary beside it
(a count or a state), its actions at the end, and one description on the
next line. Keep one primary action at most; the others are quiet.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import type { Content, HeadingLevel } from "./types.js";

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
		title: Content;
		/** Defaults to 1: a page has one. */
		level?: HeadingLevel;
		summary?: Content | number | undefined | null;
		description?: Content | undefined | null;
		/** A glyph or face before the title. */
		lead?: Snippet;
		actions?: Snippet;
		/** The heading, for moving focus to it. */
		heading?: HTMLHeadingElement | null;
		/** Attributes for the heading, such as `id` or `tabindex`. */
		headingProps?: HTMLAttributes<HTMLHeadingElement>;
	}

	let {
		title,
		level = 1,
		summary,
		description,
		lead,
		actions,
		heading = $bindable(null),
		headingProps,
		class: className,
		...rest
	}: Props = $props();
</script>

<div {...rest} class={["kin-page-head", className]}>
	{#if lead}<span class="kin-page-head__lead">{@render lead()}</span>{/if}
	<svelte:element
		this={`h${level}`}
		{...headingProps}
		bind:this={heading}
		class={["kin-page-head__title", headingProps?.class]}
		>{#if typeof title === "function"}{@render title()}{:else}{title}{/if}</svelte:element
	>
	{#if summary != null && summary !== ""}
		<p class="kin-page-head__summary">
			{#if typeof summary === "function"}{@render summary()}{:else}{summary}{/if}
		</p>
	{/if}
	{#if actions}<div class="kin-page-head__actions">
			{@render actions()}
		</div>{/if}
	{#if description}
		<p class="kin-page-head__description">
			{#if typeof description === "function"}{@render description()}{:else}{description}{/if}
		</p>
	{/if}
</div>
