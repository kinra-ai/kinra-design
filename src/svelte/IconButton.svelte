<!--
@component
A `.kin-button--icon`: an icon with a required name. The name is the
button's `aria-label`; the icon is decoration and is hidden from assistive
technology by the snippet's own `aria-hidden`.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	interface Props extends Omit<HTMLButtonAttributes, "aria-label"> {
		/** What the button does, said by assistive technology. */
		label: string;
		variant?: "primary" | "quiet" | "ghost" | "danger" | undefined;
		size?: "compact" | "large" | undefined;
		element?: HTMLButtonElement | null;
		/** The icon; mark its `svg` `aria-hidden="true"`. */
		children: Snippet;
	}

	let {
		label,
		variant = "ghost",
		size,
		element = $bindable(null),
		children,
		class: className,
		...rest
	}: Props = $props();
</script>

<button
	type="button"
	{...rest}
	bind:this={element}
	class={[
		"kin-button",
		"kin-button--icon",
		variant && `kin-button--${variant}`,
		className,
	]}
	data-size={size}
	aria-label={label}>{@render children()}</button
>
