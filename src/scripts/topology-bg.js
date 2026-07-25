// Star-trail background: a long-exposure night sky. Every particle is a star
// rigidly rotating about one fixed point (the celestial pole), so — exactly
// like a real star-trail photograph — all stars sweep the same angle per
// frame, and their pixel arc length grows with distance from the pole:
// concentric circles, short near the centre and long at the edges.
//
// Adapted from a flow-field effect originally derived from vanta.js TOPOLOGY
// (Kjetil Midtgarden Golid, https://github.com/kgolid/p5ycho). The steering
// flow field is gone; motion is now pure rotation. The deep-blue sky itself is
// a CSS gradient on #vanta-bg (global.css); this canvas is transparent and
// draws only the trails over it. Retained tricks:
//  - each frame a destination-out pass lowers every trail's alpha a little, so
//    old trails fade back to the gradient sky instead of piling up to white
//  - a random-dot "scrub" pass clears the faint alpha the 8-bit fade can't
//  - one batched canvas path per colour instead of thousands of p5.line calls
//    (p5's per-call overhead alone drops this to ~16fps at viewport size)
import p5 from 'p5';

// the dev (unminified) p5 build wraps every API call in argument-validation
// helpers that allocate on each call — 60 calls/second of that is GC fuel
p5.disableFriendlyErrors = true;

// the sky is drawn in CSS (#vanta-bg gradient); the canvas holds only trails,
// so the fade works in alpha, not colour — there's no background constant
const FADE_ALPHA = 6; // 0-255 per-frame alpha decay; higher = shorter trails
const PARTICLE_COUNT = 5000;
const LIFE_MIN = 600; // star lifetime in frames before respawning elsewhere
const LIFE_MAX = 1400;

// rigid sky rotation: one angular velocity shared by every star, about a pole
// fixed as a fraction of the viewport. Off to the right and mid-height, so the
// arcs sweep across the whole page (matching the reference framing). Positive
// OMEGA reads as clockwise on screen (canvas y points down)
const OMEGA = 0.0016; // radians per frame
const POLE_FRAC = { x: 0.82, y: 0.48 };
const COS_O = Math.cos(OMEGA);
const SIN_O = Math.sin(OMEGA);

// star types, weighted. A star's stroke alpha sets both its brightness AND —
// because the fade is multiplicative — how long its trail survives before it
// fades out: brighter = longer. So most stars are faint and SHORT (sparse
// background streaks), and only a small minority are brilliant white with long,
// bold trails, the way a real star-trail exposure reads. That length spread is
// what breaks the trails apart instead of merging them into solid rings. Tune
// the alphas to trade brightness and trail length together; FADE_ALPHA scales
// every trail's length at once. STAR_WIDTH thickens the brightest types so they
// stand out as the boldest streaks
const STAR_TYPES = [
	`rgba(196, 210, 246, 0.028)`, // faint blue-white — short, sparse (majority)
	`rgba(210, 220, 250, 0.055)`, // medium blue-white
	`rgba(232, 240, 255, 0.095)`, // bright white-blue
	`rgba(255, 255, 255, 0.145)`, // brilliant white — long, bold (few)
	`rgba(255, 226, 196, 0.048)`, // warm accent (rare)
];
const STAR_WIDTH = [1, 1, 1.2, 1.6, 1];

// weighted pick, skewed hard toward faint/short so the bright long trails stay
// special: ~0.62 / 0.24 / 0.09 / 0.03 / 0.02
function pickType() {
	const r = Math.random();
	if (r < 0.62) return 0;
	if (r < 0.86) return 1;
	if (r < 0.95) return 2;
	if (r < 0.98) return 3;
	return 4;
}

// destination-out decays each trail's alpha toward 0, but 8-bit rounding stalls
// it once alpha is within ~127/FADE_ALPHA of 0 — faint star-coloured residue
// left stuck over the sky. A stronger scrub pass removes the alpha the main
// fade can't. It must carry no coherent shape — a full-frame pass reads as a
// flicker pulse and a rolling band as a falling line — so it's a random-dot
// pattern stamped at a random offset each frame, thinning each pixel on
// average once per 1/SCRUB_RATE frames
const SCRUB_RATE = 1 / 30; // fraction of pixels scrubbed per frame
const SCRUB_ALPHA = 24; // residual alpha floor ≈ 127/SCRUB_ALPHA
const SCRUB_TILE = 256; // size of the repeating dot-pattern tile

export function startTopologyBackground(el) {
	const sketch = (p) => {
		let particles = [];
		// the pole in canvas pixels; recomputed on setup/resize
		let poleX = 0;
		let poleY = 0;

		function spawn(prt) {
			// uniform over the canvas: rotation preserves area, so a uniform
			// scatter stays uniform, and every star is one that will be seen
			prt.px = prt.x = Math.random() * p.width;
			prt.py = prt.y = Math.random() * p.height;
			prt.life = LIFE_MIN + Math.random() * (LIFE_MAX - LIFE_MIN);
			prt.ci = pickType();
		}

		function initParticles() {
			particles = [];
			for (let i = 0; i < PARTICLE_COUNT; i++) {
				const prt = {};
				spawn(prt);
				// stagger initial lifetimes so respawns don't come in waves
				prt.life = Math.random() * LIFE_MAX;
				particles.push(prt);
			}
		}

		function updateParticles() {
			// the Projects tab spins the sky the opposite way (scene-dive.ts sets
			// body.stars-reversed). Flipping the sign of the sine terms rotates by
			// -OMEGA instead of +OMEGA — a mirror of the same rigid rotation
			const s = document.body.classList.contains('stars-reversed')
				? -SIN_O
				: SIN_O;
			for (let i = 0; i < activeCount; i++) {
				const prt = particles[i];
				// finite lifetime: respawning elsewhere refreshes the field and
				// keeps the dense hub around the pole from over-accumulating
				if (--prt.life <= 0) {
					spawn(prt);
					continue;
				}
				prt.px = prt.x;
				prt.py = prt.y;
				// rotate the star about the pole by ±OMEGA — arc length is
				// radius * OMEGA, so it falls to nothing at the pole itself
				const dx = prt.x - poleX;
				const dy = prt.y - poleY;
				prt.x = poleX + dx * COS_O - dy * s;
				prt.y = poleY + dx * s + dy * COS_O;
			}
		}

		// destination-out reads only the source alpha, so this RGB is a
		// throwaway — black keeps it obvious the colour is unused
		let fadeStyle = `rgba(0, 0, 0, ${FADE_ALPHA / 255})`;
		let scrubPattern;

		function buildScrubPattern() {
			const tile = document.createElement('canvas');
			tile.width = tile.height = SCRUB_TILE;
			const tctx = tile.getContext('2d');
			const img = tctx.createImageData(SCRUB_TILE, SCRUB_TILE);
			const d = img.data;
			for (let i = 0; i < d.length; i += 4) {
				if (Math.random() < SCRUB_RATE) {
					// only alpha matters under destination-out; RGB stays 0
					d[i + 3] = SCRUB_ALPHA;
				}
			}
			tctx.putImageData(img, 0, 0);
			scrubPattern = p.drawingContext.createPattern(tile, 'repeat');
		}

		// adaptive quality: if frames stay slow, shed load instead of lagging.
		// Level 1 halves the particles; level 2 also caps at 30fps (with the
		// fade doubled so trail decay per wall-second stays the same).
		const SLOW_FRAME_MS = 28;
		const CHECK_WINDOW = 120;
		let qualityLevel = 0;
		let activeCount = PARTICLE_COUNT;
		let slowFrames = 0;
		let windowFrames = 0;

		function degradeQuality() {
			if (qualityLevel === 0) {
				qualityLevel = 1;
				activeCount = Math.floor(PARTICLE_COUNT / 2);
				console.info('[starfall] sustained slow frames — halving particles');
			} else if (qualityLevel === 1) {
				qualityLevel = 2;
				p.frameRate(30);
				fadeStyle = `rgba(0, 0, 0, ${(FADE_ALPHA * 2) / 255})`;
				console.info('[starfall] still slow — capping at 30fps');
			}
		}

		// one batched path per star type: stars of a type share a strokeStyle
		// and line width, so the whole sky is a handful of stroke() calls, not
		// thousands. Bright types are drawn thicker so they read as bold streaks
		function displayParticles() {
			const ctx = p.drawingContext;
			for (let b = 0; b < STAR_TYPES.length; b++) {
				ctx.strokeStyle = STAR_TYPES[b];
				ctx.lineWidth = STAR_WIDTH[b];
				ctx.beginPath();
				for (let i = 0; i < activeCount; i++) {
					const prt = particles[i];
					if (prt.ci !== b) continue;
					const dx = prt.x - prt.px;
					const dy = prt.y - prt.py;
					// skip the zero-length hop a just-respawned star makes
					if (dx * dx + dy * dy < 100) {
						ctx.moveTo(prt.px, prt.py);
						ctx.lineTo(prt.x, prt.y);
					}
				}
				ctx.stroke();
			}
		}

		function placePole() {
			poleX = POLE_FRAC.x * p.width;
			poleY = POLE_FRAC.y * p.height;
		}

		p.setup = function () {
			// 1x density: on hi-DPI screens the default 2x quadruples the
			// pixels pushed per frame for no visible gain on a soft background
			p.pixelDensity(1);
			p.createCanvas(el.clientWidth, el.clientHeight);
			p.clear(); // transparent — the CSS gradient sky shows through
			p.noStroke();
			placePole();
			buildScrubPattern();
			initParticles();
		};

		p.draw = function () {
			// full rate at all times, including during the tab dive. The dive
			// animates transforms/opacity/filter on the compositor thread, so it
			// doesn't contend with the canvas for the main thread — keeping the
			// sim at full speed means the Projects direction-reversal is instant
			// and the stars never crawl or wait for the tab to settle
			const diving = document.body.classList.contains('diving');
			// watch for sustained slowness (dt < 100 filters out the spikes caused
			// by background-tab throttling; skip during a dive so the transition's
			// brief load can't trip a false quality downgrade)
			if (qualityLevel < 2 && !diving) {
				const dt = p.deltaTime;
				if (dt < 100) {
					windowFrames++;
					if (dt > SLOW_FRAME_MS) slowFrames++;
					if (windowFrames >= CHECK_WINDOW) {
						if (slowFrames / windowFrames > 0.5) degradeQuality();
						windowFrames = 0;
						slowFrames = 0;
					}
				}
			}
			// fade + scrub run in destination-out: they lower the alpha of what's
			// already drawn (the trails) so it fades back to the CSS sky, rather
			// than painting any colour of their own over it
			const ctx = p.drawingContext;
			ctx.globalCompositeOperation = 'destination-out';
			ctx.fillStyle = fadeStyle;
			ctx.fillRect(0, 0, p.width, p.height);
			const ox = (Math.random() * SCRUB_TILE) | 0;
			const oy = (Math.random() * SCRUB_TILE) | 0;
			ctx.translate(-ox, -oy);
			ctx.fillStyle = scrubPattern;
			ctx.fillRect(0, 0, p.width + SCRUB_TILE, p.height + SCRUB_TILE);
			ctx.translate(ox, oy);
			// back to normal blending to lay fresh trail segments over the sky
			ctx.globalCompositeOperation = 'source-over';
			updateParticles();
			displayParticles();
		};

		p.windowResized = function () {
			p.resizeCanvas(el.clientWidth, el.clientHeight);
			p.clear();
			placePole();
			initParticles();
		};
	};

	return new p5(sketch, el);
}
