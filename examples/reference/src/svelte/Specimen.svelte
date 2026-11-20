<!-- The catalog's specimen frame, for demos written in Svelte. -->
<script lang="ts">
	import type { Snippet } from "svelte";

	interface Props {
		title: string;
		contract: string;
		description: string;
		children: Snippet;
	}

	let { title, contract, description, children }: Props = $props();
</script>

<section class="specimen">
	<header class="specimen__header">
		<div>
			<h2>{title}</h2>
			<code class="specimen__contract">{contract}</code>
		</div>
		<p>{description}</p>
	</header>
	<div class="specimen__stage">{@render children()}</div>
</section>
