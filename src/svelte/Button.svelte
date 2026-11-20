<!--
@component
A `.kin-button`. With `href` it is a link that looks like a button; without,
a `<button>` whose type defaults to `button`, so it never submits a form by
accident. An icon alone needs a name: use `IconButton`.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type {
		HTMLAnchorAttributes,
		HTMLButtonAttributes,
	} from "svelte/elements";

	interface Shared {
		/** The button's weight; omit it for the ordinary button. */
		variant?: "primary" | "quiet" | "ghost" | "danger" | undefined;
		size?: "compact" | "large" | undefined;
		/** Take the full inline size of the container. */
		full?: boolean;
		/** The rendered element, for focus. */
		element?: HTMLButtonElement | HTMLAnchorElement | null;
		children: Snippet;
	}
	type Props = Shared &
		(
			| ({ href: string } & Omit<HTMLAnchorAttributes, "href">)
			| ({ href?: undefined } & HTMLButtonAttributes)
		);

	let {
		variant,
		size,
		full = false,
		element = $bindable(null),
		children,
		class: className,
		...rest
	}: Props = $props();

	const classes = $derived([
		"kin-button",
		variant && `kin-button--${variant}`,
		className,
	]);
</script>

{#if rest.href !== undefined}
	<a
		{...rest as HTMLAnchorAttributes}
		bind:this={element}
		class={classes}
		data-size={size}
		data-width={full ? "full" : undefined}>{@render children()}</a
	>
{:else}
	<button
		type="button"
		{...rest as HTMLButtonAttributes}
		bind:this={element}
		class={classes}
		data-size={size}
		data-width={full ? "full" : undefined}>{@render children()}</button
	>
{/if}
