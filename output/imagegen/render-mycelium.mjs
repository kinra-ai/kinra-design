import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

// Original vector artwork: branching, reconnection, and intentional open space.
// Run from any directory with: node output/imagegen/render-mycelium.mjs
const here = new URL("./", import.meta.url);
const wordmark = await readFile(new URL("../../assets/wordmark.svg", here));
const size = 2048;
// Each route is drawn explicitly. Branches begin on named junctions, and
// their controls establish one continuous direction of growth.
// Three weights carry the hierarchy: trunks, branches, and terminal filaments.
const trunks = [
	// West: a long rise, a broad shoulder, then a gradual turn away from the mark.
	"M-120 2080 C40 2080 70 1930 180 1890 C290 1850 330 1830 420 1780 C510 1730 585 1710 620 1630 C655 1550 690 1520 680 1450",
	// East: a separate rise that joins the west beneath the central clearing.
	"M2180 2180 C2090 2070 1850 2000 1780 1870 C1710 1740 1570 1780 1460 1660 C1350 1540 1330 1470 1410 1370",
];
const branches = [
	// West crown.
	"M680 1450 C670 1380 650 1340 610 1290 C570 1240 475 1240 445 1180",
	"M180 1890 C205 1810 225 1740 205 1640 C185 1540 185 1550 155 1490",
	"M420 1780 C420 1680 400 1605 350 1540 C300 1475 255 1410 220 1360",
	"M620 1630 C690 1580 800 1590 860 1530 C920 1470 945 1450 980 1390",
	"M680 1450 C730 1410 790 1420 815 1360",
	// A single designed reconnection; both trees belong to the same network.
	"M420 1780 C510 1730 720 1725 840 1770 C960 1815 1290 1845 1460 1660",
	"M840 1770 C920 1815 930 1870 890 1950 C850 2030 815 2045 790 2110",
	// East crown and its outward branches.
	"M1410 1370 C1480 1285 1650 1280 1690 1160 C1705 1115 1695 1070 1670 1020",
	"M1780 1870 C1840 1780 1850 1660 1920 1600 C1990 1540 2050 1550 2110 1510",
	"M1460 1660 C1510 1580 1670 1605 1720 1500 C1745 1445 1735 1405 1750 1370",
	"M1410 1370 C1350 1430 1250 1430 1220 1520",
	"M1920 1600 C1890 1530 1860 1445 1885 1360",
	"M1780 1870 C1660 1810 1500 1900 1480 2020",
];
const tips = [
	// Forks inherit the curve of the parent; no floating twigs.
	"M445 1180 C425 1140 445 1080 420 1040",
	"M445 1180 C425 1140 370 1140 340 1090",
	"M610 1290 C630 1240 645 1170 625 1115 C610 1075 580 1045 580 1000",
	"M625 1115 C655 1090 680 1060 675 1015",
	"M155 1490 C125 1430 90 1440 60 1380",
	"M155 1490 C125 1450 45 1465 -15 1420",
	"M205 1640 C240 1605 270 1575 265 1520",
	"M220 1360 C195 1320 135 1330 110 1270",
	"M220 1360 C195 1320 230 1260 205 1220",
	"M350 1540 C365 1480 390 1450 370 1385",
	"M980 1390 C1000 1350 995 1310 1030 1280",
	"M980 1390 C1035 1390 1075 1380 1100 1335",
	"M860 1530 C910 1520 965 1550 1010 1505",
	"M815 1360 C830 1325 815 1290 845 1255",
	"M890 1950 C930 1990 1045 1985 1070 2070",
	"M1670 1020 C1650 980 1595 975 1575 925",
	"M1670 1020 C1650 980 1675 910 1650 875",
	"M1690 1160 C1740 1120 1800 1135 1840 1070",
	"M1840 1070 C1860 1035 1850 990 1880 960",
	"M1840 1070 C1880 1070 1915 1055 1930 1010",
	"M1750 1370 C1770 1320 1840 1310 1855 1240",
	"M1750 1370 C1770 1320 1720 1270 1750 1215",
	"M1885 1360 C1905 1290 1975 1270 1980 1205",
	"M1885 1360 C1905 1310 1850 1250 1870 1195",
	"M1220 1520 C1205 1560 1235 1600 1210 1645",
	"M1220 1520 C1190 1545 1140 1535 1115 1580",
	"M1480 2020 C1470 2075 1405 2100 1410 2160",
	"M1480 2020 C1470 2075 1510 2120 1490 2160",
];
const paths = (routes) => routes.map((d) => `<path d="${d}"/>`).join("\n");

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
<g stroke-width="3" opacity="0.65">${paths(trunks)}</g>
<g stroke-width="2.1" opacity="0.62">${paths(branches)}</g>
<g stroke-width="1.35" opacity="0.56">${paths(tips)}</g>
</g>`;

const logoWidth = 386.4;
const logoHeight = 72;
const logoX = (size - logoWidth) / 2;
const logoY = (size - logoHeight) / 2;
const logo = `<image x="${logoX}" y="${logoY}" width="${logoWidth}" height="${logoHeight}" preserveAspectRatio="xMidYMid meet" href="data:image/svg+xml;base64,${wordmark.toString("base64")}"/>`;
const svg = (
	withLogo,
) => `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048" viewBox="0 0 2048 2048">
<title>Kinra — mycelium</title>
<desc>Deliberate branching filaments frame an open center${withLogo ? " carrying the canonical Kinra wordmark" : ""}.</desc>
${art}
${withLogo ? logo : ""}
</svg>\n`;

await writeFile(new URL("kinra-pocketid-mycelium.svg", here), svg(false));
await writeFile(new URL("kinra-pocketid-mycelium-logo.svg", here), svg(true));
await sharp(Buffer.from(svg(true)), { density: 144 })
	.png()
	.toFile(new URL("kinra-pocketid-mycelium-logo.png", here).pathname);
console.log({
	trunks: trunks.length,
	branches: branches.length,
	tips: tips.length,
	logoWidth,
	logoHeight,
	logoX,
	logoY,
});
