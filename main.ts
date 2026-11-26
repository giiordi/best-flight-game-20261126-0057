import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// This hand-in is a static cockpit game; the runtime never compiles game code.
const repository = path.dirname(fileURLToPath(import.meta.url));
const destination = path.resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
if (destination === repository || repository.startsWith(destination + path.sep) ||
    ['game', 'screenshots'].some(folder => {
      const input = path.join(repository, folder);
      return destination === input || destination.startsWith(input + path.sep);
    })) {
  throw new Error('The output directory must be separate from the game source.');
}
fs.mkdirSync(destination, { recursive: true });
for (const folder of ['game', 'screenshots']) {
  const source = path.join(repository, folder);
  const target = path.join(destination, folder);
  // Clear a previous build so removed round-one assets cannot survive in output.
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true });
}
const dossier = buildDossier(destination, {
  text_max_bytes: 160 * 1024,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
});
fs.writeFileSync(path.join(destination, 'dossier.json'), dossier);
