import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
			const selectors = css.replace(/@layer[^;{]*/g, "");
			const classes = [...selectors.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(
				(match) => match[1],
			);
			for (const className of classes) {
				check(
					className.startsWith("kin-"),
					`${item.name}: public registry class lacks kin- prefix: ${className}`,
				);
			}
			for (const match of css.matchAll(
				/(?:^|[\s{;])(--[a-zA-Z_][\w-]*)\s*:/g,
			)) {
				check(
					match[1].startsWith("--kin-"),
					`${item.name}: unscoped property ${match[1]}`,
				);
			}
			for (const match of css.matchAll(/@keyframes\s+([\w-]+)/g)) {
				check(
					match[1].startsWith("kin-"),
					`${item.name}: unscoped animation ${match[1]}`,
				);
			}
			for (const match of css.matchAll(/@layer\s+([^;{]+)/g)) {
				check(
					match[1].trim().startsWith("kinra."),
					`${item.name}: unscoped layer ${match[1]}`,
				);
			}
		}

		// Optional pattern modules must parse and import outside a browser:
		// loading source never starts DOM work before the consumer asks for it.
		if (file.endsWith(".js") && (await exists(file))) {
			try {
				await import(pathToFileURL(path.join(root, file)).href);
			} catch (error) {
				check(
					false,
					`${item.name}: module must import without a browser: ${error.message}`,
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
	"./page.css",
	"./prose.css",
	"./shell.css",
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

/*
 * The optional Svelte layer (docs/svelte.md) ships source, so its contract is
 * checked here: every component and helper is exported and typed, nothing
 * styles itself or names a class outside kin-, and nothing reaches outside
 * the package or into a framework the layer does not require.
 */
const svelteRoot = path.join(root, "src/svelte");
const svelteFiles = await readdir(svelteRoot);
const barrel = await readFile(path.join(svelteRoot, "index.js"), "utf8");
const barrelTypes = await readFile(path.join(svelteRoot, "index.d.ts"), "utf8");
const svelteExport = packageJson.exports["./svelte"] ?? {};
check(
	packageJson.files.includes("src/svelte"),
	"package files must include src/svelte",
);
check(
	svelteExport.types === "./src/svelte/index.d.ts" &&
		svelteExport.svelte === "./src/svelte/index.js" &&
		svelteExport.default === "./src/svelte/index.js",
	"package must export ./svelte with types, svelte and default conditions",
);
check(
	packageJson.peerDependenciesMeta?.svelte?.optional === true,
	"svelte must stay an optional peer: the CSS needs no framework",
);
for (const file of svelteFiles) {
	const source = await readFile(path.join(svelteRoot, file), "utf8");
	if (file.endsWith(".svelte")) {
		const name = file.replace(/\.svelte$/, "");
		const line = `export { default as ${name} } from "./${file}";`;
		check(barrel.includes(line), `src/svelte/index.js omits ${name}`);
		check(barrelTypes.includes(line), `src/svelte/index.d.ts omits ${name}`);
		check(
			!/^<style[\s>]/m.test(source.replace(/<!--[\s\S]*?-->/g, "")),
			`src/svelte/${file} styles itself; styles belong to the CSS entry points`,
		);
		check(
			/<script lang="ts"/.test(source),
			`src/svelte/${file} needs <script lang="ts">`,
		);
		for (const match of source.matchAll(/\bclass="([^"{]*)"/g)) {
			for (const name of match[1].split(/\s+/).filter(Boolean)) {
				check(
					name.startsWith("kin-"),
					`src/svelte/${file}: class lacks kin- prefix: ${name}`,
				);
			}
		}
	}
	if (/\.(svelte|js)$/.test(file)) {
		for (const match of source.matchAll(
			/\bimport\s[^;]*?from\s+["']([^"']+)["']/g,
		)) {
			const target = match[1];
			check(
				target.startsWith("./") ||
					target === "svelte" ||
					target.startsWith("svelte/"),
				`src/svelte/${file} imports ${target}; the layer needs only Svelte`,
			);
		}
	}
	if (file.endsWith(".js") && file !== "index.js") {
		const types = file.replace(/\.js$/, ".d.ts");
		check(
			svelteFiles.includes(types),
			`src/svelte/${file} needs ${types}: consumers must not type-check its source`,
		);
	}
}

/*
 * The public tokens are a contract. scripts/public-tokens.json lists every
 * custom property tokens.css defines, so no token is renamed, dropped or
 * added without a deliberate change to the list.
 */
const LIST = "scripts/public-tokens.json";
const tokenList = JSON.parse(await readFile(path.join(root, LIST), "utf8"));
const listed = Array.isArray(tokenList.tokens) ? tokenList.tokens : [];
const listedNames = listed.map((token) => token?.name);
const byName = new Map(listed.map((token) => [token?.name, token]));
const VERSION = /^\d+\.\d+\.\d+$/;
const FIELDS = new Set(["name", "since", "deprecated", "use"]);
check(listed.length > 0, `${LIST} must list the public tokens`);
for (const [index, token] of listed.entries()) {
	const entry = typeof token === "object" && token !== null ? token : {};
	const name = entry.name;
	check(
		typeof name === "string" && /^--kin-[a-z0-9-]+$/.test(name),
		`${LIST}: token ${index} needs a --kin- name`,
	);
	for (const field of Object.keys(entry))
		check(FIELDS.has(field), `${LIST}: ${name} has an unknown field ${field}`);
	check(
		VERSION.test(entry.since),
		`${LIST}: ${name} needs since, the release it first shipped in`,
	);
	if ("deprecated" in entry) {
		check(
			VERSION.test(entry.deprecated),
			`${LIST}: ${name} must name the release that deprecated it`,
		);
		const instead = byName.get(entry.use);
		check(
			instead && !instead.deprecated,
			`${LIST}: deprecated ${name} must name a current token to use instead`,
		);
	} else {
		check(
			!("use" in entry),
			`${LIST}: ${name} names a token to use instead, but is not deprecated`,
		);
	}
	if (index > 0)
		check(
			listedNames[index - 1] < name,
			`${LIST}: ${name} is out of order or repeated; keep the list sorted by name`,
		);
}
const tokensCss = stripStrings(
	stripComments(
		await readFile(path.join(root, "src/styles/tokens.css"), "utf8"),
	),
);
const defined = new Set(
	[...tokensCss.matchAll(/(?:^|[\s{;])(--kin-[\w-]+)\s*:/g)].map(
		(match) => match[1],
	),
);
for (const name of listedNames) {
	check(
		typeof name !== "string" || defined.has(name),
		`src/styles/tokens.css no longer defines ${name}, which ${LIST} lists as public. Removing or renaming a token breaks the products that read it: restore it, or deprecate it first (keep its value and set "deprecated" and "use" in the list), and remove it from both files only after at least one minor release, with a migration note.`,
	);
}
for (const name of defined) {
	check(
		byName.has(name),
		`src/styles/tokens.css defines ${name}, which ${LIST} does not list. Every token tokens.css defines is public: add it to the list in name order, with "since" set to the release it first ships in, or keep it out of tokens.css.`,
	);
}

/*
 * @kinra/web/motion reads the motion terms where an element stands. It ships
 * source with a hand-written motion.d.ts, loads outside a browser, and its
 * types name every term tokens.css pairs with a curve.
 */
check(
	packageJson.files.includes("src/motion"),
	"package files must include src/motion",
);
check(
	packageJson.exports["./motion"] === "./src/motion/motion.js",
	"package must export ./motion as ./src/motion/motion.js",
);
const motionTypes = await readFile(
	path.join(root, "src/motion/motion.d.ts"),
	"utf8",
);
let reader;
try {
	reader = await import(
		pathToFileURL(path.join(root, "src/motion/motion.js")).href
	);
} catch (error) {
	check(
		false,
		`src/motion/motion.js must import without a browser: ${error.message}`,
	);
}
const typed = new Set(
	[...motionTypes.matchAll(/export (?:declare )?function (\w+)\(/g)].map(
		(match) => match[1],
	),
);
for (const name of reader ? Object.keys(reader) : []) {
	check(
		typed.has(name),
		`src/motion/motion.d.ts must declare ${name}(): consumers must not type-check the source`,
	);
}
for (const name of reader ? typed : []) {
	check(
		typeof reader[name] === "function",
		`src/motion/motion.d.ts declares ${name}(), which src/motion/motion.js does not export`,
	);
}
// The string literals of a union type the declarations export.
const union = (type) => {
	const body =
		new RegExp(`export type ${type} =([^;]+);`).exec(motionTypes)?.[1] ?? "";
	return new Set([...body.matchAll(/"([\w-]+)"/g)].map((match) => match[1]));
};
const terms = union("Term");
const paired = [...defined]
	.filter((name) => name.startsWith("--kin-motion-"))
	.filter((name) => !byName.get(name)?.deprecated)
	.map((name) => name.slice("--kin-motion-".length));
for (const term of paired) {
	check(
		terms.has(term),
		`src/motion/motion.d.ts: Term omits ${term}, which tokens.css pairs as --kin-motion-${term}`,
	);
}
for (const term of terms) {
	check(
		paired.includes(term),
		`src/motion/motion.d.ts: Term names ${term}, but tokens.css defines no --kin-motion-${term}`,
	);
}
for (const loop of union("Loop")) {
	check(
		terms.has(loop),
		`src/motion/motion.d.ts: Loop names ${loop}, which is not a term`,
	);
}

if (failures.length > 0) {
	console.error("Design contract check failed:");
	for (const failure of failures) console.error(`- ${failure}`);
	process.exitCode = 1;
} else {
	console.log(
		`Design contract check passed (${items.length} registry items, ${styleFiles.length} style files, ${listed.length} public tokens).`,
	);
}
