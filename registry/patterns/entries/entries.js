// Candidate entries, from Kinra Observatory at cd38936
// (frontend/src/lib/motion/inview.ts and frames.ts). See README.md for
// evidence and ownership. No dependencies, automatic initialization, global
// mutation or network use; nothing runs on import. Without this module, and
// before an instrument is seen, the instrument is whole: only decoration
// waits.

// The window an element is shown in, when it can tell what is on screen.
function viewOf(element) {
	const view = element.ownerDocument?.defaultView;
	return view && typeof view.IntersectionObserver === "function" ? view : null;
}

/** Whether any of `element` is inside its window's viewport now. */
function seen(element, view) {
	const box = element.getBoundingClientRect();
	return (
		(box.width > 0 || box.height > 0) &&
		box.bottom > 0 &&
		box.top < view.innerHeight &&
		box.right > 0 &&
		box.left < view.innerWidth
	);
}

/**
 * Runs `run` once, the first time `element` is seen: at once if it is on
 * screen now. Returns the cleanup, which cancels a run still waiting.
 */
export function firstSight(element, run) {
	const view = viewOf(element);
	if (!view || seen(element, view)) {
		run();
		return () => {};
	}
	let waiting = true;
	// Scroll events arrive before the frame that shows the new position is
	// painted, so an element jumped to (a link, a restored scroll) runs in the
	// very frame it first appears in, with no glimpse of it finished.
	const check = () => {
		if (seen(element, view)) release();
	};
	// A backstop for layout that brings it into view without a scroll.
	const observer = new view.IntersectionObserver((entries) => {
		if (entries.some((entry) => entry.isIntersecting)) release();
	});
	const forget = () => {
		if (!waiting) return;
		waiting = false;
		observer.disconnect();
		view.removeEventListener("scroll", check, { capture: true });
		view.removeEventListener("resize", check);
	};
	const release = () => {
		if (!waiting) return;
		forget();
		run();
	};
	view.addEventListener("scroll", check, { capture: true, passive: true });
	view.addEventListener("resize", check, { passive: true });
	observer.observe(element);
	return forget;
}

/**
 * Holds the CSS entries inside `element` until it is first seen, then lets
 * them play once from their start. An element already on screen, or shown
 * with less motion, is left alone. Returns the cleanup. As a Svelte
 * attachment: `<figure {@attach inview}>`.
 */
export function inview(element) {
	const view = viewOf(element);
	if (
		!view ||
		view.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
		seen(element, view)
	)
		return () => {};
	element.setAttribute("data-inview", "waiting");
	const stop = firstSight(element, () =>
		element.removeAttribute("data-inview"),
	);
	return () => {
		stop();
		element.removeAttribute("data-inview");
	};
}

/**
 * Calls `frame` on each animation frame while `element` is on screen and its
 * page is shown, with the frame's time and the seconds since the frame
 * before: 0 on the first frame after a start, and at most `maxDt`, so a loop
 * that resumes does not jump. `running` hears each start and stop. Returns
 * the cleanup.
 */
export function frames(element, frame, { maxDt = 0.1, running } = {}) {
	const page = element.ownerDocument;
	const view = page?.defaultView;
	if (!view) return () => {};
	let raf = 0;
	let last = null;
	let onScreen = false;
	const step = (now) => {
		const dt = last === null ? 0 : Math.min(maxDt, (now - last) / 1000);
		last = now;
		// Asked for before the frame runs, so a frame that stops the loop stops it.
		raf = view.requestAnimationFrame(step);
		frame(now, dt);
	};
	const update = () => {
		const run = onScreen && !page.hidden;
		if (run && !raf) {
			last = null;
			raf = view.requestAnimationFrame(step);
			running?.(true);
		} else if (!run && raf) {
			view.cancelAnimationFrame(raf);
			raf = 0;
			running?.(false);
		}
	};
	const observer =
		typeof view.IntersectionObserver === "function"
			? new view.IntersectionObserver((entries) => {
					// The latest entry says where the element is now.
					onScreen = entries[entries.length - 1].isIntersecting;
					update();
				})
			: null;
	if (observer) observer.observe(element);
	else {
		onScreen = true;
		update();
	}
	page.addEventListener("visibilitychange", update);
	return () => {
		observer?.disconnect();
		page.removeEventListener("visibilitychange", update);
		onScreen = false;
		update();
	};
}
