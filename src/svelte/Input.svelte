<!--
@component
A `.kin-input`. Inside a `Field` it takes the field's id, description,
validity and requirement unless given its own. `value` binds.
-->
<script lang="ts">
	import type { HTMLInputAttributes } from "svelte/elements";
	import { fieldControl } from "./field-context.js";

	interface Props extends Omit<HTMLInputAttributes, "size"> {
		size?: "compact" | undefined;
		element?: HTMLInputElement | null;
	}

	let {
		value = $bindable(),
		size,
		element = $bindable(null),
		class: className,
		...rest
	}: Props = $props();

	const field = fieldControl();
</script>

<input
	id={field?.id}
	aria-describedby={field?.describedby}
	aria-invalid={field?.invalid ? "true" : undefined}
	required={field?.required || undefined}
	{...rest}
	bind:value
	bind:this={element}
	class={["kin-input", className]}
	data-size={size}
/>
