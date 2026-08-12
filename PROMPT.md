# The naming prompt

This is the algorithm for stage 3. It is not a hardcoded caption list — it is the
instruction sent to a vision model, once per detected sound, for any film.

The pipeline supplies the evidence. The model supplies the judgment. The design system
supplies the rendering. Nothing here is specific to a particular clip.

## What gets sent

Per detected sound:

- **2 frames** from the video — one at the sound's onset, one 0.4s later. Downscaled to
  512px wide, JPEG.
- **The measured evidence**, verbatim from the DSP stage:

```json
{
  "start": 9.37, "end": 10.58,
  "duration_s": 1.21,
  "loudness_rel": 1.00,
  "onset_strength_rel": 1.00,
  "spectral_centroid_hz": 1333,
  "stereo_balance": 0.03,
  "rms_trend": 0.71
}
```

- **Neighbouring context**: the two cues either side, so the model can avoid repeating
  itself and can notice a sound that is continuing rather than starting.

## The instruction

> You are writing the non-speech caption layer for a film, for Deaf and hard-of-hearing
> viewers. You are looking at two frames from the moment a sound occurs, plus acoustic
> measurements of that sound.
>
> Answer three questions.
>
> **1. What is the sound?** Two to four words, lowercase, concrete and physical. Name the
> source if you can see or infer it ("a spear strikes", "wings beat", "a chord lands").
> Do not use generic filler like "sound effect", "noise", "audio", "impact", "hit". If
> the frames do not explain the sound, say what it most plausibly is from the acoustics
> and lower your confidence.
>
> **2. Can the viewer already see what is making this sound?** Answer `visible`,
> `partly`, or `unseen`.
>
> This is the most important question. A caption that describes what the picture already
> shows is noise — it takes up the frame and tells the viewer nothing. If a blizzard is
> filling the screen, do not caption the wind. If the shot is black and a chord lands,
> caption it, because that sound is the only thing happening.
>
> **3. Where in the frame is the source?** `x` and `y` as fractions from 0 to 1, or
> `offscreen: left | right` if the source is outside the frame. Use the picture, not the
> stereo balance — many mixes are effectively mono and the balance carries no
> information.
>
> Return JSON only:
>
> ```json
> {
>   "text": "a chord lands",
>   "visibility": "unseen",
>   "x": 0.5, "y": 0.5, "offscreen": "none",
>   "confidence": 0.9,
>   "reason": "Black screen, title card. The only event is musical. Nothing visual competes."
> }
> ```

## The suppression rule

Any sound returning `visibility: "visible"` is **dropped**, not rendered.

This is the core of the product and the thing no captioning vendor does. Every existing
system describes more. This one describes less, deliberately, because it can see what
the picture already conveys.

Sounds returning `partly` are kept but rendered at reduced intensity.

## What the model does not decide

- **Timing** — from onset detection and RMS decay. Measured, not guessed.
- **Loudness** — from peak RMS relative to the loudest moment in the film.
- **Duration** — measured.
- **Behaviour** (punch / sustain / approach / recede / pulse) — from duration and the RMS
  trend across the body of the sound.
- **Texture** — from spectral centroid and high-band ratio.

The model names things and reads the picture. Everything measurable stays measured. That
separation is what keeps the output stable when the model is wrong — a bad label is one
wrong word, not a caption in the wrong place at the wrong time.

## Speech

Handled separately by Whisper, running in the browser. Speech is transcribed verbatim and
never passes through this prompt. Only non-speech sound is named here.

## Finding: stereo balance is often useless

On the Sintel trailer, measured stereo balance across all 38 detected events ranged from
−0.03 to +0.06. The mix is effectively mono. Positioning captions from stereo would have
placed every sound dead centre.

This is why question 3 asks the model to use the picture. It was originally a stereo
calculation and the data disproved it.
