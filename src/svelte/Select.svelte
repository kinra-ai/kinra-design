<!--
@component
A `.kin-select` around native options. Inside a `Field` it takes the
field's id, description, validity and requirement unless given its own.
`value` binds.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLSelectAttributes } from "svelte/elements";
	import { fieldControl } from "./field-context.js";

	interface Props extends Omit<HTMLSelectAttributes, "size"> {
		size?: "compact" | undefined;
		element?: HTMLSelectElement | null;
		/** The `option` and `optgroup` elements. */
		children: Snippet;
	}

	let {
		value = $bindable(),
		size,
		element = $bindable(null),
		children,
		class: className,
		...rest
	}: Props = $props();

	const field = fieldControl();
</script>

<select
	id={field?.id}
	aria-describedby={field?.describedby}
	aria-invalid={field?.invalid ? "true" : undefined}
	required={field?.required || undefined}
	{...rest}
	bind:value
	bind:this={element}
	class={["kin-select", className]}
	data-size={size}>{@render children()}</select
>
