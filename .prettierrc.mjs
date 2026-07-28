/** @type {import("prettier").Config} */
export default {
	plugins: ["prettier-plugin-astro"],
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
	],
};
