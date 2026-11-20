// The navigate specimen's own page (/motion/journey/), framed by the motion
// lab: rooms in a simple page, moved between by real view transitions. Onward
// and back slide the page the way the index runs; opening zooms in from where
// the reader touched, and returning zooms back out. The bar holds still.
//
// The term is read where it stands, on the document: at 0ms (productive, or
// less motion) no view transition starts and the new room is simply there.
// The lab posts its speed, `{ type: "kin-lab-speed", rate }`, and its
// simulated less motion, `{ type: "kin-lab-less", less }`.

type Way = "onward" | "back" | "open" | "return";

/** A duration as the browser, or a minifier, writes it, in ms. */
function toMs(value: string): number {
	const text = value.trim();
	const number = parseFloat(text);
	if (!Number.isFinite(number)) return 0;
	return text.endsWith("ms") ? number : number * 1000;
}

/** Start the rooms on /motion/journey/. */
export function startJourney(): void {
	const root = document.documentElement;
	const rooms = Array.from(
		document.querySelectorAll<HTMLElement>("[data-journey-room]"),
	);
	const details = Array.from(
		document.querySelectorAll<HTMLElement>("[data-journey-detail]"),
	);
	const where = document.querySelector<HTMLElement>("[data-journey-where]")!;
	let room = 0;
	let open = false;
	let rate = 1;
	let less = false;
	let navigations = 0;

	// Every animation on the page plays at the lab's rate, the view
	// transition's pseudo-elements among them.
	function applyRate() {
		for (const animation of document.getAnimations()) {
			animation.playbackRate = rate;
		}
	}

	addEventListener("message", (event) => {
		if (event.origin !== location.origin || event.source !== parent) return;
		const data: unknown = event.data;
		if (typeof data !== "object" || data === null) return;
		const message = data as { type?: unknown; rate?: unknown; less?: unknown };
		if (message.type === "kin-lab-speed") {
			const next = Number(message.rate);
			if (!Number.isFinite(next) || next <= 0) return;
			rate = next;
			applyRate();
		} else if (message.type === "kin-lab-less") {
			less = message.less === true;
		}
	});

	// Where the reader touched: the pointer, or the button's centre when a key
	// pressed it. A zoom grows from there, as a fraction of the window.
	addEventListener(
		"click",
		(event) => {
			const target = (event.target as Element | null)?.closest?.(
				"[data-journey-go]",
			);
			if (!target) return;
			const box = target.getBoundingClientRect();
			const x = event.detail === 0 ? box.left + box.width / 2 : event.clientX;
			const y = event.detail === 0 ? box.top + box.height / 2 : event.clientY;
			root.style.setProperty(
				"--journey-origin",
				`${((x / innerWidth) * 100).toFixed(1)}% ${((y / innerHeight) * 100).toFixed(1)}%`,
			);
		},
		{ capture: true, passive: true },
	);

	function show(next: number, opening: boolean, way: Way) {
		rooms.forEach((section, index) => {
			section.hidden = opening || index !== next;
		});
		details.forEach((section, index) => {
			section.hidden = !opening || index !== next;
		});
		where.textContent = rooms[next]?.dataset.journeyName ?? "";
		room = next;
		open = opening;
		// Focus follows the reader into what opened and back to where it was
		// opened from; the bar's own buttons keep it.
		if (way === "open") {
			details[next]
				?.querySelector<HTMLElement>('[data-journey-go="return"]')
				?.focus();
		} else if (way === "return") {
			rooms[next]
				?.querySelector<HTMLElement>('[data-journey-go="open"]')
				?.focus();
		}
	}

	function go(way: Way) {
		if (way === "open" && open) return;
		if (way === "return" && !open) return;
		const next =
			way === "onward"
				? (room + 1) % rooms.length
				: way === "back"
					? (room - 1 + rooms.length) % rooms.length
					: room;
		const opening = way === "open";
		const update = () => show(next, opening, way);
		const duration = less
			? 0
			: toMs(
					getComputedStyle(root).getPropertyValue("--kin-duration-navigate"),
				);
		if (!duration || typeof document.startViewTransition !== "function") {
			update();
			return;
		}
		// A navigation's token keeps a late finish from clearing the next.
		const token = ++navigations;
		root.dataset.navigate = way;
		const transition = document.startViewTransition(update);
		transition.ready.then(applyRate, () => {});
		transition.finished
			.finally(() => {
				if (token === navigations) delete root.dataset.navigate;
			})
			.catch(() => {});
	}

	for (const button of document.querySelectorAll<HTMLElement>(
		"[data-journey-go]",
	)) {
		button.addEventListener("click", () => go(button.dataset.journeyGo as Way));
	}
}
