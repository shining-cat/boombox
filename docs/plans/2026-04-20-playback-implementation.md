# Playback Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add minimalist score playback using Web Audio API + Salamander Drumkit samples.

**Architecture:** Three new modules in `src/audio/` (SampleLoader, Scheduler, transport hook) + one new UI component (PlaybackControls). Reuses existing `flattenMeasures` and `autoDetectInstrument` logic. Samples served from `public/samples/` as MP3 files.

**Tech Stack:** Web Audio API, React hooks, TypeScript. No new npm dependencies.

**Design doc:** `docs/plans/2026-04-20-playback-design.md`

---

### Task 1: Extract `flattenMeasures` to shared utility

**Files:**
- Create: `src/utils/scoreUtils.ts`
- Create: `src/utils/scoreUtils.test.ts`
- Modify: `src/utils/midiExport.ts`

**Step 1: Write the test**

```typescript
// src/utils/scoreUtils.test.ts
import { describe, it, expect } from 'vitest'
import { flattenMeasures } from './scoreUtils'
import { createScore, createMeasure, createLane } from '../model/factory'
import type { Score } from '../model/types'

describe('flattenMeasures', () => {
  it('returns measures in order for a score with no sections', () => {
    const score = createScore()
    const result = flattenMeasures(score)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(score.lines[0][0].id)
  })

  it('repeats section measures according to repeat count', () => {
    const lane = createLane('Test')
    const m1 = createMeasure([lane.id], { beats: 4, subdivision: 4 })
    m1.sectionLabel = 'Intro'
    m1.sectionLength = 1
    m1.repeat = { times: 3 }
    const m2 = createMeasure([lane.id], { beats: 4, subdivision: 4 })
    const score: Score = {
      title: 'Test',
      author: '',
      tempo: 120,
      lanes: [lane],
      lines: [[m1, m2]],
    }
    const result = flattenMeasures(score)
    expect(result).toHaveLength(4) // m1 x3 + m2
    expect(result[0].id).toBe(m1.id)
    expect(result[1].id).toBe(m1.id)
    expect(result[2].id).toBe(m1.id)
    expect(result[3].id).toBe(m2.id)
  })

  it('handles multiple lines', () => {
    const lane = createLane('Test')
    const m1 = createMeasure([lane.id], { beats: 4, subdivision: 4 })
    const m2 = createMeasure([lane.id], { beats: 4, subdivision: 4 })
    const score: Score = {
      title: 'Test',
      author: '',
      tempo: 120,
      lanes: [lane],
      lines: [[m1], [m2]],
    }
    const result = flattenMeasures(score)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(m1.id)
    expect(result[1].id).toBe(m2.id)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/utils/scoreUtils.test.ts`
Expected: FAIL — module not found

**Step 3: Create `scoreUtils.ts` by extracting `flattenMeasures`**

Copy the `flattenMeasures` function from `src/utils/midiExport.ts` (lines 11-52) into `src/utils/scoreUtils.ts`. Export it. Import the `Score` type.

```typescript
// src/utils/scoreUtils.ts
import type { Score } from '../model/types'

export function flattenMeasures(score: Score) {
  // exact copy of the function from midiExport.ts
  const allMeasures: typeof score.lines[0] = []
  for (const line of score.lines) {
    const sections: { startIndex: number; length: number; repeatTimes: number }[] = []
    for (let i = 0; i < line.length; i++) {
      const m = line[i]
      if (m.sectionLabel) {
        sections.push({
          startIndex: i,
          length: Math.min(m.sectionLength ?? 1, line.length - i),
          repeatTimes: m.repeat?.times ?? 1,
        })
      }
    }

    const measureSectionMap = new Map<number, typeof sections[0]>()
    for (const sec of sections) {
      for (let j = sec.startIndex; j < sec.startIndex + sec.length; j++) {
        measureSectionMap.set(j, sec)
      }
    }

    let i = 0
    while (i < line.length) {
      const sec = measureSectionMap.get(i)
      if (sec && sec.startIndex === i) {
        for (let rep = 0; rep < sec.repeatTimes; rep++) {
          for (let j = sec.startIndex; j < sec.startIndex + sec.length; j++) {
            allMeasures.push(line[j])
          }
        }
        i = sec.startIndex + sec.length
      } else if (!measureSectionMap.has(i)) {
        allMeasures.push(line[i])
        i++
      } else {
        i++
      }
    }
  }
  return allMeasures
}
```

**Step 4: Update `midiExport.ts` to import from `scoreUtils`**

Remove the local `flattenMeasures` function from `midiExport.ts`. Add:
```typescript
import { flattenMeasures } from './scoreUtils'
```

**Step 5: Run tests to verify everything passes**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run`
Expected: ALL PASS (new tests + existing tests)

**Step 6: Commit**

```bash
git -C /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox add src/utils/scoreUtils.ts src/utils/scoreUtils.test.ts src/utils/midiExport.ts
git -C /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox commit -m "Extract flattenMeasures to shared scoreUtils module"
```

---

### Task 2: Add percussion samples and license

**Files:**
- Create: `public/samples/LICENSE.md`
- Create: `public/samples/*.mp3` (one per GM note used in `midiMappings.ts`)

**Step 1: Download and prepare samples**

Download the Salamander Drumkit from https://github.com/endolith/Salamander-Drumkit. Cherry-pick the samples corresponding to the GM note numbers in `src/model/midiMappings.ts` (`GM_PERCUSSION` array — notes 35-82).

Convert each to MP3 (mono, 44.1kHz, 96kbps). Name files by GM note number: `35.mp3`, `36.mp3`, ..., `82.mp3`.

Place in `public/samples/`.

**Note:** This step requires manual work — downloading, converting, and curating the sample files. The implementer should:
1. Clone/download the Salamander Drumkit repo
2. Locate the individual WAV samples for each GM note
3. Convert to MP3 using ffmpeg: `ffmpeg -i input.wav -ac 1 -ar 44100 -b:a 96k output.mp3`
4. If a sample doesn't exist for a specific GM note, find the closest match or skip it (the SampleLoader will handle missing samples gracefully)

**Step 2: Write the license file**

```markdown
<!-- public/samples/LICENSE.md -->
# Sample Attribution

Percussion samples from the Salamander Drumkit by Alexander Holm.

License: CC-BY 3.0 (https://creativecommons.org/licenses/by/3.0/)
Source: https://github.com/endolith/Salamander-Drumkit
```

**Step 3: Verify samples load in browser**

Open the dev server, check the browser network tab can fetch `http://localhost:5173/boombox/samples/38.mp3` (or whichever port Vite uses).

**Step 4: Commit**

```bash
git -C /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox add public/samples/
git -C /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox commit -m "Add Salamander Drumkit percussion samples (CC-BY)"
```

---

### Task 3: Build SampleLoader

**Files:**
- Create: `src/audio/SampleLoader.ts`
- Create: `src/audio/SampleLoader.test.ts`

**Step 1: Write the test**

```typescript
// src/audio/SampleLoader.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSampleLoader } from './SampleLoader'

describe('SampleLoader', () => {
  let mockCtx: AudioContext

  beforeEach(() => {
    mockCtx = {
      decodeAudioData: vi.fn().mockResolvedValue({ duration: 0.5 }),
    } as unknown as AudioContext

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    }) as unknown as typeof fetch
  })

  it('loads and caches samples for given note numbers', async () => {
    const loader = createSampleLoader(mockCtx)
    const samples = await loader.loadSamples([36, 38])
    expect(samples.size).toBe(2)
    expect(samples.has(36)).toBe(true)
    expect(samples.has(38)).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('returns cached samples on second call', async () => {
    const loader = createSampleLoader(mockCtx)
    await loader.loadSamples([36])
    await loader.loadSamples([36])
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('skips samples that fail to load', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) })
      .mockResolvedValueOnce({ ok: false }) as unknown as typeof fetch

    const loader = createSampleLoader(mockCtx)
    const samples = await loader.loadSamples([36, 99])
    expect(samples.size).toBe(1)
    expect(samples.has(36)).toBe(true)
    expect(samples.has(99)).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/audio/SampleLoader.test.ts`
Expected: FAIL — module not found

**Step 3: Implement SampleLoader**

```typescript
// src/audio/SampleLoader.ts

export interface SampleLoader {
  loadSamples(noteNumbers: number[]): Promise<Map<number, AudioBuffer>>
}

export function createSampleLoader(ctx: AudioContext): SampleLoader {
  const cache = new Map<number, AudioBuffer>()

  async function loadSample(note: number): Promise<AudioBuffer | null> {
    if (cache.has(note)) return cache.get(note)!
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}samples/${note}.mp3`)
      if (!response.ok) return null
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
      cache.set(note, audioBuffer)
      return audioBuffer
    } catch {
      return null
    }
  }

  return {
    async loadSamples(noteNumbers: number[]): Promise<Map<number, AudioBuffer>> {
      const results = await Promise.all(
        noteNumbers.map(async (note) => {
          const buffer = await loadSample(note)
          return [note, buffer] as const
        })
      )
      const map = new Map<number, AudioBuffer>()
      for (const [note, buffer] of results) {
        if (buffer) map.set(note, buffer)
      }
      return map
    },
  }
}
```

**Step 4: Run tests**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/audio/SampleLoader.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git -C /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox add src/audio/SampleLoader.ts src/audio/SampleLoader.test.ts
git -C /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox commit -m "Add SampleLoader with caching and graceful failure"
```

---

### Task 4: Build Scheduler

**Files:**
- Create: `src/audio/Scheduler.ts`
- Create: `src/audio/Scheduler.test.ts`

**Step 1: Write the test**

```typescript
// src/audio/Scheduler.test.ts
import { describe, it, expect } from 'vitest'
import { buildNoteEvents } from './Scheduler'
import { createScore, createMeasure, createLane } from '../model/factory'
import type { Score, Cell } from '../model/types'

describe('buildNoteEvents', () => {
  it('generates events for each non-empty cell', () => {
    const lane = createLane('Snare')
    const m = createMeasure([lane.id], { beats: 4, subdivision: 1 })
    // Set cells: hit, rest, hit, rest
    m.cells[lane.id][0] = { symbol: 'cross' }
    m.cells[lane.id][1] = { symbol: null }
    m.cells[lane.id][2] = { symbol: 'cross' }
    m.cells[lane.id][3] = { symbol: null }

    const score: Score = {
      title: 'Test', author: '', tempo: 120,
      lanes: [lane], lines: [[m]],
    }

    const instrumentMap: Record<string, number> = { [lane.id]: 38 }
    const events = buildNoteEvents(score, instrumentMap, 120)

    expect(events.length).toBe(2)
    expect(events[0].note).toBe(38)
    expect(events[0].time).toBeCloseTo(0, 5)
    // At 120 BPM, one beat = 0.5s
    expect(events[1].time).toBeCloseTo(1.0, 5)
  })

  it('returns correct timing for different tempos', () => {
    const lane = createLane('Kick')
    const m = createMeasure([lane.id], { beats: 2, subdivision: 1 })
    m.cells[lane.id][0] = { symbol: 'cross' }
    m.cells[lane.id][1] = { symbol: 'cross' }

    const score: Score = {
      title: 'Test', author: '', tempo: 60,
      lanes: [lane], lines: [[m]],
    }

    const instrumentMap: Record<string, number> = { [lane.id]: 36 }
    const events = buildNoteEvents(score, instrumentMap, 60)

    // At 60 BPM, one beat = 1.0s
    expect(events[0].time).toBeCloseTo(0, 5)
    expect(events[1].time).toBeCloseTo(1.0, 5)
  })

  it('includes velocity from symbol mapping', () => {
    const lane = createLane('HH')
    const m = createMeasure([lane.id], { beats: 1, subdivision: 1 })
    m.cells[lane.id][0] = { symbol: 'dot' }

    const score: Score = {
      title: 'Test', author: '', tempo: 120,
      lanes: [lane], lines: [[m]],
    }

    const instrumentMap: Record<string, number> = { [lane.id]: 42 }
    const events = buildNoteEvents(score, instrumentMap, 120)

    expect(events.length).toBe(1)
    // 'dot' has velocity 30 in DEFAULT_SYMBOL_VELOCITIES → gain = 30/127
    expect(events[0].velocity).toBeCloseTo(30 / 127, 2)
  })

  it('tracks measure index for visual feedback', () => {
    const lane = createLane('Snare')
    const m1 = createMeasure([lane.id], { beats: 2, subdivision: 1 })
    m1.cells[lane.id][0] = { symbol: 'cross' }
    m1.cells[lane.id][1] = { symbol: null }
    const m2 = createMeasure([lane.id], { beats: 2, subdivision: 1 })
    m2.cells[lane.id][0] = { symbol: 'cross' }
    m2.cells[lane.id][1] = { symbol: null }

    const score: Score = {
      title: 'Test', author: '', tempo: 120,
      lanes: [lane], lines: [[m1, m2]],
    }

    const instrumentMap: Record<string, number> = { [lane.id]: 38 }
    const events = buildNoteEvents(score, instrumentMap, 120)

    expect(events[0].measureIndex).toBe(0)
    expect(events[1].measureIndex).toBe(1)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/audio/Scheduler.test.ts`
Expected: FAIL — module not found

**Step 3: Implement the Scheduler**

```typescript
// src/audio/Scheduler.ts
import { flattenMeasures } from '../utils/scoreUtils'
import { autoDetectInstrument, DEFAULT_SYMBOL_VELOCITIES } from '../model/midiMappings'
import type { Score } from '../model/types'

export interface NoteEvent {
  time: number          // absolute time in seconds from start
  note: number          // GM MIDI note number
  velocity: number      // 0-1 gain
  measureIndex: number  // index in flattened measures (for visual tracking)
}

export function buildNoteEvents(
  score: Score,
  instrumentMap: Record<string, number>,
  tempo: number,
): NoteEvent[] {
  const measures = flattenMeasures(score)
  const events: NoteEvent[] = []
  let currentTime = 0

  for (let mi = 0; mi < measures.length; mi++) {
    const measure = measures[mi]
    const { beats, subdivision } = measure.timeSignature
    const beatDuration = 60 / tempo
    const cellDuration = beatDuration / subdivision

    for (const lane of score.lanes) {
      const cells = measure.cells[lane.id] ?? []
      const laneTriplets = measure.tripletBeats?.[lane.id] ?? []
      const midiNote = instrumentMap[lane.id] ?? 38

      let cellOffset = 0
      for (let beat = 0; beat < beats; beat++) {
        const isTriplet = laneTriplets.includes(beat)
        const beatCellCount = isTriplet ? 3 : subdivision
        const thisCellDuration = isTriplet ? beatDuration / 3 : cellDuration
        const beatCells = cells.slice(cellOffset, cellOffset + beatCellCount)

        for (let i = 0; i < beatCells.length; i++) {
          const cell = beatCells[i]

          // Skip cells covered by a roll from an earlier cell
          const globalCellIndex = cellOffset + i
          const isInRoll = cells.some(
            (c, ci) => c.roll && ci <= globalCellIndex && ci + c.roll.length > globalCellIndex && ci !== globalCellIndex
          )
          if (isInRoll) continue

          if (cell.roll) {
            // Render roll as rapid notes
            const rollCells = cell.roll.length
            const rollDuration = rollCells * thisCellDuration
            const rollNoteInterval = rollDuration / (rollCells * 2)
            const vel = cell.symbol
              ? (DEFAULT_SYMBOL_VELOCITIES[cell.symbol] ?? 90) / 127
              : 90 / 127

            for (let r = 0; r < rollCells * 2; r++) {
              events.push({
                time: currentTime + i * thisCellDuration + r * rollNoteInterval,
                note: midiNote,
                velocity: vel,
                measureIndex: mi,
              })
            }
          } else if (cell.symbol) {
            const vel = (DEFAULT_SYMBOL_VELOCITIES[cell.symbol] ?? 90) / 127
            events.push({
              time: currentTime + i * thisCellDuration,
              note: midiNote,
              velocity: vel,
              measureIndex: mi,
            })
          }
        }

        cellOffset += beatCellCount
      }
    }

    // Advance time by total measure duration
    const laneTriplets = measure.tripletBeats?.[score.lanes[0]?.id] ?? []
    let measureDuration = 0
    let cellOff = 0
    for (let beat = 0; beat < beats; beat++) {
      const isTriplet = laneTriplets.includes(beat)
      measureDuration += beatDuration
      cellOff += isTriplet ? 3 : subdivision
    }
    currentTime += beats * beatDuration
  }

  events.sort((a, b) => a.time - b.time)
  return events
}

export interface SchedulerController {
  start: () => void
  stop: () => void
  pause: () => void
  resume: () => void
  setTempo: (bpm: number) => void
  getCurrentMeasureIndex: () => number
}

export function createScheduler(
  ctx: AudioContext,
  samples: Map<number, AudioBuffer>,
  events: NoteEvent[],
  onMeasureChange: (index: number) => void,
  onEnd: () => void,
): SchedulerController {
  let intervalId: ReturnType<typeof setInterval> | null = null
  let startTime = 0
  let pauseOffset = 0
  let nextEventIndex = 0
  let currentMeasureIndex = -1
  const LOOKAHEAD = 0.1   // seconds
  const INTERVAL = 25     // ms

  function scheduleNotes() {
    const now = ctx.currentTime - startTime + pauseOffset
    while (nextEventIndex < events.length && events[nextEventIndex].time < now + LOOKAHEAD) {
      const event = events[nextEventIndex]
      const buffer = samples.get(event.note)
      if (buffer) {
        const source = ctx.createBufferSource()
        source.buffer = buffer
        const gain = ctx.createGain()
        gain.gain.value = event.velocity
        source.connect(gain)
        gain.connect(ctx.destination)
        const playTime = startTime + event.time - pauseOffset
        if (playTime >= ctx.currentTime) {
          source.start(playTime)
        }
      }
      if (event.measureIndex !== currentMeasureIndex) {
        currentMeasureIndex = event.measureIndex
        onMeasureChange(currentMeasureIndex)
      }
      nextEventIndex++
    }
    if (nextEventIndex >= events.length) {
      stop()
      onEnd()
    }
  }

  function start() {
    nextEventIndex = 0
    pauseOffset = 0
    currentMeasureIndex = -1
    startTime = ctx.currentTime
    intervalId = setInterval(scheduleNotes, INTERVAL)
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    nextEventIndex = 0
    pauseOffset = 0
    currentMeasureIndex = -1
    onMeasureChange(-1)
  }

  function pause() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    pauseOffset = ctx.currentTime - startTime
  }

  function resume() {
    startTime = ctx.currentTime
    intervalId = setInterval(scheduleNotes, INTERVAL)
  }

  function setTempo(_bpm: number) {
    // Tempo changes require rebuilding events — handled by transport hook
  }

  return {
    start, stop, pause, resume, setTempo,
    getCurrentMeasureIndex: () => currentMeasureIndex,
  }
}
```

**Step 4: Run tests**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/audio/Scheduler.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git -C /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox add src/audio/Scheduler.ts src/audio/Scheduler.test.ts
git -C /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox commit -m "Add Scheduler with note event builder and lookahead player"
```

---

### Task 5: Build transport hook

**Files:**
- Create: `src/audio/useTransport.ts`
- Create: `src/audio/useTransport.test.ts`

**Step 1: Write the test**

```typescript
// src/audio/useTransport.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTransport } from './useTransport'
import { createScore, createMeasure, createLane } from '../model/factory'
import type { Score } from '../model/types'

// Mock AudioContext
const mockAudioContext = {
  currentTime: 0,
  state: 'suspended',
  resume: vi.fn().mockResolvedValue(undefined),
  suspend: vi.fn().mockResolvedValue(undefined),
  createBufferSource: vi.fn().mockReturnValue({
    connect: vi.fn(),
    start: vi.fn(),
    buffer: null,
  }),
  createGain: vi.fn().mockReturnValue({
    gain: { value: 1 },
    connect: vi.fn(),
  }),
  destination: {},
  decodeAudioData: vi.fn().mockResolvedValue({ duration: 0.5 }),
}

vi.stubGlobal('AudioContext', vi.fn(() => mockAudioContext))

// Mock fetch for sample loading
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
}) as unknown as typeof fetch

describe('useTransport', () => {
  let score: Score

  beforeEach(() => {
    score = createScore()
    vi.clearAllMocks()
  })

  it('starts in stopped state with score tempo', () => {
    const { result } = renderHook(() => useTransport(score))
    expect(result.current.state).toBe('stopped')
    expect(result.current.tempo).toBe(120)
  })

  it('allows tempo changes', () => {
    const { result } = renderHook(() => useTransport(score))
    act(() => {
      result.current.setTempo(90)
    })
    expect(result.current.tempo).toBe(90)
  })

  it('clamps tempo to 40-300 range', () => {
    const { result } = renderHook(() => useTransport(score))
    act(() => { result.current.setTempo(10) })
    expect(result.current.tempo).toBe(40)
    act(() => { result.current.setTempo(500) })
    expect(result.current.tempo).toBe(300)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/audio/useTransport.test.ts`
Expected: FAIL — module not found

**Step 3: Implement useTransport**

```typescript
// src/audio/useTransport.ts
import { useState, useCallback, useRef, useEffect } from 'react'
import { createSampleLoader } from './SampleLoader'
import { buildNoteEvents, createScheduler } from './Scheduler'
import type { SchedulerController } from './Scheduler'
import { autoDetectInstrument } from '../model/midiMappings'
import type { Score } from '../model/types'

export type TransportState = 'stopped' | 'playing' | 'paused'

export function useTransport(score: Score) {
  const [state, setState] = useState<TransportState>('stopped')
  const [tempo, setTempoState] = useState(score.tempo || 120)
  const [currentMeasureIndex, setCurrentMeasureIndex] = useState(-1)

  const ctxRef = useRef<AudioContext | null>(null)
  const schedulerRef = useRef<SchedulerController | null>(null)
  const loaderRef = useRef<ReturnType<typeof createSampleLoader> | null>(null)

  // Stop playback when score changes
  useEffect(() => {
    if (state !== 'stopped') {
      schedulerRef.current?.stop()
      setState('stopped')
      setCurrentMeasureIndex(-1)
    }
  }, [score])

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
      loaderRef.current = createSampleLoader(ctxRef.current)
    }
    return ctxRef.current
  }, [])

  const play = useCallback(async () => {
    const ctx = getContext()
    if (ctx.state === 'suspended') await ctx.resume()

    const instrumentMap: Record<string, number> = {}
    const noteNumbers: number[] = []
    for (const lane of score.lanes) {
      const note = autoDetectInstrument(lane.name)
      instrumentMap[lane.id] = note
      if (!noteNumbers.includes(note)) noteNumbers.push(note)
    }

    const samples = await loaderRef.current!.loadSamples(noteNumbers)
    const events = buildNoteEvents(score, instrumentMap, tempo)

    schedulerRef.current?.stop()
    schedulerRef.current = createScheduler(
      ctx,
      samples,
      events,
      setCurrentMeasureIndex,
      () => {
        setState('stopped')
        setCurrentMeasureIndex(-1)
      },
    )
    schedulerRef.current.start()
    setState('playing')
  }, [score, tempo, getContext])

  const pause = useCallback(async () => {
    const ctx = ctxRef.current
    if (!ctx || !schedulerRef.current) return
    schedulerRef.current.pause()
    await ctx.suspend()
    setState('paused')
  }, [])

  const resume = useCallback(async () => {
    const ctx = ctxRef.current
    if (!ctx || !schedulerRef.current) return
    await ctx.resume()
    schedulerRef.current.resume()
    setState('playing')
  }, [])

  const stop = useCallback(() => {
    schedulerRef.current?.stop()
    setState('stopped')
    setCurrentMeasureIndex(-1)
  }, [])

  const setTempo = useCallback((bpm: number) => {
    const clamped = Math.max(40, Math.min(300, bpm))
    setTempoState(clamped)
    // If currently playing, stop — user needs to restart with new tempo
    if (schedulerRef.current) {
      schedulerRef.current.stop()
      setState('stopped')
      setCurrentMeasureIndex(-1)
    }
  }, [])

  return {
    state,
    tempo,
    currentMeasureIndex,
    play,
    pause,
    resume,
    stop,
    setTempo,
  }
}
```

**Step 4: Run tests**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/audio/useTransport.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git -C /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox add src/audio/useTransport.ts src/audio/useTransport.test.ts
git -C /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox commit -m "Add useTransport hook with play/pause/stop and tempo control"
```

---

### Task 6: Build PlaybackControls component

**Files:**
- Create: `src/components/PlaybackControls/PlaybackControls.tsx`
- Create: `src/components/PlaybackControls/PlaybackControls.module.css`

**Step 1: Implement the component**

```tsx
// src/components/PlaybackControls/PlaybackControls.tsx
import type { TransportState } from '../../audio/useTransport'
import styles from './PlaybackControls.module.css'

interface PlaybackControlsProps {
  state: TransportState
  tempo: number
  onPlay: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onTempoChange: (bpm: number) => void
}

export function PlaybackControls({
  state,
  tempo,
  onPlay,
  onPause,
  onResume,
  onStop,
  onTempoChange,
}: PlaybackControlsProps) {
  const handlePlayPause = () => {
    if (state === 'playing') onPause()
    else if (state === 'paused') onResume()
    else onPlay()
  }

  return (
    <div className={styles.playbackBlock}>
      <button
        className={styles.transportBtn}
        onClick={handlePlayPause}
        title={state === 'playing' ? 'Pause' : 'Play'}
      >
        {state === 'playing' ? '⏸' : '▶'}
      </button>
      <button
        className={styles.transportBtn}
        onClick={onStop}
        disabled={state === 'stopped'}
        title="Stop"
      >
        ⏹
      </button>
      <span className={styles.tempoLabel}>♩=</span>
      <input
        className={styles.tempoInput}
        type="number"
        min={40}
        max={300}
        value={tempo}
        onChange={e => onTempoChange(parseInt(e.target.value, 10) || 120)}
        title="Tempo (BPM)"
      />
      <input
        className={styles.tempoSlider}
        type="range"
        min={40}
        max={300}
        value={tempo}
        onChange={e => onTempoChange(parseInt(e.target.value, 10))}
        title="Tempo slider"
      />
    </div>
  )
}
```

**Step 2: Style the component**

```css
/* src/components/PlaybackControls/PlaybackControls.module.css */
.playbackBlock {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-left: 1px solid #ccc;
  border-right: 1px solid #ccc;
  margin: 0 4px;
}

.transportBtn {
  font-size: 1.1rem;
  padding: 4px 8px;
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  line-height: 1;
}

.transportBtn:hover:not(:disabled) {
  background: #e8e8e8;
}

.transportBtn:disabled {
  opacity: 0.4;
  cursor: default;
}

.tempoLabel {
  font-size: 0.85rem;
  color: #666;
  margin-left: 4px;
}

.tempoInput {
  width: 48px;
  font-size: 0.85rem;
  text-align: center;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 2px 4px;
}

.tempoSlider {
  width: 80px;
  cursor: pointer;
}
```

**Step 3: Commit**

```bash
git -C /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox add src/components/PlaybackControls/
git -C /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox commit -m "Add PlaybackControls component with play/pause/stop and tempo"
```

---

### Task 7: Wire everything into Toolbar and App

**Files:**
- Modify: `src/components/Toolbar/Toolbar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/Score/Score.tsx`

**Step 1: Add playback props to Toolbar**

Update `ToolbarProps` to include the transport state and callbacks. Import and render `PlaybackControls` inside the toolbar, between the Help button and the Show Pulse button (where the spacer is).

Add to `ToolbarProps`:
```typescript
// Add to the interface:
transportState: TransportState
tempo: number
onPlay: () => void
onPause: () => void
onResume: () => void
onStop: () => void
onTempoChange: (bpm: number) => void
```

Render `<PlaybackControls ... />` in the toolbar between the Help button and the second spacer.

**Step 2: Wire transport hook in App.tsx**

Import `useTransport` in `App.tsx`. Call it with the score. Pass its outputs to `Toolbar`.

```typescript
import { useTransport } from './audio/useTransport'

// Inside App():
const transport = useTransport(score)
```

Pass to Toolbar:
```tsx
<Toolbar
  {...existingProps}
  transportState={transport.state}
  tempo={transport.tempo}
  onPlay={transport.play}
  onPause={transport.pause}
  onResume={transport.resume}
  onStop={transport.stop}
  onTempoChange={transport.setTempo}
/>
```

**Step 3: Add measure highlight to Score component**

Add `highlightMeasureIndex?: number` prop to `ScoreProps`.

In the measure column rendering, apply a highlight class when the flattened measure index matches. To map `currentMeasureIndex` (flattened) back to the grid's line/measure structure, compute a running index across lines and compare.

Add a CSS class for the highlight:
```css
/* Score.module.css */
.measureHighlight {
  background-color: rgba(37, 99, 235, 0.08);
  transition: background-color 0.1s;
}
```

Pass `transport.currentMeasureIndex` from App into Score as `highlightMeasureIndex`.

**Step 4: Verify in browser**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npm run dev`

1. Open the app in browser
2. Add a few instruments and notes
3. Click Play — verify sound plays, tempo matches slider
4. Click Pause — verify playback pauses
5. Click Play again — verify it resumes
6. Click Stop — verify it resets
7. Change tempo — verify playback speed changes
8. Verify current measure highlights during playback

**Step 5: Run all tests**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run`
Expected: ALL PASS

**Step 6: Commit**

```bash
git -C /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox add src/components/Toolbar/Toolbar.tsx src/App.tsx src/components/Score/Score.tsx src/components/Score/Score.module.css
git -C /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox commit -m "Wire playback into Toolbar and Score with measure highlighting"
```

---

### Task 8: Update Help section

**Files:**
- Modify: `src/components/Toolbar/Toolbar.tsx` (help modal content)

**Step 1: Add a Playback section to the help modal**

Add after the "Pulse Lane" section:

```tsx
<section>
  <h3>Playback</h3>
  <ul>
    <li>▶ Play / ⏸ Pause / ⏹ Stop — in the toolbar</li>
    <li>Adjust tempo with the number input or slider (40-300 BPM)</li>
    <li>Tempo is independent from the score — use it for practice at different speeds</li>
    <li>Instruments are auto-detected from lane names (e.g. "Snare", "Kick", "Hi-Hat")</li>
    <li>The current measure is highlighted during playback</li>
  </ul>
</section>
```

**Step 2: Commit**

```bash
git -C /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox add src/components/Toolbar/Toolbar.tsx
git -C /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox commit -m "Add playback section to Help"
```

---

### Task 9: Final integration test and cleanup

**Step 1: Run full test suite**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run`
Expected: ALL PASS

**Step 2: Run linter**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx eslint src/`
Expected: No errors

**Step 3: Build for production**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npm run build`
Expected: Build succeeds, check `dist/` size is reasonable

**Step 4: Test the production build locally**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vite preview`
Verify playback works in the preview build.

**Step 5: Final commit if any cleanup needed**

```bash
git -C /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox add -A
git -C /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox commit -m "Final cleanup for playback feature"
```
