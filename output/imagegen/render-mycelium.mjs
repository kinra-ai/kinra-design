import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

// Original vector artwork: branching, reconnection, and intentional open space.
// Run from any directory with: node output/imagegen/render-mycelium.mjs
const here = new URL("./", import.meta.url);
const wordmark = await readFile(new URL("../../assets/wordmark.svg", here));
const size = 2048;
let seed = 94113;
const random = () => {
	seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
	return seed / 4294967296;
};
const round = (n) => Number(n.toFixed(2));
const branches = [];
const junctions = [];

function grow(x, y, angle, length, depth, colony, entryAngle = angle) {
	const bend = (random() - 0.5) * 0.34;
	const endAngle = angle + bend;
	const ex = x + Math.cos(endAngle) * length;
	const ey = y + Math.sin(endAngle) * length;
	const c1x = x + Math.cos(entryAngle) * length * 0.32;
	const c1y = y + Math.sin(entryAngle) * length * 0.32;
	const c2x = ex - Math.cos(endAngle + bend) * length * 0.35;
	const c2y = ey - Math.sin(endAngle + bend) * length * 0.35;
	const width = 1.3 + depth * 0.4;
	const opacity = 0.36 + (1 - depth / 6) * 0.3;
	branches.push(
		`<path d="M${round(x)} ${round(y)} C${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(ex)} ${round(ey)}" stroke-width="${round(width)}" opacity="${round(opacity)}"/>`,
	);
	junctions.push({ x: ex, y: ey, angle: endAngle, colony, depth });
	if (depth <= 0 || ey < 750 || ex < -180 || ex > 2228) return;
	const asymmetry = 0.85 + random() * 0.25;
	grow(
		ex,
		ey,
		endAngle - 0.25 - random() * 0.35,
		length * 0.74,
		depth - 1,
		colony,
		endAngle + bend,
	);
	grow(
		ex,
		ey,
		endAngle + 0.3 + random() * 0.3,
		length * 0.7 * asymmetry,
		depth - 1,
		colony,
		endAngle + bend,
	);
}

grow(-140, 1740, -0.51, 360, 5, 0);
grow(520, 2200, -1.13, 360, 5, 1);
grow(1400, 2190, -1.91, 330, 5, 2);
grow(2200, 1760, -2.7, 330, 5, 3);
grow(2120, 1120, -3.02, 250, 4, 4);

// Anastomosis: nearby branches reconnect; this is a field, not isolated trees.
const links = [];
const used = new Set();
for (let i = 0; i < junctions.length; i++) {
	if (links.length >= 16) break;
	const a = junctions[i];
	if (a.depth > 2 || a.y < 810 || used.has(i)) continue;
	let chosen = -1;
	let nearest = 250;
	for (let j = i + 1; j < junctions.length; j++) {
		const b = junctions[j];
		if (used.has(j) || a.colony === b.colony || b.depth > 3) continue;
		const distance = Math.hypot(a.x - b.x, a.y - b.y);
		if (distance > 60 && distance < nearest) {
			nearest = distance;
			chosen = j;
		}
	}
	if (chosen < 0) continue;
	const b = junctions[chosen];
	const reach = nearest * 0.5;
	links.push(
		`<path d="M${round(a.x)} ${round(a.y)} C${round(a.x + Math.cos(a.angle) * reach)} ${round(a.y + Math.sin(a.angle) * reach)} ${round(b.x + Math.cos(b.angle) * reach)} ${round(b.y + Math.sin(b.angle) * reach)} ${round(b.x)} ${round(b.y)}"/>`,
	);
	used.add(i);
	used.add(chosen);
}

const art = `
<defs>
  <linearGradient id="kin-ground" x1="0" y1="0" x2="0" y2="2048" gradientUnits="userSpaceOnUse">
    <stop stop-color="#171a20"/>
    <stop offset="0.55" stop-color="#101114"/>
    <stop offset="1" stop-color="#0c0d10"/>
  </linearGradient>
  <linearGradient id="kin-thread" x1="0" y1="780" x2="0" y2="2200" gradientUnits="userSpaceOnUse">
    <stop stop-color="#9ca6ae"/>
    <stop offset="0.55" stop-color="#717d86"/>
    <stop offset="1" stop-color="#35414c"/>
  </linearGradient>
</defs>
<rect width="2048" height="2048" fill="url(#kin-ground)"/>
<g fill="none" stroke="url(#kin-thread)" stroke-linecap="round" stroke-linejoin="round">
${branches.join("\n")}
<g stroke-width="1.5" opacity="0.5">${links.join("\n")}</g>
</g>`;

const logoWidth = 386.4;
const logoHeight = 72;
const logoX = (size - logoWidth) / 2;
const logoY = 620;
const logo = `<image x="${logoX}" y="${logoY}" width="${logoWidth}" height="${logoHeight}" preserveAspectRatio="xMidYMid meet" href="data:image/svg+xml;base64,${wordmark.toString("base64")}"/>`;
const svg = (
	withLogo,
) => `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048" viewBox="0 0 2048 2048">
<title>Kinra — mycelium</title>
<desc>Fine branching filaments reconnect across a graphite field, beneath an open area${withLogo ? " carrying the canonical Kinra wordmark" : ""}.</desc>
${art}
${withLogo ? logo : ""}
</svg>\n`;

await writeFile(new URL("kinra-pocketid-mycelium.svg", here), svg(false));
await writeFile(new URL("kinra-pocketid-mycelium-logo.svg", here), svg(true));
await sharp(Buffer.from(svg(true)), { density: 144 })
	.png()
	.toFile(new URL("kinra-pocketid-mycelium-logo.png", here).pathname);
console.log({
	branches: branches.length,
	reconnections: links.length,
	logoWidth,
	logoHeight,
	logoX,
	logoY,
});
