/** @type {import("prettier").Config} */
export default {
	plugins: ["prettier-plugin-astro", "prettier-plugin-svelte"],
	useTabs: true,
	trailingComma: "all",
	overrides: [
		{
			files: ["*.json", "*.jsonc", "*.md", "*.yaml", "*.yml"],
			options: { useTabs: false },
		},
		{
			files: "*.astro",
			options: { parser: "astro" },
		},
		{
			files: "*.svelte",
			options: { parser: "svelte" },
		},
	],
};
