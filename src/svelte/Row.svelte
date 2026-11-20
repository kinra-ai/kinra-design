<!--
@component
A `.kin-list__item`. With `href` its main part is a link, with `onopen` a
button; either way it lights the whole row, and the `trail`'s actions stand
beside it as their own tab stops, never inside it. Without either, the row
only reads. `after` holds what the row opens, beneath it.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes, HTMLLiAttributes } from "svelte/elements";
	import type { Content, Tone } from "./types.js";

	interface Base extends Omit<HTMLLiAttributes, "title"> {
		title?: Content | undefined;
		/** A quiet line under the title. */
		caption?: Content | undefined;
		/** An avatar, glyph or mark before the body. */
		lead?: Snippet;
		/** More of the body, after the title and caption. */
		children?: Snippet;
		/** Actions and figures at the row's end. */
		trail?: Snippet;
		/** What the row opens, beneath it. */
		after?: Snippet;
		/** The open row: `aria-current` on its main part. */
		current?: boolean | "page" | "step" | "location" | "true";
		/** A still state, drawn as the bar at the row's start. */
		tone?: Tone | undefined;
		/** Attributes for the main link or button. */
		mainProps?: HTMLAttributes<HTMLElement>;
		/** The main link or button, for focus. */
		element?: HTMLElement | null;
	}
	/** A row opens a page, opens something in place, or only reads. */
	type Opens =
		| {
				/** The row opens a page. */
				href: string;
				onopen?: undefined;
				disabled?: undefined;
		  }
		| {
				href?: undefined;
				/** The row opens something in place. */
				onopen: (event: MouseEvent) => void;
				disabled?: boolean;
		  }
		| { href?: undefined; onopen?: undefined; disabled?: undefined };
	type Props = Base & Opens;

	let {
		title,
		caption,
		lead,
		children,
		trail,
		after,
		href,
		onopen,
		current = false,
		disabled = false,
		tone,
		mainProps,
		element = $bindable(null),
		class: className,
		...rest
	}: Props = $props();

	const ariaCurrent = $derived(
		current === true ? (href ? "page" : "true") : current || undefined,
	);
</script>

{#snippet body()}
	{#if lead}<span class="kin-list__lead">{@render lead()}</span>{/if}
	<span class="kin-list__body">
		{#if title}
			<span class="kin-list__title"
				>{#if typeof title === "function"}{@render title()}{:else}{title}{/if}</span
			>
		{/if}
		{#if caption}
			<span class="kin-list__meta"
				>{#if typeof caption === "function"}{@render caption()}{:else}{caption}{/if}</span
			>
		{/if}
		{@render children?.()}
	</span>
{/snippet}

<li {...rest} class={["kin-list__item", className]} data-tone={tone}>
	{#if href !== undefined}
		<a
			{...mainProps}
			class={["kin-list__main", mainProps?.class]}
			{href}
			aria-current={ariaCurrent}
			bind:this={element}>{@render body()}</a
		>
	{:else if onopen}
		<button
			type="button"
			{...mainProps}
			class={["kin-list__main", mainProps?.class]}
			aria-current={ariaCurrent}
			{disabled}
			onclick={onopen}
			bind:this={element}>{@render body()}</button
		>
	{:else}
		{@render body()}
	{/if}
	{#if trail}<span class="kin-list__trail">{@render trail()}</span>{/if}
	{#if after}<div class="kin-list__after">{@render after()}</div>{/if}
</li>
