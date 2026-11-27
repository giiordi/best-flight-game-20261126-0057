import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Alpine Rescue is a static canvas game: this build step only stages the
// game and its screenshots, then lets the unchanged kit library describe them.
const root = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');

function destinationIsSafe(): boolean {
  if (outDir === root) return false;
  if (root.startsWith(outDir + path.sep)) return false;
  for (const folder of ['game', 'screenshots']) {
    const input = path.join(root, folder);
    if (outDir === input || outDir.startsWith(input + path.sep)) return false;
  }
  return true;
}

if (!destinationIsSafe()) {
  throw new Error('MAKEFUN_OUTPUT_DIR must be separate from the game source.');
}
fs.mkdirSync(outDir, { recursive: true });

// Stage a clean copy of the game and the screenshots. Clearing the target
// first guarantees that files removed from the repo never leak into a build.
for (const folder of ['game', 'screenshots']) {
  const source = path.join(root, folder);
  const target = path.join(outDir, folder);
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true });
}

// The kit library reads the staged game and screenshots from the output
// directory and returns the dossier document; store it as dossier.json.
const dossier = buildDossier(outDir, {
  text_max_bytes: 160 * 1024,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
});
fs.writeFileSync(path.join(outDir, 'dossier.json'), dossier);
