<!--
@component
A `.kin-section`: an open group of the page, headed by a `SectionHead` and
labelled by it. Sections stand apart by room, not rules.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import SectionHead from "./SectionHead.svelte";
	import type { Content, HeadingLevel, Tone } from "./types.js";

	interface Props extends Omit<HTMLAttributes<HTMLElement>, "title"> {
		title: Content;
		level?: HeadingLevel;
		summary?: Content | number | undefined | null;
		description?: Content | undefined | null;
		tone?: Tone | undefined;
		actions?: Snippet;
		heading?: HTMLHeadingElement | null;
		children: Snippet;
	}

	let {
		title,
		level = 2,
		summary,
		description,
		tone,
		actions,
		heading = $bindable(null),
		children,
		class: className,
		...rest
	}: Props = $props();

	const uid = $props.id();
</script>

<section
	aria-labelledby={`${uid}-title`}
	{...rest}
	class={["kin-section", className]}
>
	<SectionHead
		{title}
		{level}
		{summary}
		{description}
		{tone}
		{actions}
		bind:heading
		headingProps={{ id: `${uid}-title` }}
	/>
	{@render children()}
</section>
