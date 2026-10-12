import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

// All requests are fulfilled from local source/build bytes. No server, service,
// account, or consumer checkout is involved, and unknown requests are refused.
export async function serve(page, html) {
	await page.route("**/*", async (route) => {
		const url = new URL(route.request().url());
		if (url.origin !== "http://design.test") return route.abort();
		if (url.pathname === "/fixture") {
			return route.fulfill({ contentType: "text/html", body: html });
		}
		const source =
			url.pathname.startsWith("/src/styles/") ||
			url.pathname.startsWith("/assets/fonts/");
		const base = source ? root : path.join(root, "examples/reference/dist");
		const name = decodeURIComponent(url.pathname).replace(/^\//, "");
		const file = path.resolve(
			base,
			name.endsWith("/") ? `${name}index.html` : name,
		);
		if (!file.startsWith(`${base}/`)) return route.abort();
		const types = {
			".css": "text/css",
			".js": "text/javascript",
			".html": "text/html",
			".woff2": "font/woff2",
			".svg": "image/svg+xml",
		};
		try {
			await route.fulfill({
				body: await readFile(file),
				contentType: types[path.extname(file)] || "application/octet-stream",
			});
		} catch {
			await route.abort();
		}
	});
}
