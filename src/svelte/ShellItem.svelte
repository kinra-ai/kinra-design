<!--
@component
A `.kin-shell__item`: a square in the rail with its glyph, its name for
assistive technology, its label in a labelled drawer, and its tip. A count
in `badge` repeats what `says` puts into the name.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type {
		HTMLAnchorAttributes,
		HTMLButtonAttributes,
	} from "svelte/elements";
	import type { StatusState, Tone } from "./types.js";

	interface Shared {
		/** The item's name: its tip, its label and what is said. */
		label: string;
		/** More the tip and the name say, such as "3 waiting on you". */
		says?: string | undefined;
		/** The open page. */
		current?: boolean;
		/** A count on the glyph's corner. */
		badge?: number | string | undefined;
		badgeTone?: Tone | undefined;
		/** A state mark on the glyph's corner. */
		status?: StatusState | "idle" | undefined;
		/** Show the label under the glyph in a labelled drawer. */
		labelled?: boolean;
		/** A button that routes closes the drawer as a link does. */
		navigates?: boolean;
		element?: HTMLAnchorElement | HTMLButtonElement | null;
		/** The glyph: an icon, an avatar or a mark. */
		children: Snippet;
	}
	type Props = Shared &
		(
			| ({ href: string } & Omit<HTMLAnchorAttributes, "href">)
			| ({ href?: undefined } & HTMLButtonAttributes)
		);

	let {
		label,
		says,
		current = false,
		badge,
		badgeTone,
		status,
		labelled = true,
		navigates = false,
		element = $bindable(null),
		children,
		class: className,
		...rest
	}: Props = $props();

	const name = $derived(says ? `${label}, ${says}` : label);
</script>

{#snippet inside()}
	<span class="kin-shell__glyph">
		{@render children()}
		{#if badge !== undefined && badge !== "" && badge !== 0}
			<span class="kin-shell__badge" data-tone={badgeTone} aria-hidden="true"
				>{badge}</span
			>
		{/if}
		{#if status}
			<span
				class="kin-status"
				data-state={status === "idle" ? undefined : status}
				aria-hidden="true"
			></span>
		{/if}
	</span>
	<span class="kin-sr-only">{name}</span>
	{#if labelled}
		<span class="kin-shell__label" aria-hidden="true">{label}</span>
	{/if}
	<span class="kin-tooltip kin-shell__tip" aria-hidden="true"
		>{label}{#if says}<span class="kin-tooltip__hint">{says}</span>{/if}</span
	>
{/snippet}

{#if rest.href !== undefined}
	<a
		{...rest as HTMLAnchorAttributes}
		bind:this={element}
		class={["kin-shell__item", className]}
		aria-current={current ? "page" : undefined}>{@render inside()}</a
	>
{:else}
	<button
		type="button"
		{...rest as HTMLButtonAttributes}
		bind:this={element}
		class={["kin-shell__item", className]}
		aria-current={current ? "page" : undefined}
		data-navigates={navigates ? "" : undefined}>{@render inside()}</button
	>
{/if}
