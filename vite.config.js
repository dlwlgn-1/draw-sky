import { defineConfig, loadEnv } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";

/* Two targets share one codebase; the "#backend" module decides where data lives.
   - claude.ai artifact (npm run build): one self-contained index.html in dist/, backend/claude.js
   - website (npm run build:web, or npm run dev with Firebase settings in .env.local): dist-web/, backend/firebase.js */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const web = mode === "web" || (mode === "development" && !!env.VITE_FIREBASE_PROJECT_ID);
  const backend = web ? "./src/backend/firebase.js" : "./src/backend/claude.js";
  return {
    base: "./",
    plugins: web ? [] : [viteSingleFile()],
    resolve: { alias: { "#backend": fileURLToPath(new URL(backend, import.meta.url)) } },
    build: { target: "es2022", outDir: web ? "dist-web" : "dist" }
  };
});
