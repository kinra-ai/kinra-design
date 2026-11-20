<!--
@component
A `.kin-check` holding a native radio. Give each radio in a set the same
`name` and bind the set's `group`; the radio is checked while `group`
equals its `value`.
-->
<script lang="ts" generics="T">
	import type { Snippet } from "svelte";
	import type { HTMLInputAttributes } from "svelte/elements";
	import type { Content } from "./types.js";

	interface Props extends Omit<
		HTMLInputAttributes,
		"type" | "children" | "value"
	> {
		value: T;
		group?: T | undefined;
		hint?: Content | undefined;
		element?: HTMLInputElement | null;
		children: Snippet;
	}

	let {
		value,
		group = $bindable(),
		hint,
		element = $bindable(null),
		children,
		onchange,
		class: className,
		...rest
	}: Props = $props();
</script>

<label class={["kin-check", className]}>
	<input
		{...rest}
		type="radio"
		value={typeof value === "string" ? value : undefined}
		checked={group === value}
		bind:this={element}
		onchange={(event) => {
			if (event.currentTarget.checked) group = value;
			onchange?.(event);
		}}
	/>
	<span>
		{@render children()}
		{#if hint}
			<span class="kin-check__hint"
				>{#if typeof hint === "string"}{hint}{:else}{@render hint()}{/if}</span
			>
		{/if}
	</span>
</label>
