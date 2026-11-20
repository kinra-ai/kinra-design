<!--
@component
A `.kin-list`: rows of one kind of thing. Fill it with `Row`s, and an `Empty`
with `as="li"` when it holds none.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	interface Props extends HTMLAttributes<HTMLUListElement | HTMLOListElement> {
		/** An ordered list when the order means something. */
		ordered?: boolean;
		/** A bounded surface, or bare. */
		variant?: "bounded" | "bare" | undefined;
		density?: "compact" | undefined;
		/** Hairlines between rows, which then fill edge to edge. */
		rules?: boolean;
		/** Trails stay hidden until their row is pointed at or focused. */
		trail?: "reveal" | undefined;
		/** Titles wrap instead of ending in an ellipsis. */
		wrap?: boolean;
		children: Snippet;
	}

	let {
		ordered = false,
		variant,
		density,
		rules = false,
		trail,
		wrap = false,
		children,
		class: className,
		...rest
	}: Props = $props();
</script>

<svelte:element
	this={ordered ? "ol" : "ul"}
	{...rest}
	class={["kin-list", className]}
	data-variant={variant}
	data-density={density}
	data-rules={rules ? "" : undefined}
	data-trail={trail}
	data-wrap={wrap ? "" : undefined}>{@render children()}</svelte:element
>
