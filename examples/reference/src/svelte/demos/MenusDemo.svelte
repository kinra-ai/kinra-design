<script lang="ts">
	import {
		Button,
		ContextMenu,
		IconButton,
		List,
		Menu,
		Row,
		Switch,
		tip,
		told,
	} from "@kinra/web/svelte";
	import type { MenuEntry } from "@kinra/web/svelte";
	import Specimen from "../Specimen.svelte";

	let last = $state("Nothing chosen");
	let pinned = $state(true);
	let sort = $state("newest");
	let sortOpen = $state(false);
	let tips = $state(true);
	let files: ContextMenu;

	const wait = (ms: number) =>
		new Promise((resolve) => setTimeout(resolve, ms));
	const sorts = [
		{ value: "newest", label: "Newest first" },
		{ value: "oldest", label: "Oldest first" },
		{ value: "name", label: "By name" },
	];

	const actions: MenuEntry[] = $derived([
		{
			label: "Open",
			icon: openIcon,
			shortcut: "↵",
			onselect: () => (last = "Opened"),
		},
		{
			label: "Copy link",
			icon: copyIcon,
			done: "Copied",
			onselect: async () => {
				await wait(150);
				last = "Copied the link";
			},
		},
		{ label: "Rename", onselect: () => (last = "Renamed") },
		{ label: "Move", disabled: "Only the owner can move a session." },
		{
			label: "Pinned",
			icon: pinIcon,
			checked: pinned,
			onselect: () => (pinned = !pinned),
		},
		{ separator: true },
		{
			label: "Elsewhere",
			items: [
				{ label: "Read the guide", href: "#tips" },
				{
					label: "Kinra on GitHub",
					href: "https://github.com/kinra-ai",
					external: true,
				},
				{
					label: "Download the log",
					href: "/favicon.svg",
					download: "session.svg",
				},
			],
		},
		{ separator: true },
		{
			label: "Stop session",
			icon: stopIcon,
			tone: "error",
			onselect: () => (last = "Stopped"),
		},
	]);

	const sortItems: MenuEntry[] = $derived([
		{
			label: "Sort",
			items: sorts.map(({ value, label }) => ({
				label,
				role: "menuitemradio" as const,
				checked: sort === value,
				onselect: () => (sort = value),
			})),
		},
	]);

	function fileItems(name: string): MenuEntry[] {
		return [
			{ label: "Open", onselect: () => (last = `Opened ${name}`) },
			{
				label: "Copy path",
				done: "Copied",
				onselect: () => wait(150),
			},
			{
				label: "Send to printer",
				done: "Sent",
				onselect: async () => {
					await wait(150);
					last = "The printer is offline";
					throw new Error("offline");
				},
			},
			{ separator: true },
			{
				label: "Delete",
				tone: "error",
				onselect: () => (last = `Deleted ${name}`),
			},
		];
	}
</script>

{#snippet openIcon()}
	<svg
		viewBox="0 0 16 16"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"><path d="M6 3H3v10h10v-3M9 3h4v4M13 3L7 9" /></svg
	>
{/snippet}
{#snippet copyIcon()}
	<svg
		viewBox="0 0 16 16"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		><rect x="5" y="5" width="8" height="8" rx="1" /><path
			d="M11 5V3H3v8h2"
		/></svg
	>
{/snippet}
{#snippet pinIcon()}
	<svg
		viewBox="0 0 16 16"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"><path d="M6 2h4l-1 4 3 3H4l3-3zM8 9v5" /></svg
	>
{/snippet}
{#snippet stopIcon()}
	<svg
		viewBox="0 0 16 16"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"><rect x="4" y="4" width="8" height="8" rx="1" /></svg
	>
{/snippet}
{#snippet undoIcon()}
	<svg
		viewBox="0 0 16 16"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"><path d="M5 3L2 6l3 3M2 6h7a4 4 0 010 8H6" /></svg
	>
{/snippet}

<Specimen
	title="Menu"
	contract="Menu · label · items · trigger · open · open() · close()"
	description="A trigger and the menu it opens beneath itself, with every kind of item: icons, a shortcut, a done item, a reason, a checkbox, a labelled group of links and a destructive command. The product's own trigger opens a group of radios on the checked one."
>
	<div class="kin-stack" data-space="compact">
		<div class="kin-cluster" data-space="compact">
			<Menu label="Session actions" items={actions} id="actions-trigger" />
			<Menu label="Sort" items={sortItems} bind:open={sortOpen}>
				{#snippet trigger(attributes)}
					<Button {...attributes} id="sort-trigger"
						>{sorts.find((each) => each.value === sort)?.label}</Button
					>
				{/snippet}
			</Menu>
			<Button
				variant="quiet"
				id="sort-from-script"
				onclick={() => (sortOpen = true)}>Choose a sort</Button
			>
		</div>
		<p class="kin-caption" id="menu-state">
			{last} · {pinned ? "pinned" : "not pinned"} · {sort} · sort menu {sortOpen
				? "open"
				: "closed"}
		</p>
	</div>
</Specimen>

<Specimen
	title="Context menu"
	contract="ContextMenu · show(event, items) · close()"
	description="The same menu opened from script: at the pointer on a right-click, beneath the control otherwise. A done item that fails closes at once."
>
	<List variant="bounded" id="files">
		{#each ["notes.md", "plan.md"] as name (name)}
			<Row
				title={name}
				caption="Right-click, or use the menu key"
				onopen={() => (last = `Opened ${name}`)}
				mainProps={{
					oncontextmenu: (event: MouseEvent) =>
						void files.show(event, fileItems(name)),
				}}
			>
				{#snippet trail()}
					<IconButton
						label={`Actions for ${name}`}
						size="compact"
						aria-haspopup="menu"
						aria-expanded="false"
						onclick={(event) => void files.show(event, fileItems(name))}
						><svg
							viewBox="0 0 16 16"
							width="16"
							height="16"
							aria-hidden="true"
							fill="currentColor"
							><circle cx="3.5" cy="8" r="1.25" /><circle
								cx="8"
								cy="8"
								r="1.25"
							/><circle cx="12.5" cy="8" r="1.25" /></svg
						></IconButton
					>
				{/snippet}
			</Row>
		{/each}
	</List>
	<ContextMenu bind:this={files} label="File actions" id="file-menu" />
</Specimen>

<Specimen
	title="Tips"
	contract={"{@attach tip(text, hint?)} · {@attach told(text, hint?)}"}
	description="One shared tooltip in the top layer, after the pointer rests. It describes; the control keeps its own name. Leaving, a press, a scroll and Escape put it away."
>
	<div class="kin-stack" data-space="compact">
		<div class="kin-cluster" data-space="compact" id="tips">
			<IconButton
				label="Undo"
				id="tip-undo"
				{@attach tip(tips && "Undo", "Your last change")}
				>{@render undoIcon()}</IconButton
			>
			<Button
				id="tip-publish"
				{@attach tip(tips && "Publish the draft to the team")}>Publish</Button
			>
			<span
				class="kin-status"
				data-state="warning"
				id="tip-held"
				{@attach told(
					tips && "Held for review",
					"A person decides whether to release.",
				)}>Held</span
			>
			<time
				datetime="2026-11-20"
				id="tip-time"
				{@attach tip(tips && "20 November 2026")}>Today</time
			>
		</div>
		<Switch bind:checked={tips} id="tips-on">Tips on these controls</Switch>
	</div>
</Specimen>

<Specimen
	title="Right to left"
	contract="dir=rtl"
	description="A menu lines up with its control's inline start, which is its right edge right to left, and its tip stands above it."
>
	<div dir="rtl" class="kin-cluster" data-space="compact" id="rtl">
		<Menu
			label="إجراءات"
			id="rtl-trigger"
			{@attach tip(tips && "إجراءات")}
			items={[
				{ label: "فتح", onselect: () => (last = "فتح") },
				{ label: "نسخ", onselect: () => (last = "نسخ") },
				{ separator: true },
				{ label: "حذف", tone: "error" },
			]}
		/>
	</div>
</Specimen>
