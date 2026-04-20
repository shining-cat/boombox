import { describe, it, expect } from 'vitest'
import { flattenMeasures } from './scoreUtils'
import type { Measure, Score } from '../model/types'

function makeMeasure(id: string, overrides?: Partial<Measure>): Measure {
  return {
    id,
    timeSignature: { beats: 4, subdivision: 4 },
    cells: {},
    ...overrides,
  }
}

function makeScore(lines: Measure[][]): Score {
  return { title: '', author: '', tempo: 120, lanes: [], lines }
}

describe('flattenMeasures', () => {
  it('returns measures unchanged when there are no sections or repeats', () => {
    const m1 = makeMeasure('m1')
    const m2 = makeMeasure('m2')
    const score = makeScore([[m1, m2]])
    expect(flattenMeasures(score)).toEqual([m1, m2])
  })

  it('repeats a single-measure section', () => {
    const m1 = makeMeasure('m1', {
      sectionLabel: 'A',
      sectionLength: 1,
      repeat: { times: 3 },
    })
    const score = makeScore([[m1]])
    expect(flattenMeasures(score)).toEqual([m1, m1, m1])
  })

  it('repeats a multi-measure section', () => {
    const m1 = makeMeasure('m1', {
      sectionLabel: 'A',
      sectionLength: 2,
      repeat: { times: 2 },
    })
    const m2 = makeMeasure('m2')
    const score = makeScore([[m1, m2]])
    expect(flattenMeasures(score)).toEqual([m1, m2, m1, m2])
  })

  it('defaults repeat times to 1 when section has label but no repeat', () => {
    const m1 = makeMeasure('m1', {
      sectionLabel: 'A',
      sectionLength: 1,
    })
    const score = makeScore([[m1]])
    expect(flattenMeasures(score)).toEqual([m1])
  })

  it('defaults sectionLength to 1 when not specified', () => {
    const m1 = makeMeasure('m1', {
      sectionLabel: 'A',
      repeat: { times: 2 },
    })
    const m2 = makeMeasure('m2')
    const score = makeScore([[m1, m2]])
    expect(flattenMeasures(score)).toEqual([m1, m1, m2])
  })

  it('clamps sectionLength to remaining measures in line', () => {
    const m1 = makeMeasure('m1', {
      sectionLabel: 'A',
      sectionLength: 10, // way more than available
      repeat: { times: 2 },
    })
    const m2 = makeMeasure('m2')
    const score = makeScore([[m1, m2]])
    // sectionLength clamped to 2 (line.length - startIndex)
    expect(flattenMeasures(score)).toEqual([m1, m2, m1, m2])
  })

  it('handles multiple sections in one line', () => {
    const mA1 = makeMeasure('a1', {
      sectionLabel: 'A',
      sectionLength: 1,
      repeat: { times: 2 },
    })
    const mB1 = makeMeasure('b1', {
      sectionLabel: 'B',
      sectionLength: 1,
      repeat: { times: 3 },
    })
    const score = makeScore([[mA1, mB1]])
    expect(flattenMeasures(score)).toEqual([mA1, mA1, mB1, mB1, mB1])
  })

  it('handles non-section measures between sections', () => {
    const mA = makeMeasure('a', {
      sectionLabel: 'A',
      sectionLength: 1,
      repeat: { times: 2 },
    })
    const mPlain = makeMeasure('plain')
    const mB = makeMeasure('b', {
      sectionLabel: 'B',
      sectionLength: 1,
      repeat: { times: 2 },
    })
    const score = makeScore([[mA, mPlain, mB]])
    expect(flattenMeasures(score)).toEqual([mA, mA, mPlain, mB, mB])
  })

  it('concatenates measures from multiple lines', () => {
    const m1 = makeMeasure('m1')
    const m2 = makeMeasure('m2')
    const m3 = makeMeasure('m3')
    const score = makeScore([[m1], [m2, m3]])
    expect(flattenMeasures(score)).toEqual([m1, m2, m3])
  })

  it('handles repeats across multiple lines', () => {
    const m1 = makeMeasure('m1', {
      sectionLabel: 'A',
      sectionLength: 1,
      repeat: { times: 2 },
    })
    const m2 = makeMeasure('m2', {
      sectionLabel: 'B',
      sectionLength: 1,
      repeat: { times: 3 },
    })
    const score = makeScore([[m1], [m2]])
    expect(flattenMeasures(score)).toEqual([m1, m1, m2, m2, m2])
  })

  it('returns empty array for score with no lines', () => {
    const score = makeScore([])
    expect(flattenMeasures(score)).toEqual([])
  })

  it('returns empty array for score with empty lines', () => {
    const score = makeScore([[]])
    expect(flattenMeasures(score)).toEqual([])
  })
})
