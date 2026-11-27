// Canyon Rush hand-in. This program needs only Node's built-in modules.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repository = path.dirname(fileURLToPath(import.meta.url));
const destination = path.resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
fs.mkdirSync(destination, { recursive: true });
for (const folder of ['game', 'screenshots']) {
  const source = path.join(repository, folder);
  if (!fs.existsSync(source)) throw new Error(`Required entry directory is missing: ${folder}`);
  const target = path.join(destination, folder);
  if (path.resolve(source) === path.resolve(target)) throw new Error('Output must be outside the source directories.');
  // Remove stale course assets so repeat builds contain exactly the current entry.
  fs.rmSync(target, { force: true, recursive: true });
  fs.cpSync(source, target, { recursive: true, dereference: false });
}
const dossier = buildDossier(destination, {
  game_max_bytes: 48 * 1024 * 1024,
  game_max_files: 993,
  game_path_max_bytes: 1000,
  text_max_bytes: 160 * 1024,
  screenshots: { max_bytes: 256 * 1024, max: 4 }
});
fs.writeFileSync(path.join(destination, 'dossier.json'), dossier);
console.log(`Canyon Rush prepared: ${dossier.byteLength} dossier bytes.`);
