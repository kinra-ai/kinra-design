<!--
@component
A `.kin-disclosure` on native `details`: the summary is always shown and the
body opens beneath it. `open` binds both ways; `ontoggle` reports the
change.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLDetailsAttributes } from "svelte/elements";
	import type { Content } from "./types.js";

	interface Props extends HTMLDetailsAttributes {
		summary: Content;
		/** A bounded box, for settings groups and advanced options. */
		variant?: "panel" | undefined;
		open?: boolean;
		children: Snippet;
	}

	let {
		summary,
		variant,
		open = $bindable(false),
		children,
		class: className,
		...rest
	}: Props = $props();
</script>

<details
	{...rest}
	bind:open
	class={["kin-disclosure", className]}
	data-variant={variant}
>
	<summary
		>{#if typeof summary === "string"}{summary}{:else}{@render summary()}{/if}</summary
	>
	<div class="kin-disclosure__body">{@render children()}</div>
</details>
