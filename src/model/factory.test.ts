import { describe, it, expect } from 'vitest'
import { createCell, createMeasure, createLane, createScore } from './factory'

describe('createCell', () => {
  it('creates an empty cell', () => {
    const cell = createCell()
    expect(cell.symbol).toBeNull()
    expect(cell.label).toBeUndefined()
    expect(cell.triplet).toBeUndefined()
    expect(cell.roll).toBeUndefined()
  })
})

describe('createMeasure', () => {
  it('creates a measure with correct number of cells per lane', () => {
    const laneIds = ['lane-1', 'lane-2']
    const measure = createMeasure(laneIds, { beats: 4, subdivision: 4 })
    expect(measure.timeSignature).toEqual({ beats: 4, subdivision: 4 })
    expect(measure.cells['lane-1']).toHaveLength(16)
    expect(measure.cells['lane-2']).toHaveLength(16)
    expect(measure.cells['lane-1'][0].symbol).toBeNull()
  })

  it('creates a ternary measure with 12 cells', () => {
    const measure = createMeasure(['lane-1'], { beats: 4, subdivision: 3 })
    expect(measure.cells['lane-1']).toHaveLength(12)
  })
})

describe('createLane', () => {
  it('creates a lane with name and color', () => {
    const lane = createLane('Surdo', '#FFB3BA')
    expect(lane.name).toBe('Surdo')
    expect(lane.color).toBe('#FFB3BA')
    expect(lane.id).toBeTruthy()
  })
})

describe('createScore', () => {
  it('creates a default score with 1 lane and 1 measure', () => {
    const score = createScore()
    expect(score.title).toBe('Untitled Score')
    expect(score.lanes).toHaveLength(1)
    expect(score.measures).toHaveLength(1)
    expect(score.measures[0].cells[score.lanes[0].id]).toHaveLength(16)
  })
})
