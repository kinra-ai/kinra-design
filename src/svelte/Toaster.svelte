<!--
@component
The `.kin-toast-region` for what `toast()` raises. Mount it once, outside the
application shell. The region stays in the page and is a polite live region,
so every arrival is read. A toast's time stops while the reader points at it
or focuses it, so it never leaves while being read; an error stays until it
is dismissed, and a dismissed toast hands focus on rather than dropping it.
Nothing is rendered on the server.
-->
<script lang="ts">
	import { tick } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import Button from "./Button.svelte";
	import IconButton from "./IconButton.svelte";
	import { restore } from "./focus.js";
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

	let mounted = $state(false);
	let region = $state<HTMLDivElement>();
	let pointerIn = $state(false);
	let focusIn = $state(false);
	const held = $derived(pointerIn || focusIn);
	/** Where focus came from when it entered the region. */
	let returnTo: Element | null = null;
	/** Each counting toast's time left, in milliseconds. */
	const left = new Map<number, number>();

	$effect(() => {
		mounted = true;
	});

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

	function leave(id: number) {
		left.delete(id);
		remove(id);
		// WebKit fires no focusout when the focused toast leaves the page.
		void tick().then(() => {
			if (focusIn && !region?.contains(document.activeElement)) {
				focusIn = false;
			}
		});
	}

	// A toast dismissed while it holds focus hands it to the next toast, or
	// back to where it came from.
	function close(id: number, from: EventTarget | null) {
		const own = (from as Element | null)?.closest(".kin-toast");
		if (own?.contains(document.activeElement)) {
			const next = [
				...(region?.querySelectorAll<HTMLElement>(
					".kin-toast:not([data-leaving])",
				) ?? []),
			]
				.find((item) => item !== own)
				?.querySelector<HTMLElement>("button, a[href]");
			if (next) next.focus({ preventScroll: true });
			else if (!restore(returnTo)) (own as HTMLElement).blur();
		}
		dismiss(id);
	}
</script>

<div
	role="region"
	aria-label={label}
	aria-live="polite"
	aria-relevant="additions text"
	{...rest}
	bind:this={region}
	class={["kin-toast-region", className]}
	data-placement={placement}
	onpointerenter={() => (pointerIn = true)}
	onpointerleave={() => (pointerIn = false)}
	onfocusin={(event) => {
		if (!focusIn) returnTo = event.relatedTarget as Element | null;
		focusIn = true;
	}}
	onfocusout={(event) => {
		if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
			focusIn = false;
		}
	}}
>
	{#if mounted}
		{#each toasts as item (item.id)}
			<div
				class="kin-toast"
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
							onclick={(event: MouseEvent) => {
								action.onselect();
								close(item.id, event.currentTarget);
							}}>{action.label}</Button
						>
					{/if}
					<IconButton
						label={dismissLabel}
						size="compact"
						onclick={(event) => close(item.id, event.currentTarget)}
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
	{/if}
</div>
