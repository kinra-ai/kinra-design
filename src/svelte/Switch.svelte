<!--
@component
A `.kin-switch`: a native checkbox with `role="switch"`, for a setting that
takes effect at once. `checked` binds. A form value that waits for a submit
is a `Check`.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLInputAttributes } from "svelte/elements";

	interface Props extends Omit<HTMLInputAttributes, "type" | "role"> {
		/** Put the words before the switch. */
		labelPosition?: "start" | undefined;
		element?: HTMLInputElement | null;
		/** The setting's name. */
		children: Snippet;
	}

	let {
		checked = $bindable(false),
		labelPosition,
		element = $bindable(null),
		children,
		class: className,
		...rest
	}: Props = $props();
</script>

<label class={["kin-switch", className]} data-label={labelPosition}>
	<input
		{...rest}
		type="checkbox"
		role="switch"
		bind:checked
		bind:this={element}
	/>
	<span>{@render children()}</span>
</label>
