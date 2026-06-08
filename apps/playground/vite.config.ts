import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    // fs.strict is relaxed so Vite can serve the file:-linked dp-design dist + CSS,
    // which live outside the engine repo root.
    server: { port: 5180, fs: { strict: false } },
});
