<!--
@component
A `.kin-skeleton`: a placeholder for one thing on its way. Hide it from
assistive technology and mark its group `aria-busy`; `Loading` does both.
-->
<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		shape?: "text" | "heading" | "square" | "block" | undefined;
		/** A CSS width, such as `60%`. */
		width?: string | undefined;
	}

	let { shape, width, class: className, ...rest }: Props = $props();
</script>

<span
	aria-hidden="true"
	{...rest}
	class={["kin-skeleton", className]}
	data-shape={shape}
	style:--kin-skeleton-width={width}
></span>
