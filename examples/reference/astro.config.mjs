import { defineConfig } from "astro/config";

export default defineConfig({
	output: "static",
	vite: {
		server: {
			// Let the dev catalog be reviewed over a tailnet via `tailscale serve`.
			allowedHosts: [".ts.net"],
		},
	},
});
