import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    // fs.strict is relaxed so Vite can serve the file:-linked dp-design dist + CSS,
    // which live outside the engine repo root.
    server: { port: 5180, fs: { strict: false } },
    // Serve our own fast-moving packages as source (NOT pre-bundled) — vite marks pre-bundled deps
    // `immutable` under a browserHash that doesn't change on content-only bumps, so a normal reload
    // kept serving a STALE version. As source they're revalidated, so reloads pick up fresh code.
    optimizeDeps: {
        exclude: ['pandora-box-layout', 'pandora-box-dp', 'pandora-box-manifest', 'pandora-box-react'],
    },
});
