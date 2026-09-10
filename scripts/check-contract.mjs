import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const failures = [];

function check(condition, message) {
	if (!condition) failures.push(message);
}

async function exists(relativePath) {
	try {
		await access(path.join(root, relativePath));
		return true;
	} catch {
		return false;
	}
}

function stripComments(css) {
	return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function stripStrings(css) {
	return css.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""');
}

const packageJson = JSON.parse(
	await readFile(path.join(root, "package.json"), "utf8"),
);
const registry = JSON.parse(
	await readFile(path.join(root, "registry/registry.json"), "utf8"),
);

check(
	packageJson.files.includes("registry"),
	"package files must include registry",
);
for (const publicDocument of ["CHANGELOG.md", "README.md", "STATUS.md"]) {
	check(
		packageJson.files.includes(publicDocument),
		`package files must include ${publicDocument}`,
	);
}
check(
	packageJson.exports["./registry"] === "./registry/registry.json",
	"package must export the registry manifest",
);
check(
	packageJson.exports["./registry/*"] === "./registry/*",
	"package must export registry item source",
);
check(registry.schemaVersion === 1, "registry schemaVersion must be 1");
check(Array.isArray(registry.items), "registry items must be an array");

const names = new Set();
const statuses = new Set(["candidate", "stable", "deprecated"]);
const items = Array.isArray(registry.items) ? registry.items : [];

for (const item of items) {
	const evidence = Array.isArray(item.evidence) ? item.evidence : [];
	const requirements = Array.isArray(item.requires) ? item.requires : [];
	const files = Array.isArray(item.files) ? item.files : [];

	check(
		typeof item.name === "string" && item.name.length > 0,
		"item needs a name",
	);
	check(
		!names.has(item.name),
		`registry item name is duplicated: ${item.name}`,
	);
	names.add(item.name);
	check(item.kind === "pattern", `${item.name}: unsupported kind ${item.kind}`);
	check(
		statuses.has(item.status),
		`${item.name}: unsupported status ${item.status}`,
	);
	check(
		typeof item.description === "string" && item.description.length > 0,
		`${item.name}: description is required`,
	);
	check(
		evidence.length > 0,
		`${item.name}: evidence must name at least one real consumer`,
	);
	if (item.status === "stable") {
		check(
			evidence.length >= 2,
			`${item.name}: stable items require evidence from two consumers`,
		);
	}
	check(
		requirements.length > 0,
		`${item.name}: requires must name its stable style entry points`,
	);
	check(
		files.length >= 3,
		`${item.name}: expected source, style, and guidance files`,
	);

	for (const requirement of requirements) {
		check(
			requirement.startsWith("@kinra/web/styles/"),
			`${item.name}: requirement must be a public @kinra/web style entry point`,
		);
		const stylePath = requirement.replace("@kinra/web/styles/", "src/styles/");
		check(await exists(stylePath), `${item.name}: missing ${requirement}`);
	}

	for (const file of files) {
		check(
			file.startsWith(`registry/patterns/${item.name}/`),
			`${item.name}: file is outside its pattern directory: ${file}`,
		);
		check(await exists(file), `${item.name}: missing ${file}`);

		if (file.endsWith(".css") && (await exists(file))) {
			const css = stripStrings(
				stripComments(await readFile(path.join(root, file), "utf8")),
			);
			const classes = [...css.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(
				(match) => match[1],
			);
			for (const className of classes) {
				check(
					className.startsWith("kin-"),
					`${item.name}: public registry class lacks kin- prefix: ${className}`,
				);
			}
		}

		if (file.endsWith(".html") && (await exists(file))) {
			const html = await readFile(path.join(root, file), "utf8");
			for (const attribute of html.matchAll(/class="([^"]+)"/g)) {
				for (const className of attribute[1].split(/\s+/)) {
					check(
						className.startsWith("kin-"),
						`${item.name}: source class lacks kin- prefix: ${className}`,
					);
				}
			}
		}
	}
}

/*
 * Every shipped style entry point must be part of the complete import, and
 * every class, custom property definition, and keyframe name it declares
 * must live in the kin- namespace.
 */
const styleEntries = [
	"./base.css",
	"./canvas.css",
	"./recipes.css",
	"./type.css",
	"./compositions.css",
	"./components.css",
	"./navigation.css",
	"./feedback.css",
	"./overlays.css",
	"./data.css",
	"./prose.css",
];
const indexCss = await readFile(
	path.join(root, "src/styles/index.css"),
	"utf8",
);
for (const entry of styleEntries) {
	check(
		indexCss.includes(`@import \"${entry}\";`),
		`full styles omit ${entry}`,
	);
}

const styleFiles = (await readdir(path.join(root, "src/styles"))).filter(
	(file) => file.endsWith(".css"),
);
for (const file of styleFiles) {
	if (file !== "index.css" && file !== "tokens.css") {
		check(
			styleEntries.includes(`./${file}`),
			`src/styles/${file} is shipped but not imported by index.css`,
		);
	}
	const css = stripStrings(
		stripComments(await readFile(path.join(root, "src/styles", file), "utf8")),
	);
	const selectors = css.replace(/@layer[^;{]*/g, "");
	for (const match of selectors.matchAll(/\.([a-zA-Z_][\w-]*)/g)) {
		check(
			match[1].startsWith("kin-"),
			`src/styles/${file}: class lacks kin- prefix: .${match[1]}`,
		);
	}
	for (const match of css.matchAll(/(?:^|[\s{;])(--[a-zA-Z_][\w-]*)\s*:/g)) {
		check(
			match[1].startsWith("--kin-"),
			`src/styles/${file}: custom property lacks kin- prefix: ${match[1]}`,
		);
	}
	for (const match of css.matchAll(/@keyframes\s+([\w-]+)/g)) {
		check(
			match[1].startsWith("kin-"),
			`src/styles/${file}: keyframes lack kin- prefix: ${match[1]}`,
		);
	}
	for (const match of css.matchAll(/@layer\s+([^;{]+)/g)) {
		for (const layer of match[1].split(",")) {
			check(
				layer.trim().startsWith("kinra."),
				`src/styles/${file}: cascade layer outside kinra namespace: ${layer.trim()}`,
			);
		}
	}
}

if (failures.length > 0) {
	console.error("Design contract check failed:");
	for (const failure of failures) console.error(`- ${failure}`);
	process.exitCode = 1;
} else {
	console.log(
		`Design contract check passed (${items.length} registry items, ${styleFiles.length} style files).`,
	);
}
