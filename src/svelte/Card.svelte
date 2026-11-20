<!--
@component
A `.kin-card`: a bounded item in a collection. Give it a `title` and its
parts, or a `header` snippet of your own. With `href` or `onopen` the title
opens the card and the whole card answers the pointer; actions in its body
and footer stay above that.
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import type { Content, HeadingLevel, Tone } from "./types.js";

	interface Props extends Omit<HTMLAttributes<HTMLElement>, "title"> {
		/** The element; `li` inside a list of cards. Defaults to `article`. */
		as?: "article" | "section" | "li" | "div";
		title?: Content | undefined;
		/** Defaults to 3. */
		level?: HeadingLevel;
		/** A quiet line under the title. */
		meta?: Content | undefined;
		/** The title opens a page… */
		href?: string | undefined;
		/** …or opens something in place. */
		onopen?: ((event: MouseEvent) => void) | undefined;
		/** A badge, status or menu at the header's end. */
		actions?: Snippet;
		/** Replaces the whole header. */
		header?: Snippet;
		/** An image above the header. */
		media?: Snippet;
		/** The body. */
		children?: Snippet;
		footer?: Snippet;
		tone?: Tone | undefined;
		variant?: "raised" | "plain" | undefined;
		density?: "compact" | undefined;
	}

	let {
		as = "article",
		title,
		level = 3,
		meta,
		href,
		onopen,
		actions,
		header,
		media,
		children,
		footer,
		tone,
		variant,
		density,
		class: className,
		...rest
	}: Props = $props();

	const uid = $props.id();
	const opens = $derived(href !== undefined || onopen !== undefined);
</script>

<svelte:element
	this={as}
	aria-labelledby={title ? `${uid}-title` : undefined}
	{...rest}
	class={["kin-card", className]}
	data-tone={tone}
	data-variant={variant}
	data-density={density}
	data-link={opens ? "" : undefined}
>
	{#if media}<div class="kin-card__media">{@render media()}</div>{/if}
	{#if header}
		<div class="kin-card__header">{@render header()}</div>
	{:else if title}
		<div class="kin-card__header">
			<div>
				<svelte:element
					this={`h${level}`}
					class="kin-card__title"
					id={`${uid}-title`}
				>
					{#if href !== undefined}
						<a {href}
							>{#if typeof title === "function"}{@render title()}{:else}{title}{/if}</a
						>
					{:else if onopen}
						<button type="button" onclick={onopen}
							>{#if typeof title === "function"}{@render title()}{:else}{title}{/if}</button
						>
					{:else if typeof title === "function"}{@render title()}{:else}{title}{/if}
				</svelte:element>
				{#if meta}
					<p class="kin-card__meta">
						{#if typeof meta === "function"}{@render meta()}{:else}{meta}{/if}
					</p>
				{/if}
			</div>
			{@render actions?.()}
		</div>
	{/if}
	{#if children}<div class="kin-card__body">{@render children()}</div>{/if}
	{#if footer}<div class="kin-card__footer">{@render footer()}</div>{/if}
</svelte:element>
