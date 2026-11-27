# Alpine Rescue

A daytime mountain-rescue helicopter game. Fly an orange rescue helicopter over a sunlit alpine valley, hover steady above stranded hikers, lower the winch, lift them aboard, and land soft on the helipad. Canvas 2D art and synthesized WebAudio sound are generated entirely in code. No libraries, downloads, build step or network connection are needed.

## Play

Serve `game/` with any static web server and open `index.html` in a desktop browser. Enter or click begins the rescue. Fly three missions, then review the grades and total score. Only the best score uses localStorage; storage is optional.

- **W / S:** collective — climb / descend.
- **A / D:** cyclic — slide left / right.
- **Space:** hold to lower the winch, release to lift a hooked hiker aboard.
- **P:** pause. **R:** restart the campaign.
- **Enter / click:** start, continue to the next mission, or fly again.

## Three missions

1. **First Call:** calm air, one hiker on the east ledge, full fuel. Learn the hover.
2. **Gusting Ridge:** steady crosswind plus gusts. Hold your hover over the ledge.
3. **Last Light:** half fuel, stronger gusts, two hikers, and dusk is falling.

A pickup only locks when the hook is at the hiker and the hover is steady (low speed in both axes). A hiker on the hook follows the winch; release Space to lift them aboard. Landing points combine mission time, hover steadiness, fuel left and landing softness. A hard landing or a mountain strike crashes the helicopter and retries the mission. Fuel exhaustion leaves only autorotation: cyclic still works, collective does not.

## Capture hooks

`?shot=start&seed=7`, `?shot=play&seed=7` and `?shot=end&seed=7` present stable title, hover-over-hiker and example debrief renders. The play hook holds its pose until flight input or click. The end hook is a representative completed rescue and never updates the saved best score. Normal play begins at the title screen.

`main.ts` copies the game and the locally supplied screenshots into `MAKEFUN_OUTPUT_DIR` (default `/output`) and builds the dossier with the unchanged kit library. Screenshot capture and competition submission are handled separately.

Built for make.fun. Referral code: **v0wjehd6**.

MIT licensed; see LICENSE.
