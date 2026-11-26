# Night Trap: Carrier Landing

An original cockpit-view night carrier-landing game. Cross a moonlit ocean, fly the amber Fresnel ball, hold 140 knots and catch the third arrestor wire aboard CVN 08 Lantern. Canvas 2D art and synthesized WebAudio sound are generated entirely in code. No libraries, downloads, build step or network connection are needed.

## Play

Serve `game/` with any static web server and open `index.html` in a desktop browser. Enter or click begins the qualification. Fly three sorties, then review the landing grades and total score. Only the best score uses localStorage; storage is optional.

- **Up / Down:** raise / lower the nose; pitch trim holds when released.
- **Left / Right:** bank; bank changes heading and lineup. Counterbank to straighten your approach.
- **W / S** or **Shift / Ctrl:** increase / decrease throttle.
- **Mouse wheel:** adjust throttle. **M:** toggle mouse stick (move above screen center to raise the nose).
- **B:** toggle speedbrake. **X:** wave off and retry with a 60-point penalty.
- **P:** pause and view controls. **R:** restart the campaign. **V:** mute sound.
- **Enter / click:** start, continue after a landing, or resume.

## Night qualification

1. **Calm:** full fuel and light wind. Learn the ball and aim for wire three.
2. **Crosswind:** steady wind and gusts require a crab into wind and a wings-level touchdown.
3. **Low fuel:** half fuel and stronger gusts reward smooth throttle adjustments.

The green AoA donut means on-speed; the red cue means too slow and amber means too fast. An amber meatball above the green datum means high; below means low. Landing points combine glide, lineup, speed and wire selection. A bolter costs 110 points and retries the same sortie. Wave-offs and bolters retain fuel; a crash loses the sortie. Fuel exhaustion produces a dead-stick glide. Every sortie receives an S/A/B/C debrief grade.

## Capture hooks

`?shot=start&seed=1`, `?shot=play&seed=1` and `?shot=end&seed=1` present stable title, final-approach and example debrief renders. The play hook holds its pose until flight input or click. The end hook is a representative completed qualification and never updates the saved best score. Normal play begins at the title screen.

`main.ts` copies the game and the locally supplied screenshots into `MAKEFUN_OUTPUT_DIR` (default `/output`) and builds the dossier with the unchanged kit library. Screenshot capture and competition submission are handled separately.

Built for make.fun. Referral code: **v0wjehd6**.

MIT licensed; see LICENSE.
