// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// the toolbar's lazy-loaded module 504s (Outdated Optimize Dep) and can
	// trigger full page reloads in dev, restarting the background animation
	devToolbar: { enabled: false },
});
