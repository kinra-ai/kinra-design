<!--
@component
A `.kin-badge`: a non-interactive label for a category or a bounded state.
A filter or a removable value is a `Chip`.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import type { Tone } from "./types.js";

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		tone?: Tone | undefined;
		/** The filled variant, for a label that must stand out. */
		solid?: boolean;
		/** Tabular figures for a count. */
		numeric?: boolean;
		children: Snippet;
	}

	let {
		tone,
		solid = false,
		numeric = false,
		children,
		class: className,
		...rest
	}: Props = $props();
</script>

<span
	{...rest}
	class={["kin-badge", className]}
	data-tone={tone}
	data-variant={solid ? "solid" : undefined}
	data-numeric={numeric ? "" : undefined}>{@render children()}</span
>
