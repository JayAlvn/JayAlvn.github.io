// click-to-enlarge for project screenshots and strip photos: measure
// the shot's slot, glide it toward screen center with a transform-only
// FLIP, and glide it back into the slot on any click outside the
// enlarged image. Strip photos also reveal a description column on the
// right, and the FLIP target shifts left to leave it room.
const shotBackdrop = document.getElementById('shot-backdrop')!;
const shotCaption = document.getElementById('shot-caption')!;
const ZOOM_MARGIN = 48; // viewport px kept clear around the shot
const CAPTION_GAP = 40; // px between the shot and its description
let expandedShot: HTMLImageElement | null = null;
// which strip original each clone stands in for, so collapsing can
// reveal the original again once the clone has landed back over it
const cloneSource = new WeakMap<HTMLImageElement, HTMLImageElement>();

function collapseShot() {
	const img = expandedShot;
	if (!img) return;
	expandedShot = null;
	img.style.transform = '';
	shotBackdrop.classList.remove('open');
	shotCaption.classList.remove('open');
	document.body.classList.remove('shot-open');
	// keep the shot above the fading backdrop until it lands back in
	// its slot; skip if it was re-expanded mid-shrink
	img.addEventListener(
		'transitionend',
		() => {
			if (expandedShot !== img) {
				img.classList.remove('shot-expanded');
				// a strip clone has landed exactly over its original —
				// reveal the original again and drop the stand-in
				if (img.classList.contains('shot-clone')) {
					const source = cloneSource.get(img);
					if (source) source.style.visibility = '';
					img.remove();
				}
			}
		},
		{ once: true }
	);
}

function expandShot(img: HTMLImageElement) {
	if (expandedShot) return;
	const r = img.getBoundingClientRect();
	let shot = img;
	// strip photos sit inside the strip's scroll clip, which would crop
	// the enlarged image — so animate a fixed-position clone above the
	// backdrop instead, leaving the original dimmed in its slot
	if (img.closest('.photo-strip')) {
		const clone = img.cloneNode(true) as HTMLImageElement;
		clone.classList.add('shot-clone');
		clone.style.top = `${r.top}px`;
		clone.style.left = `${r.left}px`;
		clone.style.width = `${r.width}px`;
		clone.style.height = `${r.height}px`;
		shotBackdrop.parentElement!.appendChild(clone);
		// commit the start frame so the transform below transitions
		clone.getBoundingClientRect();
		// the clone now covers the original exactly — blank the original
		// (visibility keeps its slot) so it can't be seen behind the
		// backdrop while the enlarged copy is away from the slot
		cloneSource.set(clone, img);
		img.style.visibility = 'hidden';
		shot = clone;
	}
	// the zone the shot may fill; a description shrinks it from the right
	let zoneRight = window.innerWidth - ZOOM_MARGIN;
	const description = img.dataset.description;
	if (description) {
		const captionWidth = Math.min(448, Math.round(window.innerWidth * 0.3));
		shotCaption.style.width = `${captionWidth}px`;
		shotCaption.textContent = '';
		const heading = img.dataset.heading;
		if (heading) {
			const h = document.createElement('h2');
			h.textContent = heading;
			shotCaption.append(h);
		}
		const body = document.createElement('p');
		body.textContent = description;
		shotCaption.append(body);
		shotCaption.classList.add('open');
		zoneRight -= captionWidth + CAPTION_GAP;
	}
	const scale = Math.min(
		(zoneRight - ZOOM_MARGIN) / r.width,
		(window.innerHeight - ZOOM_MARGIN * 2) / r.height
	);
	const dx = (ZOOM_MARGIN + zoneRight) / 2 - (r.left + r.width / 2);
	const dy = window.innerHeight / 2 - (r.top + r.height / 2);
	shot.classList.add('shot-expanded');
	shot.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
	shotBackdrop.classList.add('open');
	document.body.classList.add('shot-open');
	expandedShot = shot;
}

document
	.querySelectorAll<HTMLImageElement>('.project-shot img, .photo-strip img')
	.forEach((img) => {
		img.addEventListener('click', () => expandShot(img));
	});

shotBackdrop.addEventListener('click', collapseShot);
window.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') collapseShot();
});
// scrolling or resizing moves the shot's home slot — glide it back
window.addEventListener('scroll', collapseShot, { passive: true });
window.addEventListener('resize', collapseShot);
