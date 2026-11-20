<!--
@component
A `.kin-status`: a square mark and a word. The word carries the meaning;
the mark's colour repeats it, and only `running` moves.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import type { StatusState } from "./types.js";

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		/** Omit it for idle. */
		state?: StatusState | undefined;
		children: Snippet;
	}

	let { state, children, class: className, ...rest }: Props = $props();
</script>

<span {...rest} class={["kin-status", className]} data-state={state}
	>{@render children()}</span
>
