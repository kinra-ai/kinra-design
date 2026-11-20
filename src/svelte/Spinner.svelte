<!--
@component
A `.kin-spinner`: three stepping marks beside the words that say what is in
flight. It is a status region, so its words are announced. Render it only
while the work runs.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		tone?: "reason" | "muted" | undefined;
		size?: "large" | undefined;
		/** What is in flight, such as "Indexing". */
		children: Snippet;
	}

	let { tone, size, children, class: className, ...rest }: Props = $props();
</script>

<span
	role="status"
	{...rest}
	class={["kin-spinner", className]}
	data-tone={tone}
	data-size={size}>{@render children()}</span
>
