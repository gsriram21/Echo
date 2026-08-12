# Handoff — state of play

Written at the point of moving from a chat session into Claude Code. Everything a fresh
session needs is in this repo. Read this file, then `SPEC.md`, then `PROMPT.md`.

## What Echo is

Captions today give every sound the same treatment: white text, black box, bottom centre,
about two seconds — regardless of where the sound came from, how long it lasted, how loud
it was, or whether it was moving.

Echo maps those discarded properties to visual channels, and — the part nobody else does —
**stays silent about sounds the picture already shows.**

The thesis for the case study: WebVTT has supported cue positioning and CSS styling for
over a decade, and IMSC supports far more. The capability was always there. Nobody
designed for it.

## Architecture — four stages

| Stage | How | Where it runs | Status |
|---|---|---|---|
| 1. Detect | FFT, spectral flux onsets, RMS envelope | Browser, local | **Done** |
| 2. Transcribe speech | Whisper via Transformers.js | Browser, local | **Not built** |
| 3. Name + suppress | Claude with video frames, per `PROMPT.md` | Serverless function | **Not built** |
| 4. Render | Design system in `SPEC.md` | Browser | **Done** |

Stage 3 was run **by hand once**, in a chat session, to validate the prompt. That output
is `cues.sintel.json`. It is a fixture proving the approach works — it is **not** the
product. The product is the same prompt called via API.

## What has been proven

- The detector works on a real film. On the Sintel trailer: 2 sustained beds, 38
  transients, timings that match the picture.
- The naming prompt produces good captions. 8 kept, 5 suppressed, with reasons.
- The suppression rule is the strongest idea in the project. The blizzard at the opening
  is deliberately **not** captioned because the screen is full of driving snow.
- The best caption in the film is at 9.37s — loudest event, sharpest onset, landing on a
  **black title card**. Nothing on screen. That single moment is the whole pitch.

## What was disproven

**Stereo balance is useless on this mix.** Measured across all 38 events it ranged from
−0.03 to +0.06. Positioning captions from stereo would have put every one dead centre.

Position now comes from the vision model reading the frame. Do not reintroduce
stereo-derived positioning as the primary signal — keep it only as a weak fallback when
no frame is available.

## Design decisions already settled — do not relitigate

- **Monochrome.** Colour coding by sound type was tried and rejected as childish. Kind is
  carried by an ink hierarchy: speech brightest, effects next, music dimmer, ambient
  dimmest.
- **No plate behind captions.** Letters carry their own dark stroke (`paint-order: stroke
  fill` plus `-webkit-text-stroke` scaled to font size). A filled box reads as UI, not film.
- **Two font weights only**, 400 and 500.
- **One property, one channel.** Loudness owns size and weight. Duration owns horizontal
  extension. Location owns position. Movement owns scale. Texture owns edge quality.
- **`reduceMotion` is first class.** Every property must be expressible statically. An
  accessibility feature that creates a new accessibility problem has failed.
- **Restraint is the product.** If every sound gets the full vocabulary, Echo is worse than
  what it replaces.

## Open feedback not yet addressed

1. **The underline under captions is not doing any work.** Either give it a real job or
   delete it. Leaning delete.
2. **Words should behave like the sound they name.** Under-built. This is the design
   heart of the project and the most valuable remaining work.
3. **Speech is not transcribed at all.** Biggest functional hole. Whisper fixes it.
4. **The 20 hardcoded placeholder cues in `index.html` must be deleted.** They are fake,
   they look authoritative, and they caused an hour of wasted review. Replace with
   `cues.sintel.json` loaded as a fixture, clearly labelled.

## Next, in order

1. **Delete the hardcoded `CUES` array.** Load `cues.sintel.json` instead.
2. **Whisper in the browser** via Transformers.js. Speech becomes real captions. No key
   needed, runs locally.
3. **Serverless naming endpoint.** `/api/name` holds the key, takes frames plus measured
   evidence, returns JSON per `PROMPT.md`. Wire the browser to call it.
4. **Frame extraction in the browser** — draw the `<video>` to a canvas at each cue onset,
   export JPEG, send with the request.
5. **Typography pass.** Make the words behave like their sounds. Delete the underline.
6. **Restructure and deploy** to Vercel so there is a real URL.

## Restructure target

```
echo/
  index.html          entry
  src/
    detect.js         stage 1 — FFT, onsets, envelope
    transcribe.js     stage 2 — Whisper
    name.js           stage 3 — calls /api/name
    render.js         stage 4 — the design system
    author.js         the editor
  api/
    name.js           serverless function, holds the key
  cues.sintel.json    fixture from the validated hand-run
  clip.mp4            Sintel trailer, CC BY 3.0
  SPEC.md  PROMPT.md  HANDOFF.md  CLAUDE.md  README.md
```

Keep it deployable as static files plus one function. No framework unless something
genuinely needs it.

## The API key

Never in browser JavaScript. Anyone who opens the page can read it.

- Local: `.env.local` at the project root, `ANTHROPIC_API_KEY=sk-ant-...`
- Deployed: set the same variable in Vercel's project settings
- `.env.local` is gitignored. Confirm before every push.

## Source material

Sintel trailer, Blender Foundation, CC BY 3.0. Committed as `clip.mp4` so the live demo
has something to play. Never add copyrighted footage to this repo.
