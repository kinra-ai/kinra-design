<!--
@component
A `.kin-icon`: a glyph at 16, 20 or 24 pixels, hidden from assistive
technology. The control around it carries the name. Pass the product's own
SVG markup, such as a Phosphor icon imported with `?raw`, or an inline `svg`
as children. `svg` is rendered as markup, so give it only the product's own
files, never text a reader supplied.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		/** The SVG markup. */
		svg?: string | undefined;
		/** sm is 16px, md 20px, lg 24px. */
		size?: "sm" | "md" | "lg";
		/** A glyph that points along the line, such as an arrow, turns right to left. */
		along?: boolean;
		children?: Snippet;
	}

	let {
		svg,
		size = "md",
		along = false,
		children,
		class: className,
		...rest
	}: Props = $props();
</script>

<span
	aria-hidden="true"
	{...rest}
	class={["kin-icon", className]}
	data-size={size === "md" ? undefined : size}
	data-along={along ? "" : undefined}
	>{#if svg}{@html svg}{:else}{@render children?.()}{/if}</span
>
