import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";

export default defineConfig({
	output: "static",
	// The catalog renders the optional Svelte layer, `@kinra/web/svelte`, on the
	// server and hydrates it, as a SvelteKit consumer does.
	integrations: [svelte()],
	vite: {
		server: {
			// Let the dev catalog be reviewed over a tailnet via `tailscale serve`.
			allowedHosts: [".ts.net"],
		},
	},
});
