import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const [url, destination] = process.argv.slice(2);

if (!url || !destination) {
  console.error("Usage: node scripts/download-asset.mjs <url> <destination>");
  process.exit(1);
}

const response = await fetch(url);
if (!response.ok) {
  throw new Error(`Download failed: HTTP ${response.status}`);
}

await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, Buffer.from(await response.arrayBuffer()));
console.log(destination);
