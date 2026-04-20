# Playback Feature — Design

**Date:** 2026-04-20
**Status:** Draft — awaiting approval

## Goal

Add minimalist score playback so drummers can hear what they've written. No MIDI dependency at runtime — pure Web Audio API with percussion samples.

## Requirements

### Must-have (v1)
- Play/Pause the full score from the beginning
- Stop (reset to start)
- Tempo override slider for practice (independent from score tempo, default to score's `tempo` field)
- Visual feedback: current measure highlighted during playback

### Nice-to-have (v2+)
- Mute/solo per lane
- Play from a specific measure (click to set playhead)
- Loop a selected section/range of measures

## Audio Engine

### Approach: Web Audio API scheduler + free samples

**Why:** Full control over timing, muting, seeking. No heavy dependencies. The existing `flattenMeasures` and `autoDetectInstrument` logic is reused directly.

### Samples

**Source:** Salamander Drumkit (CC-BY, effectively CC0 since March 2022)

Cherry-pick ~25 samples to cover the GM percussion instruments already mapped in `midiMappings.ts`. Convert to MP3 (44.1kHz, mono, 96kbps) for web-friendly size — expect ~1-2MB total.

Samples live in `public/samples/{note}.mp3` (e.g. `36.mp3` for Bass Drum 1, `38.mp3` for Acoustic Snare). Named by GM note number to match the existing `GM_PERCUSSION` mapping directly.

### Scheduling

Uses the standard Web Audio lookahead pattern:

1. A `setInterval` (~25ms) runs during playback
2. Each tick, schedule any notes that fall within the next ~100ms lookahead window
3. Notes are triggered via `AudioBufferSourceNode.start(exactTime)` for sample-accurate timing
4. `AudioContext.currentTime` is the clock — no drift, no jitter

This is the same pattern used by Chris Wilson's "A Tale of Two Clocks" (the de facto reference for Web Audio scheduling).

### Transport state machine

```
stopped ──▶ playing ──▶ paused
  ▲            │           │
  │            ▼           │
  └──────── stopped ◀──────┘
```

- **Stopped:** position = 0, AudioContext suspended
- **Playing:** scheduler running, AudioContext running
- **Paused:** scheduler stopped, AudioContext suspended, position preserved

## Architecture

### New files

```
src/audio/
  SampleLoader.ts     — fetch + decode audio files into cached AudioBuffers
  Scheduler.ts        — reads score, schedules sample triggers
  transport.ts        — playback state, tempo, position, React hook (useTransport)
```

### `SampleLoader.ts`

- `loadSamples(noteNumbers: number[]): Promise<Map<number, AudioBuffer>>`
- Fetches only the samples needed for the current score's lanes
- Caches decoded buffers — reloads only on lane changes
- Uses the shared `AudioContext` from transport

### `Scheduler.ts`

- `createScheduler(ctx: AudioContext, score: Score, samples: Map<number, AudioBuffer>, options: SchedulerOptions)`
- Reuses `flattenMeasures` from `midiExport.ts` (extract to shared util)
- Reuses `autoDetectInstrument` from `midiMappings.ts` for lane → GM note mapping
- Reuses `DEFAULT_SYMBOL_VELOCITIES` for velocity/gain per symbol
- Walks flattened measures, calculates absolute time offset per cell based on tempo + time signature
- Handles triplets (3 cells in beat time), rolls (rapid repeated triggers)
- Returns a controller: `{ start, pause, resume, stop, setTempo, getCurrentPosition }`

### `transport.ts`

- `useTransport(score: Score)` React hook
- Exposes: `state` (stopped/playing/paused), `play()`, `pause()`, `stop()`, `tempo`, `setTempo()`, `currentMeasureIndex`
- Manages `AudioContext` lifecycle (create on first play, suspend/resume on pause)
- `currentMeasureIndex` updates during playback for visual feedback

### Shared code extraction

Move `flattenMeasures` from `midiExport.ts` to a shared location (e.g. `src/utils/scoreUtils.ts`) so both MIDI export and playback can use it without duplication.

## UI

### Toolbar layout

A visually distinct playback block in the toolbar, separated from the file operations:

```
[Title] (unsaved)     [Help]     |  ▶ ⏹  ♩=120 [---●------]  |     [Show Pulse] [New] [Load] [Save] [PDF] [PNG] [MIDI]
                                 |  playback block              |
```

- Separated by a vertical divider or distinct background/border
- **Play/Pause** toggle button: ▶ when stopped/paused, ⏸ when playing
- **Stop** button: ⏹ resets to beginning
- **Tempo display:** shows current BPM (editable, click to type)
- **Tempo slider:** range 40-300, default from `score.tempo`

### Visual feedback during playback

Highlight the currently playing measure with a subtle background color or border. This requires passing `currentMeasureIndex` from the transport down to the score grid. The mapping between scheduler position (flat index) and the grid's line/measure structure needs `flattenMeasures` index tracking.

### PlaybackControls component

```
src/components/PlaybackControls/
  PlaybackControls.tsx
  PlaybackControls.module.css
```

Self-contained component rendered inside the Toolbar. Receives the transport hook's state and callbacks as props.

## Sample licensing

Include a `public/samples/LICENSE.md` attributing the Salamander Drumkit:

```
Samples from the Salamander Drumkit by Alexander Holm.
License: CC-BY 3.0 (https://creativecommons.org/licenses/by/3.0/)
Source: https://github.com/endolith/Salamander-Drumkit
```

## Error handling

- **Samples fail to load:** Show a brief toast/warning, disable playback. Don't block the rest of the app.
- **AudioContext blocked by browser autoplay policy:** The AudioContext is created on first user click (Play button), which satisfies the gesture requirement. If it still fails, show a message asking the user to click Play again.
- **Score changes during playback:** Stop playback automatically. The user can restart.

## What this does NOT include

- No waveform display or timeline scrubber
- No metronome click (the score itself is the reference)
- No recording or audio export (MIDI export covers that use case)
- No sample customization UI (auto-detect from lane names is enough for v1)

## Nice-to-have design notes (v2+)

These are not part of v1 but the architecture supports them:

- **Mute per lane:** The scheduler already processes lanes individually. Add a `mutedLanes: Set<string>` to skip scheduling notes for muted lanes. UI: a small mute icon on each lane header.
- **Play from position:** Set `startMeasureIndex` on the scheduler. UI: click a measure to set playhead.
- **Loop section:** The scheduler's flattened measures already handle sections. Add `loopStart`/`loopEnd` indices. UI: click a section label to toggle loop.
