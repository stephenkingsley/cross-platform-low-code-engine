import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    base: '', // relative asset paths (the app is loaded inside Contentful's iframe)
    plugins: [react()],
    // port 3000 = the Contentful App Definition's frontend URL.
    // fs.strict relaxed so Vite can serve the file:-linked dp-design dist + CSS (outside the repo root).
    server: { port: 3000, fs: { strict: false } },
    // Do NOT pre-bundle our own fast-moving packages. Vite serves pre-bundled deps with
    // `Cache-Control: immutable` under a browserHash that does NOT change on a content-only version
    // bump — so the browser kept serving a STALE Swiper across normal reloads (the "last slide blank
    // in the editor, fixed for a day but still broken" bug). Served as source they're revalidated, so
    // every reload picks up the freshly published version.
    optimizeDeps: {
        exclude: ['pandora-box-layout', 'pandora-box-dp', 'pandora-box-manifest', 'pandora-box-react'],
    },
});
