<script lang="ts">
	import {
		Badge,
		Button,
		Check,
		Chip,
		Disclosure,
		Empty,
		Field,
		IconButton,
		Input,
		Notice,
		Radio,
		Segmented,
		Select,
		Spinner,
		Status,
		Switch,
		Textarea,
	} from "@kinra/web/svelte";
	import Specimen from "../Specimen.svelte";

	let presses = $state(0);
	let filters = $state({ open: true, merged: false });
	let author = $state<string | null>("blake");
	let name = $state("");
	let branch = $state("main");
	let visibility = $state("private");
	let notes = $state("");
	let readme = $state(true);
	let sync = $state(false);
	let density = $state<"comfortable" | "compact" | "dense">("comfortable");
	let speed = $state("normal");
	let advanced = $state(false);
	const nameError = $derived(
		name.length > 0 && !/^[a-z0-9-]+$/.test(name)
			? "Use lowercase letters, figures and hyphens."
			: undefined,
	);
</script>

<Specimen
	title="Buttons"
	contract="Button · IconButton · variant · size · full · href"
	description="A button never submits by accident; with href it is a link. An icon alone takes a required label."
>
	<div class="kin-cluster" data-space="compact">
		<Button id="press" onclick={() => presses++}>Pressed {presses}</Button>
		<Button variant="primary">Primary</Button>
		<Button variant="quiet">Quiet</Button>
		<Button variant="ghost">Ghost</Button>
		<Button variant="danger" size="compact">Compact danger</Button>
		<Button href="#buttons" id="button-link">A link</Button>
		<IconButton label="Close" id="icon-button">
			<svg
				viewBox="0 0 16 16"
				aria-hidden="true"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"><path d="M3 3l10 10M13 3L3 13" /></svg
			>
		</IconButton>
	</div>
	<form id="no-submit" onsubmit={(event) => event.preventDefault()}>
		<Button id="inside-form">Inside a form</Button>
	</form>
</Specimen>

<Specimen
	title="Labels"
	contract="Badge · Chip · Status · Spinner"
	description="A badge labels; a chip toggles or removes; a status is a square and a word."
>
	<div class="kin-stack" data-space="compact">
		<div class="kin-cluster" data-space="compact">
			<Badge>Draft</Badge>
			<Badge tone="success">Released</Badge>
			<Badge tone="warning" solid>Held</Badge>
			<Badge numeric>214</Badge>
		</div>
		<div class="kin-cluster" data-space="compact">
			<Chip id="chip-open" bind:pressed={filters.open}>Open</Chip>
			<Chip bind:pressed={filters.merged}>Merged</Chip>
			{#if author}
				<Chip
					id="chip-author"
					removeLabel="Remove author filter"
					onremove={() => (author = null)}>author:{author}</Chip
				>
			{/if}
		</div>
		<div class="kin-cluster" data-space="compact">
			<Status>Idle</Status>
			<Status state="reason">Reasoning</Status>
			<Status state="running">Running</Status>
			<Status state="success">Complete</Status>
			<Status state="warning">Degraded</Status>
			<Status state="error">Failed</Status>
			<Spinner>Indexing</Spinner>
		</div>
	</div>
</Specimen>

<Specimen
	title="Fields"
	contract="Field · Input · Select · Textarea · Check · Radio · Switch · Segmented"
	description="A field names its control, wires its hint and error, and marks it invalid or required."
>
	<form class="kin-stack" onsubmit={(event) => event.preventDefault()}>
		<Field
			label="Repository name"
			hint="Use a short, durable project name."
			error={nameError}
			required
			id="field-name"
		>
			<Input bind:value={name} placeholder="project-name" />
		</Field>
		<Field label="Branch" optional>
			<Input bind:value={branch} />
		</Field>
		<Field label="Visibility">
			<Select bind:value={visibility}>
				<option value="private">Private</option>
				<option value="public">Public</option>
			</Select>
		</Field>
		<Field label="Notes" hint="What should a reviewer know?">
			<Textarea bind:value={notes} />
		</Field>
		<Field label="Custom control" for="custom-control">
			{#snippet children(control)}
				<input class="kin-range" type="range" {...control} />
			{/snippet}
		</Field>
		<Check bind:checked={readme} hint="You can change this later."
			>Create the repository with a README</Check
		>
		<fieldset class="kin-fieldset">
			<legend class="kin-fieldset__legend">Speed</legend>
			<Radio name="speed" value="normal" bind:group={speed}>Normal</Radio>
			<Radio name="speed" value="fast" bind:group={speed}>Fast</Radio>
		</fieldset>
		<Switch bind:checked={sync} id="switch-sync">Keep in sync</Switch>
		<Segmented
			label="Density"
			bind:value={density}
			options={[
				{ value: "comfortable", label: "Comfortable" },
				{ value: "compact", label: "Compact" },
				{ value: "dense", label: "Dense" },
			]}
		/>
		<p class="kin-caption" id="field-state">
			{readme ? "README" : "No README"} · {speed} · {sync ? "sync" : "no sync"} ·
			{density}
		</p>
	</form>
</Specimen>

<Specimen
	title="Messages"
	contract="Notice · Empty · Disclosure"
	description="A notice stays in the page; an empty state says what nothing means; a disclosure opens beneath its summary."
>
	<div class="kin-stack">
		<Notice tone="reason" title="Human review remains required" id="notice">
			The reasoning channel can prepare evidence, but it cannot approve this
			release.
			{#snippet actions()}
				<Button size="compact">Open review</Button>
			{/snippet}
		</Notice>
		<Notice tone="warning" density="compact" title="Two repositories are behind"
			><p>Version state is said in words.</p>
			<p>Colour repeats it.</p></Notice
		>
		<Empty title="No release candidates" id="empty-full">
			Prepare one when a change is ready.
			{#snippet actions()}
				<Button variant="quiet">Prepare a candidate</Button>
			{/snippet}
		</Empty>
		<Empty id="empty-compact">No other examples here.</Empty>
		<Disclosure summary="Advanced" bind:open={advanced} id="disclosure">
			<p>Routes and copy stay with the product.</p>
		</Disclosure>
		<p class="kin-caption" id="disclosure-state">
			{advanced ? "Advanced is open" : "Advanced is closed"}
		</p>
	</div>
</Specimen>
