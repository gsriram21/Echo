# Echo

Captions that carry sound, not just words. A design prototype.

## What this is

Standard captions give every sound the same treatment: white text, black box, bottom
centre, roughly two seconds — regardless of where the sound came from, how long it
lasted, how loud it was, or whether it was moving.

Echo maps those discarded properties to visual channels. See `SPEC.md` — it is the
source of truth for the design system and the data schema. Read it before changing
anything about how captions render.

## Stack

- Single self-contained `index.html`. No build step, no dependencies, no server.
- Vanilla JS. Do not introduce React, a bundler, or npm packages without being asked.
- Opens by double-clicking the file. Keep it that way — zero-friction demo matters more
  than architecture here.

## Non-negotiable technical rule

**All caption state is computed from `video.currentTime` inside a `requestAnimationFrame`
loop.** Never use CSS keyframe animations or `setTimeout` for caption behaviour. They
drift the moment someone scrubs, and scrubbing is how people will test this.

Every behaviour is a pure function of `p`, the cue's progress from 0 to 1:

```
p = (currentTime - cue.start) / (cue.end - cue.start)
```

## Design rules

- **Two font weights only**: 400 and 500. Never 600 or 700.
- **One property, one channel.** Loudness owns size and weight. Duration owns horizontal
  extension. Location owns position. Movement owns scale. Texture owns edge quality.
  Do not let a channel encode two things — the reading becomes ambiguous.
- **Restraint is the product.** If every sound gets the full vocabulary, Echo is worse
  than what it replaces. Plain default; vocabulary reserved for sustained, changing, or
  positional sound.
- **`reduceMotion` is first class, not a fallback.** Every property must be expressible
  statically. If a new behaviour cannot be read with motion off, it is not finished.
- Caption text colour is `--cap`. Never pure white. Never a coloured caption body —
  colour lives in the sound-track marks and the harsh-texture fringing only.

## Source material

Sintel trailer (Blender Foundation, CC BY 3.0), loaded from `media.w3.org`. Tears of
Steel is the other good option — both are Creative Commons Attribution with published
source files.

**Never add a copyrighted clip to this project.** Not for a screenshot, not for a demo,
not temporarily.

## Cue timings

The cues shipped in `index.html` were authored without watching the clip, so they drift.
Author mode exists to fix that: play through, select each cue, use "Set start to
playhead" and "Set end to playhead", then Export JSON.

If asked to "fix the timings", the answer is not to guess at better numbers — it is to
improve author mode.

## Known next steps

- Calibrate cue timings against the real clip (manual pass, ~15 min)
- Second scene, so the vocabulary is shown to generalise
- Export to WebVTT with `line`/`position`/`align` cue settings — proves Echo builds on
  the existing standard rather than replacing it
- Editor view for how a captioner would author this at scale (Figma, not code)
