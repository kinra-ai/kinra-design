<!--
A whole application written with @kinra/web/svelte alone: the shell and its
behaviour, a page head, sections, rows, cards, a dialog, a drawer, a
confirmation and toasts. Its pages are hash routes, so it runs without a
router.
-->
<script lang="ts">
	import {
		Button,
		Card,
		ConfirmHost,
		Dialog,
		Drawer,
		Empty,
		Field,
		IconButton,
		Input,
		List,
		Notice,
		Page,
		PageHead,
		Row,
		Section,
		Shell,
		ShellItem,
		Status,
		Toaster,
		confirm,
		toast,
	} from "@kinra/web/svelte";

	const glyph = (d: string) =>
		`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
	const icons = {
		overview:
			'<path d="M4 13.5 6.2 5.6A1.5 1.5 0 0 1 7.6 4.5h8.8a1.5 1.5 0 0 1 1.4 1.1L20 13.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18Z"/><path d="M4 13.5h4.5l1.25 2h4.5l1.25-2H20"/>',
		library:
			'<path d="m12 4 8 4-8 4-8-4Z"/><path d="m4 12 8 4 8-4"/><path d="m4 16 8 4 8-4"/>',
		activity: '<path d="M3.5 12h3.5l2.5-6.5 5 13 2.5-6.5h3.5"/>',
		plus: '<path d="M12 5.5v13M5.5 12h13"/>',
		remove: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',
	};
	const routes = [
		{ id: "overview", name: "Overview", icon: icons.overview },
		{ id: "library", name: "Library", icon: icons.library, count: 3 },
		{ id: "activity", name: "Activity", icon: icons.activity },
	] as const;
	const collections = [
		{ id: "field-notes", name: "Field notes", caption: "12 entries" },
		{ id: "drafts", name: "Drafts", caption: "4 waiting" },
		{ id: "archive", name: "Archive", caption: "Read only" },
	];

	let current = $state("overview");
	let folded = $state(false);
	let open = $state(false);
	let narrow = $state(false);
	let inspecting = $state(false);
	let creating = $state(false);
	let name = $state("");
	let saving = $state(false);
	let entries = $state([
		{ id: 1, title: "Tide tables", caption: "Updated today", tone: undefined },
		{
			id: 2,
			title: "Survey of the north shore",
			caption: "Waits on review",
			tone: "reason" as const,
		},
		{
			id: 3,
			title: "Instrument log",
			caption: "Updated Tuesday",
			tone: undefined,
		},
	]);
	let opened = $state<number | null>(null);
	const page = $derived(
		routes.find((item) => item.id === current) ?? routes[0],
	);

	$effect(() => {
		const read = () => {
			const id = location.hash.slice(1);
			current = routes.some((item) => item.id === id) ? id : "overview";
		};
		read();
		addEventListener("hashchange", read);
		return () => removeEventListener("hashchange", read);
	});

	async function remove(id: number) {
		const entry = entries.find((item) => item.id === id);
		if (!entry) return;
		const yes = await confirm({
			title: `Delete ${entry.title}?`,
			body: "It leaves the library and its history goes with it.",
			action: "Delete entry",
			tone: "error",
		});
		if (!yes) return;
		entries = entries.filter((item) => item.id !== id);
		toast({ title: "Entry deleted", body: entry.title, tone: "success" });
	}

	async function create() {
		saving = true;
		await new Promise((resolve) => setTimeout(resolve, 150));
		entries = [
			...entries,
			{ id: Date.now(), title: name, caption: "Just now", tone: undefined },
		];
		saving = false;
		creating = false;
		toast({ title: "Entry added", body: name, tone: "primary" });
		name = "";
	}
</script>

<Shell
	bind:folded
	bind:open
	bind:narrow
	sidebarId="demo-navigation"
	path={current}
	menuLabel={(isOpen) =>
		isOpen ? "Close navigation" : "Open navigation, 3 waiting on you"}
	id="shell"
>
	{#snippet home()}
		<a class="kin-shell__home" href="#overview" aria-label="Library, home"
			>{@html glyph(icons.library)}<span
				class="kin-tooltip kin-shell__tip"
				aria-hidden="true">Library</span
			></a
		>
	{/snippet}
	{#snippet pages()}
		<ul>
			{#each routes as item (item.id)}
				<li>
					<ShellItem
						href={`#${item.id}`}
						label={item.name}
						says={"count" in item ? `${item.count} waiting on you` : undefined}
						badge={"count" in item ? item.count : undefined}
						badgeTone="reason"
						current={current === item.id}>{@html glyph(item.icon)}</ShellItem
					>
				</li>
			{/each}
		</ul>
	{/snippet}
	{#snippet marks()}
		<ul>
			{#each collections as collection (collection.id)}
				<li>
					<ShellItem
						href={`#${current}`}
						label={collection.name}
						says={collection.caption}
						><span class="kin-avatar" aria-hidden="true"
							>{collection.name.slice(0, 2)}</span
						></ShellItem
					>
				</li>
			{/each}
		</ul>
	{/snippet}
	{#snippet column()}
		<nav class="kin-nav" aria-label="Collections" id="demo-column">
			<ul>
				{#each collections as collection (collection.id)}
					<li><a href={`#${current}`}>{collection.name}</a></li>
				{/each}
			</ul>
		</nav>
	{/snippet}
	{#snippet foot()}
		<ul>
			<li>
				<ShellItem label="Your account" says="Sample person"
					><span class="kin-avatar" aria-hidden="true">SP</span></ShellItem
				>
			</li>
		</ul>
	{/snippet}
	{#snippet crumbs()}
		<li><a href="#overview">Library</a></li>
		<li><span aria-current="page">{page.name}</span></li>
	{/snippet}
	{#snippet end()}
		<Status state="success">Saved</Status>
	{/snippet}

	<Page>
		<PageHead
			title={page.name}
			summary={`${entries.length} entries`}
			description="Everything kept in this library, newest first."
		>
			{#snippet actions()}
				<Button
					variant="primary"
					id="new-entry"
					onclick={() => (creating = true)}>New entry</Button
				>
			{/snippet}
		</PageHead>

		<Section
			title="Entries"
			summary={entries.length}
			description="Open one to read it; its actions stand at the row's end."
		>
			{#snippet actions()}
				<Button id="inspect" onclick={() => (inspecting = true)}>Inspect</Button
				>
			{/snippet}
			<List variant="bounded" id="entries">
				{#each entries as entry (entry.id)}
					<Row
						title={entry.title}
						caption={entry.caption}
						tone={entry.tone}
						current={opened === entry.id}
						onopen={() => (opened = opened === entry.id ? null : entry.id)}
						data-entry={entry.id}
					>
						{#snippet trail()}
							<IconButton
								label={`Delete ${entry.title}`}
								size="compact"
								onclick={() => remove(entry.id)}
								>{@html glyph(icons.remove)}</IconButton
							>
						{/snippet}
						{#snippet after()}
							{#if opened === entry.id}
								<p class="kin-caption">The entry opens beneath its row.</p>
							{/if}
						{/snippet}
					</Row>
				{:else}
					<Empty as="li">Nothing kept yet.</Empty>
				{/each}
			</List>
		</Section>

		<Section title="Collections" tone="reason" summary="3">
			<div class="kin-grid" style="--kin-grid-min: 14rem">
				{#each collections as collection (collection.id)}
					<Card
						title={collection.name}
						meta={collection.caption}
						href={`#${current}`}
						density="compact"
					>
						<p class="kin-card__text">A collection of entries kept together.</p>
					</Card>
				{/each}
			</div>
		</Section>

		<Section title="Notes">
			<Notice tone="warning" title="Two entries are behind"
				>They were read before the last survey.</Notice
			>
		</Section>
	</Page>
</Shell>

<Dialog
	bind:open={creating}
	title="New entry"
	description="It joins the library at once."
	busy={saving}
	onsubmit={create}
	id="create-dialog"
>
	<Field label="Name" required>
		<Input bind:value={name} id="entry-name" />
	</Field>
	{#snippet footer({ form, close })}
		<Button variant="ghost" onclick={close}>Cancel</Button>
		<Button variant="primary" type="submit" {form}
			>{saving ? "Adding…" : "Add entry"}</Button
		>
	{/snippet}
</Dialog>

<Drawer bind:open={inspecting} title="Inspector" id="inspector">
	<p>
		{entries.length} entries, {narrow ? "narrow" : "wide"}, {folded
			? "folded"
			: "unfolded"}.
	</p>
</Drawer>

<ConfirmHost />
<Toaster />
