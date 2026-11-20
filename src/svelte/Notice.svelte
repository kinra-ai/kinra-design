<!--
@component
A `.kin-notice`: a short message that stays in the page. Its tone, when
there is one, names a state, drawn as the still bar. A message about what
just happened is a toast; a notice about work still running carries the
live edge instead. Pass `role="status"` or `role="alert"` when it arrives
after the page has loaded and should be announced.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import type { Content, Tone } from "./types.js";

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
		tone?: Tone | undefined;
		density?: "compact" | undefined;
		title?: Content | undefined;
		/** The body. Text or inline content; block children keep their rhythm. */
		children?: Snippet;
		/** Buttons for what the reader can do about it. */
		actions?: Snippet;
	}

	let {
		tone,
		density,
		title,
		children,
		actions,
		class: className,
		...rest
	}: Props = $props();
</script>

<div
	{...rest}
	class={["kin-notice", className]}
	data-tone={tone}
	data-density={density}
>
	{#if title}
		<p class="kin-notice__title">
			{#if typeof title === "string"}{title}{:else}{@render title()}{/if}
		</p>
	{/if}
	{#if children}
		<div class="kin-notice__body">{@render children()}</div>
	{/if}
	{#if actions}
		<div class="kin-notice__actions">{@render actions()}</div>
	{/if}
</div>
