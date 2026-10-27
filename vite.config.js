import { defineConfig, loadEnv } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";

/* Two targets share one codebase; the "#backend" module decides where data lives.
   - claude.ai artifact (npm run build): one self-contained index.html in dist/, backend/claude.js
   - website (npm run build:web, or npm run dev with Firebase settings in .env.local): dist-web/, backend/firebase.js */

/* link previews (KakaoTalk, X, Facebook…) for the website; they need the full address of the picture.
   site: VITE_SITE_URL, or the Firebase Hosting address worked out from the project id */
function preview(site){
  const esc = s => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const title = "다시 그린 하늘", desc = "진짜 밤하늘의 별을 다시 이어 나만의 별자리를 만들고, 별을 모아 오늘의 1위에 올라 보세요.";
  const img = site ? new URL("og.png", site).toString() : "";
  const tags = [
    ["name", "description", desc], ["property", "og:type", "website"], ["property", "og:title", title],
    ["property", "og:description", desc], ["property", "og:locale", "ko_KR"],
    ...(site ? [["property", "og:url", site], ["property", "og:image", img], ["property", "og:image:width", "1200"], ["property", "og:image:height", "630"]] : []),
    ["name", "twitter:card", "summary_large_image"], ["name", "theme-color", "#05070f"]
  ];
  return {
    name: "link-preview",
    transformIndexHtml: () => tags.map(([k, v, content]) => ({ tag: "meta", attrs: { [k]: v, content: esc(content) }, injectTo: "head" }))
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const web = mode === "web" || (mode === "development" && !!env.VITE_FIREBASE_PROJECT_ID);
  const backend = web ? "./src/backend/firebase.js" : "./src/backend/claude.js";
  const site = env.VITE_SITE_URL || (env.VITE_FIREBASE_PROJECT_ID && !env.VITE_FIREBASE_EMULATOR ? `https://${env.VITE_FIREBASE_PROJECT_ID}.web.app/` : "");
  return {
    base: "./",
    plugins: web ? [preview(site)] : [viteSingleFile()],
    resolve: { alias: { "#backend": fileURLToPath(new URL(backend, import.meta.url)) } },
    build: { target: "es2022", outDir: web ? "dist-web" : "dist" }
  };
});
