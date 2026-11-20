<!--
@component
A `.kin-chip`: an interactive tag. With `pressed` it is a toggle for a
filter or a selection, and `pressed` binds. With `onremove` it is a value
with its own remove button, named by `removeLabel`.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	type Toggle = Omit<HTMLButtonAttributes, "aria-pressed"> & {
		/** Whether the filter or selection is on. */
		pressed: boolean;
		onremove?: undefined;
		removeLabel?: undefined;
	};
	type Removable = Omit<HTMLButtonAttributes, "onclick"> & {
		pressed?: undefined;
		onclick?: undefined;
		/** Remove the value. */
		onremove: () => void;
		/** The remove button's name, such as "Remove author filter". */
		removeLabel: string;
	};
	type Props = (Toggle | Removable) & { children: Snippet };

	let {
		pressed = $bindable(),
		onremove,
		removeLabel,
		onclick,
		children,
		class: className,
		...rest
	}: Props = $props();
</script>

{#if onremove}
	<span class={["kin-chip", className]}>
		{@render children()}
		<button
			type="button"
			{...rest}
			class="kin-chip__remove"
			aria-label={removeLabel}
			onclick={onremove}
		>
			<svg
				viewBox="0 0 12 12"
				aria-hidden="true"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"><path d="M2 2l8 8M10 2l-8 8" /></svg
			>
		</button>
	</span>
{:else}
	<button
		type="button"
		{...rest}
		class={["kin-chip", className]}
		aria-pressed={pressed}
		onclick={(event) => {
			pressed = !pressed;
			onclick?.(event);
		}}>{@render children()}</button
	>
{/if}
