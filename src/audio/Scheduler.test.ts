import { describe, it, expect } from 'vitest'
import { buildNoteEvents } from './Scheduler'
import type { Score } from '../model/types'
import { createLane, createMeasure } from '../model/factory'

describe('buildNoteEvents', () => {
  it('generates events for each non-empty cell and skips null symbols', () => {
    const lane = createLane('Snare')
    const measure = createMeasure([lane.id], { beats: 4, subdivision: 1 })
    // Set cells: cross, null, cross, null
    measure.cells[lane.id] = [
      { symbol: 'cross' },
      { symbol: null },
      { symbol: 'cross' },
      { symbol: null },
    ]

    const score: Score = {
      title: 'Test',
      author: '',
      tempo: 120,
      lanes: [lane],
      lines: [[measure]],
    }

    const instrumentMap: Record<string, number> = { [lane.id]: 38 }
    const events = buildNoteEvents(score, instrumentMap, 120)

    // Should only have 2 events (the two 'cross' cells, skipping nulls)
    expect(events).toHaveLength(2)
    expect(events[0].note).toBe(38)
    expect(events[1].note).toBe(38)
  })

  it('returns correct timing for different tempos', () => {
    const lane = createLane('Kick')
    // subdivision=1 means one cell per beat
    const measure = createMeasure([lane.id], { beats: 4, subdivision: 1 })
    measure.cells[lane.id] = [
      { symbol: 'cross' },
      { symbol: 'cross' },
      { symbol: 'cross' },
      { symbol: 'cross' },
    ]

    const score: Score = {
      title: 'Test',
      author: '',
      tempo: 120, // will be overridden by tempo param
      lanes: [lane],
      lines: [[measure]],
    }
    const instrumentMap: Record<string, number> = { [lane.id]: 36 }

    // At 120 BPM: one beat = 0.5s, cellDuration = beat / subdivision = 0.5 / 1 = 0.5s
    const events120 = buildNoteEvents(score, instrumentMap, 120)
    expect(events120).toHaveLength(4)
    expect(events120[0].time).toBeCloseTo(0, 5)
    expect(events120[1].time).toBeCloseTo(0.5, 5)
    expect(events120[2].time).toBeCloseTo(1.0, 5)
    expect(events120[3].time).toBeCloseTo(1.5, 5)

    // At 60 BPM: one beat = 1.0s, cellDuration = 1.0 / 1 = 1.0s
    const events60 = buildNoteEvents(score, instrumentMap, 60)
    expect(events60).toHaveLength(4)
    expect(events60[0].time).toBeCloseTo(0, 5)
    expect(events60[1].time).toBeCloseTo(1.0, 5)
    expect(events60[2].time).toBeCloseTo(2.0, 5)
    expect(events60[3].time).toBeCloseTo(3.0, 5)
  })

  it('includes velocity from symbol mapping', () => {
    const lane = createLane('HiHat')
    const measure = createMeasure([lane.id], { beats: 3, subdivision: 1 })
    measure.cells[lane.id] = [
      { symbol: 'dot' },        // velocity 30/127
      { symbol: 'cross' },      // velocity 127/127
      { symbol: 'full-round' }, // velocity 110/127
    ]

    const score: Score = {
      title: 'Test',
      author: '',
      tempo: 120,
      lanes: [lane],
      lines: [[measure]],
    }
    const instrumentMap: Record<string, number> = { [lane.id]: 42 }

    const events = buildNoteEvents(score, instrumentMap, 120)
    expect(events).toHaveLength(3)
    expect(events[0].velocity).toBeCloseTo(30 / 127, 5)
    expect(events[1].velocity).toBeCloseTo(127 / 127, 5)
    expect(events[2].velocity).toBeCloseTo(110 / 127, 5)
  })

  it('tracks measure index for visual feedback', () => {
    const lane = createLane('Snare')
    const measure1 = createMeasure([lane.id], { beats: 2, subdivision: 1 })
    measure1.cells[lane.id] = [{ symbol: 'cross' }, { symbol: null }]

    const measure2 = createMeasure([lane.id], { beats: 2, subdivision: 1 })
    measure2.cells[lane.id] = [{ symbol: null }, { symbol: 'cross' }]

    const score: Score = {
      title: 'Test',
      author: '',
      tempo: 120,
      lanes: [lane],
      lines: [[measure1, measure2]],
    }
    const instrumentMap: Record<string, number> = { [lane.id]: 38 }

    const events = buildNoteEvents(score, instrumentMap, 120)
    expect(events).toHaveLength(2)
    // First event from measure 0, second from measure 1
    expect(events[0].measureIndex).toBe(0)
    expect(events[1].measureIndex).toBe(1)
  })
})

describe('buildNoteEvents — double symbols', () => {
  it('emits 2 events for a double-cross cell at correct times and equal velocities', () => {
    const lane = createLane('Snare')
    // 1 beat, 1 subdivision → cellDuration = beatDuration = 60/120 = 0.5s at tempo 120
    const measure = createMeasure([lane.id], { beats: 1, subdivision: 1 })
    measure.cells[lane.id] = [{ symbol: 'double-cross' }]

    const score: Score = {
      title: 'Test', author: '', tempo: 120, lanes: [lane], lines: [[measure]],
    }
    const events = buildNoteEvents(score, { [lane.id]: 38 }, 120)

    expect(events).toHaveLength(2)
    expect(events[0].time).toBeCloseTo(0, 5)
    expect(events[1].time).toBeCloseTo(0.25, 5) // cellDuration (0.5) / 2
    expect(events[0].velocity).toBeCloseTo(events[1].velocity, 5)
    expect(events[0].velocity).toBeCloseTo(127 / 127, 5) // double-cross full velocity
  })

  it('emits 2 events for a double-full-round cell at correct velocities', () => {
    const lane = createLane('Kick')
    const measure = createMeasure([lane.id], { beats: 1, subdivision: 1 })
    measure.cells[lane.id] = [{ symbol: 'double-full-round' }]

    const score: Score = {
      title: 'Test', author: '', tempo: 120, lanes: [lane], lines: [[measure]],
    }
    const events = buildNoteEvents(score, { [lane.id]: 36 }, 120)

    expect(events).toHaveLength(2)
    expect(events[0].velocity).toBeCloseTo(110 / 127, 5)
  })

  it('uses triplet cell duration for spacing inside a triplet beat', () => {
    const lane = createLane('Snare')
    const measure = createMeasure([lane.id], { beats: 1, subdivision: 4 })
    measure.cells[lane.id] = [
      { symbol: 'double-cross' },
      { symbol: null },
      { symbol: null },
    ]
    measure.tripletBeats = { [lane.id]: [0] }

    const score: Score = {
      title: 'Test', author: '', tempo: 120, lanes: [lane], lines: [[measure]],
    }
    const events = buildNoteEvents(score, { [lane.id]: 38 }, 120)

    // beatDuration=0.5, cellsInBeat=3 (triplet), cellDuration=0.5/3 ≈ 0.1667
    // Second stroke at cellDuration/2 ≈ 0.0833
    expect(events).toHaveLength(2)
    expect(events[0].time).toBeCloseTo(0, 5)
    expect(events[1].time).toBeCloseTo(0.5 / 3 / 2, 5)
  })

  it('emits roll only (not double) when cell has both roll and double symbol', () => {
    const lane = createLane('Snare')
    const measure = createMeasure([lane.id], { beats: 1, subdivision: 1 })
    measure.cells[lane.id] = [{ symbol: 'double-cross', roll: { length: 1 } }]

    const score: Score = {
      title: 'Test', author: '', tempo: 120, lanes: [lane], lines: [[measure]],
    }
    const events = buildNoteEvents(score, { [lane.id]: 38 }, 120)

    // Roll path emits ~25/sec across the roll span (cellDuration=0.5 → ~12 events).
    expect(events.length).toBeGreaterThan(2)
  })
})

describe('buildNoteEvents — flam', () => {
  it('emits 2 events for a flam-cross cell (grace 30ms before, half velocity)', () => {
    const lane = createLane('Snare')
    const measure = createMeasure([lane.id], { beats: 1, subdivision: 1 })
    measure.cells[lane.id] = [{ symbol: 'cross', flam: true }]

    const score: Score = {
      title: 'Test', author: '', tempo: 120, lanes: [lane], lines: [[measure]],
    }
    const events = buildNoteEvents(score, { [lane.id]: 38 }, 120)

    expect(events).toHaveLength(2)
    expect(events[0].time).toBeCloseTo(-0.030, 5)
    expect(events[1].time).toBeCloseTo(0, 5)
    expect(events[0].velocity).toBeCloseTo((127 / 127) * 0.5, 5)
    expect(events[1].velocity).toBeCloseTo(127 / 127, 5)
  })

  it('emits 0 events when flam is set on an empty cell (no symbol)', () => {
    const lane = createLane('Snare')
    const measure = createMeasure([lane.id], { beats: 1, subdivision: 1 })
    measure.cells[lane.id] = [{ symbol: null, flam: true }]

    const score: Score = {
      title: 'Test', author: '', tempo: 120, lanes: [lane], lines: [[measure]],
    }
    const events = buildNoteEvents(score, { [lane.id]: 38 }, 120)

    expect(events).toHaveLength(0)
  })

  it('emits roll only when cell has both flam and roll', () => {
    const lane = createLane('Snare')
    const measure = createMeasure([lane.id], { beats: 1, subdivision: 1 })
    measure.cells[lane.id] = [{ symbol: 'cross', flam: true, roll: { length: 1 } }]

    const score: Score = {
      title: 'Test', author: '', tempo: 120, lanes: [lane], lines: [[measure]],
    }
    const events = buildNoteEvents(score, { [lane.id]: 38 }, 120)

    expect(events.length).toBeGreaterThan(2)
  })
})
