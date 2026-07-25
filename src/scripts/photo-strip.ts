// in the photos section, the mouse wheel drives the filmstrip:
// scrolling down advances the line of photos to the right.
// Wheel ticks move a target position and a rAF loop eases the
// strip toward it, so the motion glides instead of stepping.
const photoStrip = document.getElementById('photo-strip')!;
const photosPanel = document.querySelector<HTMLElement>(
	'[data-panel="photos"]'
)!;
let stripTarget = 0;
let stripAnimating = false;

// snap the strip back to its start — used when the Photos tab is opened
export function resetPhotoStrip() {
	photoStrip.scrollLeft = 0;
	stripTarget = 0;
}

function animateStrip() {
	const diff = stripTarget - photoStrip.scrollLeft;
	if (Math.abs(diff) < 0.5) {
		photoStrip.scrollLeft = stripTarget;
		stripAnimating = false;
		return;
	}
	photoStrip.scrollLeft += diff * 0.14;
	requestAnimationFrame(animateStrip);
}

window.addEventListener(
	'wheel',
	(e) => {
		if (photosPanel.hidden || !document.body.classList.contains('immersed')) {
			return;
		}
		e.preventDefault();
		// while a photo is enlarged the strip must hold still, or the
		// shot's home slot would drift out from under the FLIP return
		if (document.body.classList.contains('shot-open')) return;
		// re-sync if the strip was moved natively (touch/drag)
		if (!stripAnimating) stripTarget = photoStrip.scrollLeft;
		const max = photoStrip.scrollWidth - photoStrip.clientWidth;
		stripTarget = Math.max(0, Math.min(max, stripTarget + e.deltaY + e.deltaX));
		if (!stripAnimating) {
			stripAnimating = true;
			requestAnimationFrame(animateStrip);
		}
	},
	{ passive: false }
);
