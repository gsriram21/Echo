# Echo

Captions that carry sound, not just words.

## Run it

Double-click `index.html`. That's it — no install, no terminal, no server.

The Sintel trailer loads from the web, so you need a connection the first time. If you'd
rather use your own footage, there's a "Load a local video file" button at the bottom.

## Try this first

1. Press play.
2. Hit the **Standard / Echo** toggle in the top right a few times while it plays.
   That comparison is the entire pitch — everything else supports it.
3. Tap any caption on the video. The panel below tells you what the sound is and why it
   is drawn that way.
4. Turn **Reduce motion** on. Everything should still be readable, with no animation.
   If something breaks there, that's a bug worth fixing before anything cosmetic.

## Keyboard

- `Space` — play / pause
- `←` `→` — nudge 0.1s (hold Shift for 1s)
- `E` — flip between Standard and Echo

## The timings are wrong on purpose

The cues were written without watching the clip, so they drift against the picture.
Fixing that is your first job and it takes about fifteen minutes:

1. Open **Author mode**.
2. Play until you hear a sound. Pause.
3. Click that cue in the list, press **Set start to playhead**.
4. Play to where it ends, press **Set end to playhead**.
5. When you've been through them all, press **Export JSON** and paste the contents back
   into the `CUES` array in `index.html`.

While you're in there: clicking anywhere on the video moves the selected cue to that
spot. That's the fastest way to place sound in the frame.

## Files

- `index.html` — the whole app
- `SPEC.md` — the caption vocabulary. This is your case study spine. Read it.
- `CLAUDE.md` — project context for Claude Code, read automatically each session

## Taking it into Claude Code

```
npm install -g @anthropic-ai/claude-code
cd echo
git init && git add -A && git commit -m "Echo v1"
claude
```

Then just type what you want. `CLAUDE.md` means you won't have to re-explain the project
every time.

Commit before any big change — that's your undo button.

## Credits

Sintel (2010), Blender Foundation. Creative Commons Attribution 3.0.
https://durian.blender.org
