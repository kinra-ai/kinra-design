<!--
@component
A `.kin-drawer`: a modal dialog anchored to an edge, for an inspector, a
filter panel or a sheet on a phone. It is a `Dialog` in every other way, and
a press on its backdrop closes it unless `light` is false.
-->
<script lang="ts">
	import type { ComponentProps } from "svelte";
	import Dialog from "./Dialog.svelte";

	type Props = Omit<ComponentProps<typeof Dialog>, "edge" | "size"> & {
		/** The line's end by default; mirrored right to left. */
		side?: "end" | "start" | "bottom";
	};

	let {
		open = $bindable(false),
		element = $bindable(null),
		side = "end",
		light = true,
		...rest
	}: Props = $props();
</script>

<Dialog {...rest} bind:open bind:element {light} edge={side} />
