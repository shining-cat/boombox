import { describe, it, expect } from 'vitest'
import { generateMidi } from './midiExport'
import type { Score } from '../model/types'
import { createLane, createMeasure } from '../model/factory'
import { DEFAULT_SYMBOL_VELOCITIES } from '../model/midiMappings'

function makeScore(symbol: 'cross' | 'double-cross'): Score {
  const lane = createLane('Test')
  const measure = createMeasure([lane.id], { beats: 1, subdivision: 1 })
  measure.cells[lane.id] = [{ symbol }]
  return {
    title: 'Test',
    author: '',
    tempo: 120,
    lanes: [lane],
    lines: [[measure]],
  }
}

describe('generateMidi — double symbols', () => {
  it('produces a non-empty buffer for a plain cross cell', () => {
    const buffer = generateMidi(makeScore('cross'), {
      tempo: 120,
      instrumentMap: { [makeScore('cross').lanes[0].id]: 38 },
      velocityMap: { ...DEFAULT_SYMBOL_VELOCITIES },
    })
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('emits more bytes for a double-cross than for a plain cross', () => {
    const singleScore = makeScore('cross')
    const doubleScore = makeScore('double-cross')

    const single = generateMidi(singleScore, {
      tempo: 120,
      instrumentMap: { [singleScore.lanes[0].id]: 38 },
      velocityMap: { ...DEFAULT_SYMBOL_VELOCITIES },
    })
    const double = generateMidi(doubleScore, {
      tempo: 120,
      instrumentMap: { [doubleScore.lanes[0].id]: 38 },
      velocityMap: { ...DEFAULT_SYMBOL_VELOCITIES },
    })

    // Double-cross should produce additional NoteOn/NoteOff events,
    // so the binary buffer is strictly larger.
    expect(double.length).toBeGreaterThan(single.length)
  })
})
