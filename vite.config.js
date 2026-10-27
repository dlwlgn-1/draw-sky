import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

/* Builds one self-contained index.html (scripts and styles inlined); public/sky.json is copied beside it. */
export default defineConfig({
  base: "./",
  plugins: [viteSingleFile()],
  build: { target: "es2022" }
});
