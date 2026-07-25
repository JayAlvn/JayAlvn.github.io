// tab immersion: clicking a tab dives the camera (the .scene wrapper's CSS
// transform) into the menu, glides the chosen tab to the viewport corner,
// and reveals its content panel; the Back button reverses it. Also boots
// the starfall background, which runs at full rate throughout — the dive
// neither freezes nor slows it.
import { startTopologyBackground } from './topology-bg.js';
import { resetPhotoStrip } from './photo-strip';

// boot the starfall; it runs continuously and at full rate — clicking a tab
// neither freezes nor slows it, so the Projects spin-reversal is instant and
// the motion never waits on the tab's glide
startTopologyBackground(document.getElementById('vanta-bg')!);

// Contacts doesn't dive — it pops the social icons out from under
// itself instead of opening a panel — so dive behavior (active
// state, glide, aria-pressed, reset) covers only the other tabs
const diveTabs = [...document.querySelectorAll<HTMLButtonElement>('.tab')].filter(
	(t) => t.dataset.tab !== 'contacts'
);
const panels = document.querySelectorAll<HTMLElement>('.panel');
const backBtn = document.getElementById('back-btn')!;
const scene = document.getElementById('scene')!;

// `diving` marks the ~1.1s tab-glide window. It no longer throttles the
// starfall — that runs at full rate throughout; it only tells the sketch's
// slowness detector to ignore this window, so the transition's brief GPU load
// can't trip a false quality downgrade
let divingTimer: ReturnType<typeof setTimeout>;
function startDiveWindow() {
	document.body.classList.add('diving');
	clearTimeout(divingTimer);
	// fallback in case the transitionend event is missed
	divingTimer = setTimeout(endDiveWindow, 2000);
}

// clears the dive window once the tab settles, so the slowness detector
// resumes watching; the starfall's frame rate never changed
function endDiveWindow() {
	clearTimeout(divingTimer);
	document.body.classList.remove('diving');
}

scene.addEventListener('transitionend', (e) => {
	// transitionend bubbles from everything inside the scene, and the
	// tab-label hover is a `transform` on a child — only the travelling
	// tab's own glide marks the end of the dive
	const target = e.target as HTMLElement;
	if (e.propertyName === 'translate' && target.classList.contains('tab')) {
		endDiveWindow();
	}
});

// mirror of the travelling tab's immersion state — keep in sync with
// CSS. There is no camera any more: the menu used to zoom and tilt as
// a whole, but watching it swing and shrink around read as a glitch,
// so the tab alone carries the animation
const DIVE = {
	scale: 1.5, // .tab.active-tab growth on the way to the corner
	corner: { x: 40, y: 40 }, // where the sole tab lands (viewport px)
	durationMs: 1100, // --dive-duration
};

// the tab's slot in the resting menu — the frame the glide math is
// derived in. Suppressing the glide and growth inline and measuring in
// the same task means no paint and no transition can start, so this is
// invisible; a plain getBoundingClientRect would instead report the
// already-dived box and send the tab flying on every recompute
function restingRect(tab: HTMLElement) {
	const style = {
		translate: tab.style.translate,
		scale: tab.style.scale,
		transition: tab.style.transition,
	};
	// transitions off first: forcing layout below would otherwise start
	// one from each suppressed value and the tab would visibly wobble —
	// worse, the next measurement would read it mid-flight
	tab.style.transition = 'none';
	tab.style.translate = '';
	tab.style.scale = '1';
	const r = tab.getBoundingClientRect();
	tab.style.translate = style.translate;
	tab.style.scale = style.scale;
	// commit the restored values while transitions are still suppressed
	tab.getBoundingClientRect();
	tab.style.transition = style.transition;
	return r;
}

// translate that lands the tab's top-left on DIVE.corner once it has
// finished growing. The scale is taken about the tab's own centre, so
// the top-left drifts out by a quarter of its size — the half-size
// term below cancels exactly that
function glideToCorner(tab: HTMLElement) {
	const r = restingRect(tab);
	const grow = (DIVE.scale - 1) / 2;
	const tx = DIVE.corner.x - r.left + r.width * grow;
	const ty = DIVE.corner.y - r.top + r.height * grow;
	tab.style.translate = `${tx}px ${ty}px`;
}

diveTabs.forEach((tab) => {
	tab.addEventListener('click', () => {
		if (document.body.classList.contains('immersed')) return;
		const target = tab.dataset.tab;

		diveTabs.forEach((t) => {
			t.classList.toggle('active-tab', t === tab);
			t.setAttribute('aria-pressed', String(t === tab));
		});
		panels.forEach((panel) => {
			panel.hidden = panel.dataset.panel !== target;
		});
		if (target === 'photos') resetPhotoStrip();
		// Projects reverses the sky's spin; every other tab restores it
		// (topology-bg.ts reads this class each frame)
		document.body.classList.toggle('stars-reversed', target === 'projects');

		glideToCorner(tab);
		startDiveWindow();
		document.body.classList.add('immersed');
	});
});

// the glide translate is derived from the viewport's dimensions (the
// camera's origin is the viewport centre, and the resting menu is
// centred too), so a resize while immersed leaves the corner tab
// adrift — and the panel headings pinned beside it orphaned. Recompute
// it, suppressing the travel transition so the tab holds the corner
// instead of sliding there over a second
let reglideFrame = 0;
window.addEventListener('resize', () => {
	if (!document.body.classList.contains('immersed')) return;
	const active = diveTabs.find((t) => t.classList.contains('active-tab'));
	if (!active) return;
	cancelAnimationFrame(reglideFrame);
	reglideFrame = requestAnimationFrame(() => {
		active.style.transition = 'none';
		glideToCorner(active);
		active.getBoundingClientRect(); // commit before the transition returns
		active.style.transition = '';
	});
});

// the Contacts tab is a toggle, not a dive: the social buttons stay
// hidden from launch until it is clicked, then pop out from under it
// (.socials.open drives the CSS states)
const contactsTab = document.querySelector<HTMLButtonElement>(
	'[data-tab="contacts"]'
)!;
const socials = document.querySelector<HTMLElement>('.socials')!;
contactsTab.addEventListener('click', () => {
	if (document.body.classList.contains('immersed')) return;
	const open = socials.classList.toggle('open');
	contactsTab.setAttribute('aria-expanded', String(open));
});

function returnHome() {
	startDiveWindow();
	document.body.classList.remove('immersed');
	// back to the resting sky's normal spin direction
	document.body.classList.remove('stars-reversed');
	diveTabs.forEach((t) => {
		t.classList.remove('active-tab');
		t.setAttribute('aria-pressed', 'false');
		t.style.translate = '';
	});
	// once the content has faded out, collapse the tall panel so the
	// resting page isn't scrollable, and return to the top
	setTimeout(() => {
		if (!document.body.classList.contains('immersed')) {
			panels.forEach((panel) => (panel.hidden = true));
			window.scrollTo(0, 0);
		}
	}, 400);
}

backBtn.addEventListener('click', returnHome);

// Escape leaves a section as well as the Back button. An enlarged
// photo or screenshot owns the key first — it closes back to the panel
// (shot-lightbox.ts) — so this bows out while one is open. Listening in
// the capture phase guarantees this runs before the lightbox clears
// `shot-open`, whatever order the scripts happen to be imported in
window.addEventListener(
	'keydown',
	(e) => {
		if (e.key !== 'Escape') return;
		if (!document.body.classList.contains('immersed')) return;
		if (document.body.classList.contains('shot-open')) return;
		returnHome();
	},
	{ capture: true }
);
