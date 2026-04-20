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
