<!--
@component
A `.kin-field`: a label, an optional hint, one control, and an error. It
names the control and wires `aria-describedby`, `aria-invalid` and
`required`. `Input`, `Select` and `Textarea` inside it take these on their
own; any other control takes them from the `children` snippet's argument:

```svelte
<Field label="Branch" error={problem}>
	{#snippet children(control)}<MyPicker {...control} />{/snippet}
</Field>
```
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { setFieldControl } from "./field-context.js";
	import type { Content, FieldControlAttributes } from "./types.js";

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
		label: Content;
		hint?: Content | undefined;
		/** Why the value is wrong; its presence marks the control invalid. */
		error?: Content | undefined | null | false;
		/** Mark the control required and say so beside the label. */
		required?: boolean;
		/** Say "Optional" beside the label instead. */
		optional?: boolean;
		/** The words beside the label; product copy may change them. */
		requiredText?: string;
		optionalText?: string;
		/** The label beside the control rather than above it. */
		layout?: "inline" | undefined;
		/** The control's id; generated when omitted. */
		for?: string | undefined;
		children: Snippet<[FieldControlAttributes]>;
	}

	let {
		label,
		hint,
		error,
		required = false,
		optional = false,
		requiredText = "Required",
		optionalText = "Optional",
		layout,
		for: forId,
		children,
		class: className,
		...rest
	}: Props = $props();

	const uid = $props.id();
	const id = $derived(forId ?? `${uid}-control`);
	const hintId = $derived(`${id}-hint`);
	const errorId = $derived(`${id}-error`);
	const describedby = $derived(
		[hint ? hintId : undefined, error ? errorId : undefined]
			.filter(Boolean)
			.join(" ") || undefined,
	);
	const control: FieldControlAttributes = {
		get id() {
			return id;
		},
		get "aria-describedby"() {
			return describedby;
		},
		get "aria-invalid"() {
			return error ? ("true" as const) : undefined;
		},
		get required() {
			return required || undefined;
		},
	};
	setFieldControl({
		get id() {
			return id;
		},
		get describedby() {
			return describedby;
		},
		get invalid() {
			return Boolean(error);
		},
		get required() {
			return required;
		},
	});
</script>

<div {...rest} class={["kin-field", className]} data-layout={layout}>
	<label class="kin-field__label" for={id}>
		{#if typeof label === "string"}{label}{:else}{@render label()}{/if}
		{#if required}
			<span class="kin-field__required">{requiredText}</span>
		{:else if optional}
			<span class="kin-field__optional">{optionalText}</span>
		{/if}
	</label>
	{#if hint}
		<p class="kin-field__hint" id={hintId}>
			{#if typeof hint === "string"}{hint}{:else}{@render hint()}{/if}
		</p>
	{/if}
	{@render children(control)}
	{#if error}
		<p class="kin-field__error" id={errorId}>
			{#if typeof error === "string"}{error}{:else}{@render error()}{/if}
		</p>
	{/if}
</div>
