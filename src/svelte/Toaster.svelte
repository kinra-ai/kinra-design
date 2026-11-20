<!--
@component
The `.kin-toast-region` for what `toast()` raises. Mount it once, outside the
application shell. A toast's time stops while the reader points at or
focuses the region, so it never leaves while being read; an error stays
until it is dismissed. Information is announced politely; an error at once.
-->
<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import Button from "./Button.svelte";
	import IconButton from "./IconButton.svelte";
	import { dismiss, remove, toasts } from "./toast.svelte.js";

	interface Props extends HTMLAttributes<HTMLDivElement> {
		placement?: "top" | "top-center" | undefined;
		/** The region's name for assistive technology. */
		label?: string;
		dismissLabel?: string;
	}

	let {
		placement,
		label = "Notifications",
		dismissLabel = "Dismiss",
		class: className,
		...rest
	}: Props = $props();

	let held = $state(false);
	/** Each counting toast's time left, in milliseconds. */
	const left = new Map<number, number>();

	// Count down while the region is not held. Each run starts the timers
	// again from what is left, and its cleanup takes off the time spent.
	$effect(() => {
		if (held) return;
		const started = performance.now();
		const counting = toasts.filter(
			(item) => !item.leaving && item.duration > 0,
		);
		const handles = counting.map((item) => {
			if (!left.has(item.id)) left.set(item.id, item.duration);
			return setTimeout(() => dismiss(item.id), left.get(item.id));
		});
		return () => {
			const spent = performance.now() - started;
			for (const handle of handles) clearTimeout(handle);
			for (const item of counting) {
				const time = left.get(item.id);
				if (time !== undefined) left.set(item.id, Math.max(0, time - spent));
			}
		};
	});

	// A leaving toast goes when its exit has played, or after a second if
	// nothing plays it, such as a product that turns the animation off.
	$effect(() => {
		const handles = toasts
			.filter((item) => item.leaving)
			.map((item) => setTimeout(() => leave(item.id), 1000));
		return () => handles.forEach(clearTimeout);
	});

	function hold(value: boolean) {
		held = value;
	}

	function leave(id: number) {
		left.delete(id);
		remove(id);
	}
</script>

<div
	role="region"
	aria-label={label}
	{...rest}
	class={["kin-toast-region", className]}
	data-placement={placement}
	onpointerenter={() => hold(true)}
	onpointerleave={() => hold(false)}
	onfocusin={() => hold(true)}
	onfocusout={(event) => {
		if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
			hold(false);
		}
	}}
>
	{#each toasts as item (item.id)}
		<div
			class="kin-toast"
			role={item.tone === "error" ? "alert" : "status"}
			data-tone={item.tone}
			data-leaving={item.leaving ? "" : undefined}
			onanimationend={(event) => {
				if (item.leaving && event.target === event.currentTarget) {
					leave(item.id);
				}
			}}
		>
			{#if item.title}<p class="kin-toast__title">{item.title}</p>{/if}
			{#if typeof item.body === "string"}
				<p class="kin-toast__body">{item.body}</p>
			{:else if item.body}
				<div class="kin-toast__body">{@render item.body()}</div>
			{/if}
			<div class="kin-toast__actions">
				{#if item.action}
					{@const action = item.action}
					<Button
						variant="ghost"
						onclick={() => {
							action.onselect();
							dismiss(item.id);
						}}>{action.label}</Button
					>
				{/if}
				<IconButton
					label={dismissLabel}
					size="compact"
					onclick={() => dismiss(item.id)}
				>
					<svg
						viewBox="0 0 16 16"
						aria-hidden="true"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"><path d="M4 4l8 8M12 4l-8 8" /></svg
					>
				</IconButton>
			</div>
		</div>
	{/each}
</div>
