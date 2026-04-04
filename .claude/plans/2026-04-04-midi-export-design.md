# MIDI Export — Design Document

## Goal

Add a "MIDI" export button that opens a configuration popup and generates a downloadable `.mid` file from the percussion score.

## Overall Flow

1. User clicks "MIDI" button in the toolbar (next to PDF/PNG)
2. A popup opens with:
   - An "Experimental" disclaimer at the top
   - Tempo input (BPM, defaults to 120)
   - Lane-to-instrument mapping (one grouped dropdown per lane)
   - Symbol-to-velocity mapping (named presets, only for symbols used in the score)
   - An "Export" button
3. On export, generate a `.mid` file and trigger a download

## Popup Layout

```
┌─────────────────────────────────────────────┐
│  Export to MIDI                          ✕   │
├─────────────────────────────────────────────┤
│  ⚠ Experimental feature. Results may vary.  │
│                                             │
│  Tempo: [120] BPM                           │
│                                             │
│  ── Instruments ──                          │
│  Surdo      [Kicks ▸ Bass Drum 1    ▾]      │
│  Caixa      [Snares ▸ Acoustic Snare ▾]     │
│  Agogo      [Latin ▸ Open Hi Agogo   ▾]     │
│                                             │
│  ── Velocities ──                           │
│  ● Full round  [Forte (110)    ▾]           │
│  ✕ Cross       [Accent (127)   ▾]           │
│  ○ Empty round [Piano (60)     ▾]           │
│  • Dot         [Ghost (30)     ▾]           │
│  ■ Square      [Mezzo (90)     ▾]           │
│  ◆ Diamond     [Mezzo (90)     ▾]           │
│                                             │
│              [Export MIDI]                   │
└─────────────────────────────────────────────┘
```

## MIDI Technical Details

- **Library:** `midi-writer-js` (lightweight, client-side)
- **Channel:** MIDI channel 10 (GM percussion standard)
- **Tracks:** One MIDI track per lane
- **Notes:** Each non-null cell becomes a note event:
  - Pitch = GM percussion note number from instrument mapping
  - Velocity = from symbol-to-velocity mapping
  - Duration = one subdivision unit
- **Rolls:** Render as rapid 32nd notes for the roll duration
- **Triplets:** Use MIDI triplet timing (3 notes in the space of 2)
- **Lines:** Concatenated sequentially
- **Repeats:** Unrolled (play 3x = 3 copies in MIDI)
- **Tempo:** Set in popup only, defaults to 120 BPM (not part of the score model)

## Default Symbol-to-Velocity Mapping

| Symbol       | Default Preset | Value |
|-------------|---------------|-------|
| ✕ Cross      | Accent        | 127   |
| ● Full round | Forte         | 110   |
| ■ Square     | Mezzo         | 90    |
| ◆ Diamond    | Mezzo         | 90    |
| ○ Empty round| Piano         | 60    |
| • Dot        | Ghost         | 30    |

Velocity presets: Ghost (30), Piano (60), Mezzo (90), Forte (110), Accent (127)

## Lane Name Auto-Detection

Case-insensitive partial match:

| Lane name contains | GM Instrument       | Note |
|-------------------|--------------------|----- |
| surdo, bass, kick | Bass Drum 1        | 36   |
| caixa, snare      | Acoustic Snare     | 38   |
| hi-hat, hihat, chimbal | Closed Hi-Hat | 42   |
| agogo             | Open Hi Agogo      | 67   |
| tamborim, tambourim | Cowbell          | 56   |
| shaker, ganza     | Shaker             | 70   |
| (unknown)         | Acoustic Snare     | 38   |

## Instrument Dropdown Groups

- Kicks: Bass Drum 1, Bass Drum 2, etc.
- Snares: Acoustic Snare, Electric Snare, Side Stick, etc.
- Hi-Hats: Closed Hi-Hat, Open Hi-Hat, Pedal Hi-Hat
- Cymbals: Crash, Ride, Splash, Chinese
- Toms: High/Mid/Low Tom variants
- Latin: Agogo, Cabasa, Maracas, Claves, Guiro, etc.
- Effects: Cowbell, Tambourine, Vibraslap, Shaker, etc.

## New Files

- `src/model/midiMappings.ts` — GM percussion instruments, groups, velocity presets, auto-detection
- `src/utils/midiExport.ts` — MIDI generation logic
- `src/components/MidiExportModal/MidiExportModal.tsx` — popup component
- `src/components/MidiExportModal/MidiExportModal.module.css` — styles

## Dependencies

- `midi-writer-js` (npm package)
