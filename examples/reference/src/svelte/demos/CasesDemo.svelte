<!--
The hard cases the layer has to get right, one per specimen: guarded and
busy dialogs, a dialog removed while open, a confirmation replaced while the
reader is on its action, toasts that hold focus, and a row that only reads.
-->
<script lang="ts">
	import {
		Button,
		ConfirmHost,
		Dialog,
		Field,
		Input,
		List,
		Loading,
		Row,
		Switch,
		Toaster,
		confirm,
		toast,
	} from "@kinra/web/svelte";
	import Specimen from "../Specimen.svelte";

	let guarded = $state(false);
	let mayClose = $state(false);
	let asked = $state(0);

	let saving = $state(false);
	let failing = $state(false);
	let fails = $state(0);
	let note = $state("");

	let removable = $state(true);
	let removableOpen = $state(false);
	let removedSays = $state("Open");

	let answers = $state<string[]>([]);
	let reading = $state(true);

	async function save() {
		saving = true;
		await new Promise((resolve) => setTimeout(resolve, 300));
		saving = false;
		fails++;
	}

	async function twice() {
		const first = confirm({
			title: "Delete the draft?",
			action: "Delete draft",
			tone: "error",
		});
		setTimeout(() => {
			void confirm({
				title: "Delete the whole library?",
				body: "Every entry goes, and its history with it.",
				action: "Delete everything",
				tone: "error",
			}).then((value) => answers.push(`library ${value}`));
		}, 400);
		answers.push(`draft ${await first}`);
	}
</script>

<Specimen
	title="A guarded dialog"
	contract="Dialog · canClose"
	description="Escape asks the guard every time, and the platform's own cancel never gets past it."
>
	<Button id="open-guarded" onclick={() => (guarded = true)}
		>Open guarded</Button
	>
	<Dialog
		bind:open={guarded}
		title="Unsaved note"
		id="guarded"
		canClose={() => {
			asked++;
			return mayClose;
		}}
	>
		<Switch bind:checked={mayClose} id="may-close">Let it close</Switch>
		<p class="kin-caption" id="guard-asked">Asked {asked} times</p>
	</Dialog>
</Specimen>

<Specimen
	title="A busy form"
	contract="Dialog · onsubmit · busy"
	description="While it saves, the fields wait, the title holds focus, and a second submit does nothing; when it fails, focus goes back."
>
	<Button id="open-busy" onclick={() => (failing = true)}>Open form</Button>
	<Dialog
		bind:open={failing}
		title="Add a note"
		busy={saving}
		onsubmit={save}
		id="busy"
	>
		<Field label="Note" for="busy-note"><Input bind:value={note} /></Field>
		<p class="kin-caption" id="busy-saves">Saved {fails} times</p>
		{#snippet footer({ form })}
			<Button variant="primary" type="submit" {form} id="busy-submit"
				>{saving ? "Saving…" : "Save"}</Button
			>
		{/snippet}
	</Dialog>
</Specimen>

<Specimen
	title="A dialog removed while open"
	contract="Dialog · onclose"
	description="Removing an open dialog still gives focus back and says it closed."
>
	<Button
		id="open-removable"
		onclick={() => {
			removable = true;
			removableOpen = true;
			removedSays = "Open";
		}}>Open removable</Button
	>
	<p class="kin-caption" id="removed-says">{removedSays}</p>
	{#if removable}
		<Dialog
			bind:open={removableOpen}
			title="Remove me"
			id="removable"
			onclose={() => (removedSays = "Closed")}
		>
			<Button id="remove-dialog" onclick={() => (removable = false)}
				>Delete this item</Button
			>
		</Dialog>
	{/if}
</Specimen>

<Specimen
	title="A confirmation replaced"
	contract="confirm() · ConfirmHost"
	description="A request that replaces one on screen moves focus back to the way back."
>
	<Button id="confirm-twice" onclick={twice}>Delete, then clear</Button>
	<p class="kin-caption" id="answers">{answers.join(", ") || "No answers"}</p>
</Specimen>

<Specimen
	title="Toasts that hold focus"
	contract="toast() · Toaster"
	description="Focus and the pointer each hold a toast; a dismissed toast hands focus on."
>
	<div class="kin-cluster" data-space="compact">
		<Button
			id="raise-two"
			onclick={() => {
				toast({ title: "First", body: "One of two." });
				toast({ title: "Second", body: "Two of two." });
			}}>Raise two</Button
		>
		<Button id="raise-one" onclick={() => toast({ title: "Only" })}
			>Raise one</Button
		>
	</div>
</Specimen>

<Specimen
	title="Rows that read"
	contract="Row · List · Loading"
	description="A row without href or onopen lays its title over its caption; a loading shape says what it waits for."
>
	<List variant="bounded" id="reading-rows">
		<Row
			title="A very long title that should end in an ellipsis rather than overflow its row"
			caption="Its caption"
			id="reading-row"
		>
			{#snippet after()}<p class="kin-caption" id="reading-after">
					Beneath it.
				</p>{/snippet}
		</Row>
	</List>
	<Switch bind:checked={reading} id="loading-switch">Reading</Switch>
	<Loading active={reading} label="Reading the library" id="loading" />
</Specimen>

<ConfirmHost />
<Toaster />
