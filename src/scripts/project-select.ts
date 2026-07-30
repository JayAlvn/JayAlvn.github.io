// Second-level navigation inside the Projects section: the panel opens on
// a shelf of cards, and picking one swaps the shelf for that project's
// write-up. Every write-up is already in the DOM (see ProjectsPanel.astro)
// — this only decides which one is showing.
//
// The corner Back button and Escape both step back one level rather than
// leaving the section outright; scene-dive.ts consults isProjectOpen() to
// know which of the two it is being asked for.
const panel = document.querySelector<HTMLElement>('.panel-projects');
const details = [...document.querySelectorAll<HTMLElement>('.project')];
const cards = [...document.querySelectorAll<HTMLButtonElement>('.project-card')];

// `hidden` (display: none) rather than a fade: it restarts the write-up's
// entry animation each time one is opened, and keeps the hidden articles
// out of the tab order and off the scroll height.
//
// `quick` picks which fuse the shelf comes back on. Its stagger is timed
// to the tab's dive, which the arrival has to wait out — but moving
// between the shelf and a write-up has no dive in front of it, and
// holding the cards invisible for that long reads as the click having
// been dropped.
function show(id: string | null, quick: boolean) {
	details.forEach((d) => {
		const hide = d.id !== id;
		// display: none does NOT pause media — a demo left running would keep
		// its audio going from an article nobody can see. Pause on the way
		// out, keeping the playhead so returning resumes where it left off
		if (hide && !d.hidden) {
			d.querySelectorAll('video').forEach((v) => v.pause());
		}
		d.hidden = hide;
	});
	panel?.classList.toggle('project-open', id !== null);
	panel?.classList.toggle('shelf-quick', quick);
	// the shelf and a write-up are different heights; whichever you land on
	// should start at its top
	window.scrollTo(0, 0);
}

export function isProjectOpen() {
	return panel?.classList.contains('project-open') ?? false;
}

/** back to the shelf from a write-up — responds immediately */
export function closeProject() {
	show(null, true);
}

/** the section's resting state, arriving on the tab's dive */
export function resetProjects() {
	show(null, false);
}

cards.forEach((card) => {
	card.addEventListener('click', () => show(card.dataset.project!, true));
});
