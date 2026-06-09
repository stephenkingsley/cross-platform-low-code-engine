import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    base: '', // relative asset paths (the app is loaded inside Contentful's iframe)
    plugins: [react()],
    // port 3000 = the Contentful App Definition's frontend URL.
    // fs.strict relaxed so Vite can serve the file:-linked dp-design dist + CSS (outside the repo root).
    server: { port: 3000, fs: { strict: false } },
});
