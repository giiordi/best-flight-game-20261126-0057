# Canyon Rush

An original sunset air race through a red-rock desert. Fly a cream-and-vermilion stunt prop plane above a winding river, thread illuminated sandstone arches, and bring your aircraft home before the light runs out. All scenery, aircraft, instruments and effects are drawn in Canvas 2D. Sound is synthesized with WebAudio after a user gesture. There are no external assets, dependencies, downloads or build steps.

## Play

Serve `game/` with any static server and open its `index.html` in a desktop browser. The canvas uses a 1280 × 720 logical resolution and scales to fit the window. Press Enter or click to take off.

- **W / Up:** climb. **S / Down:** descend.
- **A / Left** and **D / Right:** bank and steer with momentum.
- **Shift:** spend limited boost. Illuminated boost arches replenish the meter.
- **Mouse:** hold and drag to bank and pitch; release to center the controls.
- **P:** pause or resume. **R:** restart the whole race. **M:** mute sound.
- **Enter / click:** advance between courses, resume, or race again.

Steady wings build speed; hard banking and climbs bleed it. Each successful arch earns 500 points. A boost gate adds 250 and refills boost. Passing close to an arch's inside edge earns a 350-point near-miss bonus. Missed arches cost four seconds. Wall clips cost 25 hull; scrapes cost 10. Zero hull or an expired timer ends the sortie. Aircraft and boost are restored between courses.

## Courses

1. **Dusk Run:** ten wide arches, gentle bends and light wind. Find your line.
2. **Needle Gap:** twelve tighter arches and gusting crosswinds. Trust the bank.
3. **Golden Hour:** fourteen narrow arches, the strongest gusts, faster flight and fading light. Outrun the sun.

Finish the three courses to receive a debrief with each course's time, arches, near misses, hull, grade and score. Scores combine arch points, bonuses, remaining time and hull. Grades reward accuracy, aircraft preservation and pace. Only the best total score is stored, with `localStorage`; blocked storage never prevents play.

## Deterministic screenshot views

- `?shot=start&seed=7`: sunset title screen.
- `?shot=play&seed=7`: frozen mid-course boost-gate flight with instruments and trails.
- `?shot=end&seed=7`: debrief preview with explicit demonstration result rows.

The screenshot views use a fixed scene time. They do not save sample scores. Enter or click returns to interactive play; `R` starts a fresh race. Without `shot`, the game starts normally on the title screen. `seed` controls the scenery and gust phases.

## Hand-in

`main.ts` uses Node 22.18+ standard-library APIs to copy `game/` and `screenshots/` to `MAKEFUN_OUTPUT_DIR` (default `/output`) and generate `dossier.json` using the unchanged kit vendor helper. Run `MAKEFUN_OUTPUT_DIR=/tmp/canyon-rush-output node main.ts`. The local submission operator must replace the previous round's screenshots with real Canyon Rush browser captures before the final hand-in. Screenshot production and submission are outside this build session's scope.

MIT licensed; see `LICENSE`. make.fun referral code: **v0wjehd6**.
