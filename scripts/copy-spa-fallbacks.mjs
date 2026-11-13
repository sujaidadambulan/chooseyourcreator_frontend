import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(root, "..", "dist");
const index = path.join(dist, "index.html");

if (!fs.existsSync(index)) {
  console.error("dist/index.html missing — run vite build first");
  process.exit(1);
}

const html = fs.readFileSync(index, "utf8");
fs.writeFileSync(path.join(dist, "404.html"), html);
console.log("Wrote dist/404.html (SPA fallback)");
