<!--
@component
A `.kin-segmented` radio group: one choice among a few peers, as native
radios, so arrow keys move the choice. `value` binds.
-->
<script lang="ts" generics="T extends string">
	import type { HTMLAttributes } from "svelte/elements";
	import type { SegmentedOption } from "./types.js";

	interface Props extends Omit<
		HTMLAttributes<HTMLDivElement>,
		"role" | "onchange"
	> {
		/** The group's name for assistive technology. */
		label: string;
		options: readonly SegmentedOption<T>[];
		value?: T | undefined;
		/** The radios' form name; generated when omitted. */
		name?: string | undefined;
		full?: boolean;
		disabled?: boolean;
		onchange?: (value: T) => void;
	}

	let {
		label,
		options,
		value = $bindable(),
		name,
		full = false,
		disabled = false,
		onchange,
		class: className,
		...rest
	}: Props = $props();

	const uid = $props.id();
</script>

<div
	{...rest}
	class={["kin-segmented", className]}
	role="radiogroup"
	aria-label={label}
	data-width={full ? "full" : undefined}
>
	{#each options as option (option.value)}
		<label>
			<input
				type="radio"
				name={name ?? uid}
				value={option.value}
				checked={value === option.value}
				disabled={disabled || option.disabled}
				onchange={() => {
					value = option.value;
					onchange?.(option.value);
				}}
			/>
			<span>{option.label}</span>
		</label>
	{/each}
</div>
