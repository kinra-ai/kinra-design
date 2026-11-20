<!--
@component
A `.kin-loading` shape: lines, rows or cards of skeletons standing where the
content will be. It waits `delay` milliseconds before it shows, so a quick
read never flashes. Its `label` is said through a status that stays in the
page, so it is read when the read begins.
-->
<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";

	interface Props extends HTMLAttributes<HTMLDivElement> {
		/** Whether the read is in flight. */
		active?: boolean;
		/** What is being read, said while it is. */
		label?: string;
		shape?: "lines" | "rows" | "cards";
		count?: number | undefined;
		/** Milliseconds before the shape shows. */
		delay?: number;
	}

	let {
		active = true,
		label = "Loading",
		shape = "lines",
		count,
		delay = 200,
		class: className,
		...rest
	}: Props = $props();

	let shown = $state(false);
	const total = $derived(count ?? 3);

	$effect(() => {
		shown = false;
		if (!active) return;
		if (delay <= 0) {
			shown = true;
			return;
		}
		const timer = setTimeout(() => (shown = true), delay);
		return () => clearTimeout(timer);
	});
</script>

<!-- One status that stays in the page, so its words are read when the
     read begins; the shape beside it is decoration. -->
<span class="kin-sr-only" role="status">{active ? label : ""}</span>
{#if active}
	<div
		aria-busy="true"
		aria-hidden="true"
		{...rest}
		class={["kin-loading", className]}
		data-shape={shape}
	>
		{#if shown}
			{#each { length: total }, index (index)}
				<span
					class="kin-skeleton"
					data-shape={shape === "lines" ? "text" : "block"}
				></span>
			{/each}
		{/if}
	</div>
{/if}
