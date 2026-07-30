// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// the deployed origin. This is a GitHub Pages *user* site, served from
	// the domain root, so it needs no `base` — a project repo published at
	// /<repo>/ would
	site: 'https://jayalvn.github.io',
	// the toolbar's lazy-loaded module 504s (Outdated Optimize Dep) and can
	// trigger full page reloads in dev, restarting the background animation
	devToolbar: { enabled: false },
});
