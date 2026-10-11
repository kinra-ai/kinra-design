import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./tests/browser",
	outputDir: "dist/browser-results",
	forbidOnly: true,
	retries: 0,
	use: { serviceWorkers: "block" },
	projects: [
		{ name: "chromium", use: { browserName: "chromium" } },
		{ name: "webkit", use: { browserName: "webkit" } },
	],
});
