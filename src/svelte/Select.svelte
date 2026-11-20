<!--
@component
A `.kin-select` around native options. Inside a `Field`, the field names it: it takes the field's
id, so the label always reaches it (give an id to the field as `for`), adds
the field's description to its own, and is invalid or required when the
field is. `value` binds.
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

	// Inside a field the field names the control, so its label always
	// reaches it: give an id to the field as `for`, not to the control.
	const field = fieldControl();
	const describedby = $derived(
		[field?.describedby, rest["aria-describedby"]].filter(Boolean).join(" ") ||
			undefined,
	);
</script>

<select
	{...rest}
	id={field ? field.id : rest.id}
	aria-describedby={describedby}
	aria-invalid={field?.invalid ? "true" : rest["aria-invalid"]}
	required={field?.required || rest.required}
	bind:value
	bind:this={element}
	class={["kin-select", className]}
	data-size={size}>{@render children()}</select
>
