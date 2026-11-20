import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compileModule } from "svelte/compiler";

// The layer's rune modules, compiled as a consumer's build compiles them,
// for the server and for the browser. They are written under dist/ so that
// `svelte` resolves from this checkout.
const root = fileURLToPath(new URL("../../", import.meta.url));
const out = path.join(root, "dist/unit-stores");

async function load(name, generate) {
	const source = await readFile(path.join(root, "src/svelte", name), "utf8");
	const { js } = compileModule(source, { generate, filename: name });
	const file = path.join(out, generate, name);
	await mkdir(path.dirname(file), { recursive: true });
	await writeFile(file, js.code);
	return import(`${pathToFileURL(file).href}?${Date.now()}`);
}

test.after(() => rm(out, { recursive: true, force: true }));

// A broken store can leave a promise pending forever; fail rather than hang.
const bounded = { timeout: 5000 };

test(
	"on the server, toast() raises nothing and confirm() answers no",
	bounded,
	async () => {
		assert.equal(typeof globalThis.window, "undefined");
		const toasts = await load("toast.svelte.js", "server");
		assert.equal(toasts.toast({ title: "Signed in as alice" }), 0);
		assert.equal(toasts.toasts.length, 0);
		const confirms = await load("confirm.svelte.js", "server");
		assert.equal(await confirms.confirm({ title: "Go?", action: "Go" }), false);
		assert.equal(confirms.pending.request, null);
	},
);

test(
	"in the browser, a confirmation is the request until it is answered",
	bounded,
	async (t) => {
		globalThis.window = globalThis;
		t.after(() => delete globalThis.window);
		const { confirm, pending } = await load("confirm.svelte.js", "client");

		const first = confirm({ title: "Delete A?", action: "Delete A" });
		const asked = pending.request;
		assert.ok(asked);
		assert.equal(asked.title, "Delete A?");
		asked.answer(true);
		assert.equal(await first, true);
		assert.equal(pending.request, null, "an answered request is cleared");

		// A new request answers the one before it with no.
		const a = confirm({ title: "A?", action: "A" });
		const b = confirm({ title: "B?", action: "B" });
		assert.equal(await a, false);
		assert.equal(pending.request?.title, "B?");
		pending.request?.answer(true);
		assert.equal(await b, true);
		assert.equal(pending.request, null);
	},
);

test("in the browser, a toast arrives, leaves and goes", bounded, async (t) => {
	globalThis.window = globalThis;
	t.after(() => delete globalThis.window);
	const { toast, toasts, dismiss, remove } = await load(
		"toast.svelte.js",
		"client",
	);
	const info = toast({ title: "Saved" });
	const failure = toast({ title: "Push rejected", tone: "error" });
	assert.ok(info > 0 && failure > info);
	assert.equal(toasts.length, 2);
	assert.equal(toasts[0]?.duration, 5000);
	assert.equal(toasts[1]?.duration, 0, "an error stays until dismissed");
	dismiss(info);
	assert.equal(toasts[0]?.leaving, true);
	remove(info);
	assert.deepEqual(
		toasts.map((item) => item.title),
		["Push rejected"],
	);
});
