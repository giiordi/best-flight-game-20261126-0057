import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repository = fileURLToPath(new URL('.', import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gamePath = join(repository, 'game');
const screenshotsPath = join(repository, 'screenshots');
if (!existsSync(screenshotsPath)) throw new Error('screenshots/ must contain three or four real game renders before hand-in');
const screenshotCount = readdirSync(screenshotsPath).filter(name => /\.(png|jpe?g)$/i.test(name)).length;
if (screenshotCount < 3 || screenshotCount > 4) throw new Error(`screenshots/ has ${screenshotCount} images; the hand-in needs three or four`);

mkdirSync(output, { recursive: true });
cpSync(gamePath, join(output, 'game'), { recursive: true });
mkdirSync(join(output, 'screenshots'), { recursive: true });
if (existsSync(screenshotsPath)) cpSync(screenshotsPath, join(output, 'screenshots'), { recursive: true });

const dossier = buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(output, 'dossier.json'), dossier);
