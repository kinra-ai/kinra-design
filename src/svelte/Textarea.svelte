<!--
@component
A `.kin-textarea`. Inside a `Field` it takes the field's id, description,
validity and requirement unless given its own. `value` binds.
-->
<script lang="ts">
	import type { HTMLTextareaAttributes } from "svelte/elements";
	import { fieldControl } from "./field-context.js";

	interface Props extends HTMLTextareaAttributes {
		element?: HTMLTextAreaElement | null;
	}

	let {
		value = $bindable(),
		element = $bindable(null),
		class: className,
		...rest
	}: Props = $props();

	const field = fieldControl();
</script>

<textarea
	id={field?.id}
	aria-describedby={field?.describedby}
	aria-invalid={field?.invalid ? "true" : undefined}
	required={field?.required || undefined}
	{...rest}
	bind:value
	bind:this={element}
	class={["kin-textarea", className]}></textarea>
