# Echo

Captions that carry sound, not just words.

## Read these first, in this order

1. `HANDOFF.md` — current state, settled decisions, what is next. **Start here.**
2. `SPEC.md` — the caption vocabulary. The design system and the data schema.
3. `PROMPT.md` — the naming algorithm. What gets sent to the vision model and why.

`cues.sintel.json` is a validated fixture from running the naming stage by hand once. It
proves the prompt works. It is not the product — the product is that prompt called via
API. Do not treat it as ground truth to be extended by hand.

## Never do these

- Put the API key in browser JavaScript. It goes in `.env.local`, read only by `api/`.
- Add copyrighted footage to this repo. Openly licensed only.
- Reintroduce colour-coded captions. Tried, rejected.
- Caption a sound the picture already shows. That is the product.

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

## The analysis pipeline

`analyseBuffer()` is the core of the project. It takes decoded audio and returns cues —
nothing is hardcoded to a particular film. Point it at any video and it produces a
caption layer for that video.

What it derives, and from what:

| Cue field | Derived from |
| --- | --- |
| `start` / `end` | Spectral-flux onset peaks, then RMS decay to 32% of peak |
| `intensity` | Peak RMS normalised against the loudest moment in the film |
| `x`, `offscreen` | Stereo balance between L and R channels |
| `kind` | Band ratios and spectral centroid (speech band + duration → dialogue) |
| `behavior` | Duration, plus RMS trend across the body of the sound |
| `texture` | Spectral centroid and high-band ratio |
| `salience` | Peak loudness × onset strength × duration — drives the density control |

Two detectors run: **beds** (sustained regions in a 0.7s-smoothed envelope lasting over
3s) and **transients** (flux peaks above an adaptive local threshold).

Trend is measured over the first 82% of a sound, not the whole thing — the decay tail
otherwise makes every rising sound look flat.

The FFT is hand-rolled iterative radix-2. Verified: a 440 Hz sine peaks at bin 445 Hz.

### What the pipeline cannot do

It produces provisional labels: "sharp hit", "low thud", "score". It does not know a
door from a gunshot, and it does not know which sounds matter to the story. Those are
the two jobs for a model (audio classification, and vision over the frames), and they
are the honest gap to name in the case study rather than paper over.

### Density

The density control keeps the top N cues by salience. This is the restraint principle
from `SPEC.md` made operable — the discarded cues are real sounds that did not earn a
caption. Do not remove this to "show more".

## Known next steps

- Calibrate cue timings against the real clip (manual pass, ~15 min)
- Second scene, so the vocabulary is shown to generalise
- Export to WebVTT with `line`/`position`/`align` cue settings — proves Echo builds on
  the existing standard rather than replacing it
- Editor view for how a captioner would author this at scale (Figma, not code)
