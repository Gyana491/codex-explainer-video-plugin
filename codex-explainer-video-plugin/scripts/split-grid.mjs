import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";

const [input, outputDir, columnsRaw, rowsRaw] = process.argv.slice(2);
const columns = Number(columnsRaw);
const rows = Number(rowsRaw);

if (!input || !outputDir || !Number.isInteger(columns) || !Number.isInteger(rows)) {
  console.error(
    "Usage: node scripts/split-grid.mjs <input> <output-dir> <columns> <rows>",
  );
  process.exit(1);
}

await mkdir(outputDir, { recursive: true });

let scene = 1;
for (let row = 0; row < rows; row += 1) {
  for (let column = 0; column < columns; column += 1) {
    const output = join(
      outputDir,
      `scene-${String(scene).padStart(2, "0")}.png`,
    );

    await run("ffmpeg", [
      "-y",
      "-i",
      input,
      "-vf",
      `crop=iw/${columns}:ih/${rows}:${column}*iw/${columns}:${row}*ih/${rows}`,
      "-frames:v",
      "1",
      output,
    ]);

    scene += 1;
  }
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}
