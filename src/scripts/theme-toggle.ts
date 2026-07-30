// The sun/moon switch docked in the top-right corner (markup in
// index.astro, styles in global.css). The blue-hour sky is the default, so
// this adds and removes :root[data-theme='dark'], which re-resolves the
// sky's colour tokens — the two themes are one cosmic scene at two
// brightnesses, not an inversion.
//
// Deliberately not persisted: the light sky is the site's default and every
// visit starts there.
//
// The visible crossfade is pure CSS: the dark sky is a stacked layer on
// #sky that fades in on opacity. This used to run through a View Transition
// instead, but that blends the old and new page snapshots with plus-lighter
// — channel addition on the GPU — which intermittently flashed a saturated
// out-of-gamut frame mid-switch. A plain attribute flip has no snapshot step
// and so no blend to go wrong.
const root = document.documentElement;
const toggle = document.getElementById('theme-toggle');

toggle?.addEventListener('click', () => {
	const dark = root.dataset.theme !== 'dark';
	if (dark) root.dataset.theme = 'dark';
	else delete root.dataset.theme;
	toggle.setAttribute('aria-pressed', String(dark));
	// the icon shows the theme it will switch to, so the label names that
	// same destination rather than the current state
	toggle.setAttribute(
		'aria-label',
		dark ? 'Switch to light theme' : 'Switch to dark theme'
	);
});
