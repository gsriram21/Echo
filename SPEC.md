# Echo — caption vocabulary

## The problem

Standard captions give every sound the same treatment: white text, black box, bottom
center, roughly two seconds, regardless of what the sound was.

A hearing viewer receives at least five things from a sound. A caption preserves one.

| What a hearing viewer gets | What the caption preserves |
| --- | --- |
| What the sound is | Yes |
| Where it came from | No |
| How long it lasted | No |
| How loud it was | No |
| Whether it was moving | No |

The consequence is not cosmetic. In a University of Sheffield study, Deaf viewers
watching *Jaws* knew music was playing but never learned it meant the shark was
approaching. The scene's entire structure was withheld from them.

## The thesis

WebVTT has supported cue positioning (`line`, `position`, `align`, `size`) and CSS
styling (`::cue`) for over a decade. TTML/IMSC supports considerably more. The
capability has been in the standards the whole time.

Nobody designed for it.

Echo is not a new format. It is the design layer on top of a capability that already
exists.

## The vocabulary

Five sound properties, each mapped to one visual channel. One property, one channel —
no channel does double duty.

### 1. Location → position in frame

The caption sits where the sound is.

- On screen: positioned at the source, `x` and `y` as a 0–1 fraction of the frame.
- Off screen: pinned to the frame edge and **clipped**, so part of the word is cut off.
  The clipping is the signal that the source is not visible.

### 2. Duration → horizontal extension

The caption occupies its real length in time.

- Short sounds are set tight and leave quickly.
- Sustained sounds open up — letter-spacing expands across the sound's actual duration,
  with a thin rule underneath tracking its length.

A ninety-second score currently gets a two-second flash of `[ominous music]`. Under
Echo it is present for ninety seconds, quietly, at the edge of attention — which is
what it is doing to a hearing viewer.

### 3. Loudness → weight and size

Type scale and optical weight track amplitude. A whisper is small and light. A slam is
large and heavy. Nothing else encodes loudness, so the reading stays unambiguous.

### 4. Movement → scale over time

- **Approach**: the caption grows and gains opacity across its duration.
- **Recede**: the reverse.

This is the *Jaws* fix. Something can be arriving before it is visible.

### 5. Texture → edge quality

- **Clean**: sharp, no treatment.
- **Muffled**: blurred, lower contrast — through a wall, underwater, in another room.
- **Harsh**: split or fractured edges — distortion, breakage, a scream.

## Behaviors

Composite treatments, named so they can be authored quickly.

| Behavior | Use for | Treatment |
| --- | --- | --- |
| `punch` | Discrete impacts | Enters slightly oversized, settles, leaves fast |
| `sustain` | Held sound: rain, drone, score | Letter-spacing opens across full duration, rule tracks length |
| `approach` | Something arriving | Scale and opacity increase over duration |
| `recede` | Something leaving | Scale and opacity decrease over duration |
| `pulse` | Rhythmic sound: heartbeat, engine, march | Scale oscillates on the beat |

## Restraint — the part that matters most

**Not every sound earns this.** A door shutting is a door shutting.

If the vocabulary is applied to everything, Echo becomes worse than what it replaces —
noisy, and occluding the picture for no reason. The system has a plain default, and the
vocabulary is reserved for sound doing narrative work.

Three cases justify the full treatment:

1. **Sustained** sound, where a single flash of text misrepresents ninety seconds.
2. **Changing** sound, where the movement is the information.
3. **Positional** sound, where the source's location matters to the scene.

Everything else stays ordinary.

## Cost: occlusion

Captions inside the frame cover the image. Standard captions sit at the bottom for a
reason. Deciding when a sound is worth occluding the shot is the real design judgment
in this project, and the `occlusion` setting exposes that decision to the viewer rather
than making it for them.

## Cost: motion

Animated text can cause difficulty for viewers with vestibular sensitivity, and can
impede reading for some dyslexic viewers. `reduceMotion` is not an afterthought — it is
a first-class mode in which every property is expressed statically: position, size,
weight, and a duration rule, with no animation at all.

An accessibility feature that creates a new accessibility problem has failed.

## What this prototype does not claim

Cues here are **hand-authored**. That is a design decision, not a limitation — every
caption is a deliberate choice that can be defended.

The scaled version would separate the mix into stems (Demucs), classify sound events to
get labels, timings, amplitude and stereo position, and map those to the parameters
above. The vocabulary is the hard part. The extraction is engineering.

## Data schema

```json
{
  "id": "c12",
  "start": 14.2,
  "end": 18.9,
  "text": "wings",
  "kind": "effect",
  "x": 0.72,
  "y": 0.34,
  "offscreen": "none",
  "behavior": "approach",
  "intensity": 0.8,
  "texture": "clean",
  "note": "Off-screen until it isn't. Growth carries the arrival before the picture does."
}
```

- `kind`: `dialogue` | `music` | `effect` | `ambient`
- `offscreen`: `none` | `left` | `right` | `top` | `bottom`
- `behavior`: `punch` | `sustain` | `approach` | `recede` | `pulse`
- `intensity`: 0–1
- `texture`: `clean` | `muffled` | `harsh`
- `note`: the reasoning, surfaced in the app when a caption is tapped

## Source material

Sintel (2010) and Tears of Steel (2012), Blender Foundation, Creative Commons
Attribution. Professionally scored, freely licensed, source files published.

Using an openly licensed film for an accessibility project is the correct choice on the
merits, not only the safe one.
