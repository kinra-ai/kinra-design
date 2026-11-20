<!--
@component
A `.kin-page`: the work in an application's panel, at the page inset and
measure. Put a `PageHead` first.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	interface Props extends HTMLAttributes<HTMLDivElement> {
		children: Snippet;
	}

	let { children, class: className, ...rest }: Props = $props();
</script>

<div {...rest} class={["kin-page", className]}>{@render children()}</div>
