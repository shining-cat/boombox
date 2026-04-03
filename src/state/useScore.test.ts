import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useScore } from './useScore'
import { SYMBOL_CYCLE } from '../model/types'
import type { Score } from '../model/types'

describe('useScore', () => {
  it('initializes with default score (1 lane, 1 measure)', () => {
    const { result } = renderHook(() => useScore())
    const { score, isDirty } = result.current

    expect(score.title).toBe('Untitled Score')
    expect(score.lanes).toHaveLength(1)
    expect(score.measures).toHaveLength(1)
    expect(isDirty).toBe(false)

    const lane = score.lanes[0]
    const measure = score.measures[0]
    expect(measure.cells[lane.id]).toHaveLength(16) // 4 beats * 4 subdivision
  })

  it('addLane creates new lane with cells in existing measures', () => {
    const { result } = renderHook(() => useScore())

    act(() => result.current.addLane('Snare'))

    const { score } = result.current
    expect(score.lanes).toHaveLength(2)
    expect(score.lanes[1].name).toBe('Snare')
    expect(score.lanes[1].color).toBe('#BAFFC9') // second pastel color

    const newLaneId = score.lanes[1].id
    expect(score.measures[0].cells[newLaneId]).toHaveLength(16)
  })

  it('removeLane removes a lane but not the last one', () => {
    const { result } = renderHook(() => useScore())

    // Add a second lane first
    act(() => result.current.addLane('Snare'))
    const secondLaneId = result.current.score.lanes[1].id

    act(() => result.current.removeLane(secondLaneId))
    expect(result.current.score.lanes).toHaveLength(1)

    // Try removing the last lane - should be a no-op
    const lastLaneId = result.current.score.lanes[0].id
    act(() => result.current.removeLane(lastLaneId))
    expect(result.current.score.lanes).toHaveLength(1)
  })

  it('addMeasure adds a measure copying time signature from last', () => {
    const { result } = renderHook(() => useScore())

    act(() => result.current.addMeasure())

    expect(result.current.score.measures).toHaveLength(2)
    const [first, second] = result.current.score.measures
    expect(second.timeSignature).toEqual(first.timeSignature)
  })

  it('insertMeasure inserts at the given index', () => {
    const { result } = renderHook(() => useScore())

    act(() => result.current.addMeasure())
    const originalFirstId = result.current.score.measures[0].id

    act(() => result.current.insertMeasure(0))

    expect(result.current.score.measures).toHaveLength(3)
    expect(result.current.score.measures[1].id).toBe(originalFirstId)
  })

  it('removeMeasure removes a measure but not the last one', () => {
    const { result } = renderHook(() => useScore())

    act(() => result.current.addMeasure())
    expect(result.current.score.measures).toHaveLength(2)

    const firstId = result.current.score.measures[0].id
    act(() => result.current.removeMeasure(firstId))
    expect(result.current.score.measures).toHaveLength(1)

    // Try removing the last - no-op
    const lastId = result.current.score.measures[0].id
    act(() => result.current.removeMeasure(lastId))
    expect(result.current.score.measures).toHaveLength(1)
  })

  it('cycleCell cycles through SYMBOL_CYCLE', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.measures[0].id
    const laneId = result.current.score.lanes[0].id

    // Start at null (index 0), cycle through all symbols
    for (let i = 0; i < SYMBOL_CYCLE.length; i++) {
      const expectedSymbol = SYMBOL_CYCLE[(i + 1) % SYMBOL_CYCLE.length]
      act(() => result.current.cycleCell(measureId, laneId, 0))
      expect(result.current.score.measures[0].cells[laneId][0].symbol).toBe(expectedSymbol)
    }
  })

  it('setCellSymbol sets a specific symbol', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.measures[0].id
    const laneId = result.current.score.lanes[0].id

    act(() => result.current.setCellSymbol(measureId, laneId, 0, 'diamond'))
    expect(result.current.score.measures[0].cells[laneId][0].symbol).toBe('diamond')
  })

  it('setCellLabel sets label on a cell', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.measures[0].id
    const laneId = result.current.score.lanes[0].id

    act(() => result.current.setCellLabel(measureId, laneId, 2, 'R'))
    expect(result.current.score.measures[0].cells[laneId][2].label).toBe('R')
  })

  it('setSectionLabel sets section label on a measure', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.measures[0].id

    act(() => result.current.setSectionLabel(measureId, 'Chorus'))
    expect(result.current.score.measures[0].sectionLabel).toBe('Chorus')
  })

  it('setRepeat sets repeat on a measure', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.measures[0].id

    act(() => result.current.setRepeat(measureId, 4))
    expect(result.current.score.measures[0].repeat).toEqual({ times: 4 })
  })

  it('setTimeSignature changes time sig and rebuilds cells', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.measures[0].id
    const laneId = result.current.score.lanes[0].id

    // Set a symbol first to verify cells are rebuilt empty
    act(() => result.current.setCellSymbol(measureId, laneId, 0, 'cross'))

    act(() => result.current.setTimeSignature(measureId, { beats: 3, subdivision: 3 }))

    const measure = result.current.score.measures[0]
    expect(measure.timeSignature).toEqual({ beats: 3, subdivision: 3 })
    expect(measure.cells[laneId]).toHaveLength(9)
    // All cells should be empty after rebuild
    expect(measure.cells[laneId].every((c) => c.symbol === null)).toBe(true)
  })

  it('updateLane updates name and color', () => {
    const { result } = renderHook(() => useScore())
    const laneId = result.current.score.lanes[0].id

    act(() => result.current.updateLane(laneId, { name: 'Hi-Hat', color: '#FF0000' }))

    const lane = result.current.score.lanes[0]
    expect(lane.name).toBe('Hi-Hat')
    expect(lane.color).toBe('#FF0000')
  })

  it('updateTitle updates the score title', () => {
    const { result } = renderHook(() => useScore())

    act(() => result.current.updateTitle('My Song'))
    expect(result.current.score.title).toBe('My Song')
  })

  it('loadScore replaces entire score and sets isDirty to false', () => {
    const { result } = renderHook(() => useScore())

    // Make dirty first
    act(() => result.current.updateTitle('Dirty'))
    expect(result.current.isDirty).toBe(true)

    const newScore: Score = {
      title: 'Loaded Score',
      author: 'Test',
      tempo: 140,
      lanes: [{ id: 'lane-1', name: 'Kick', color: '#000' }],
      measures: [
        {
          id: 'measure-1',
          timeSignature: { beats: 4, subdivision: 4 },
          cells: { 'lane-1': Array.from({ length: 16 }, () => ({ symbol: null })) },
        },
      ],
    }

    act(() => result.current.loadScore(newScore))

    expect(result.current.score.title).toBe('Loaded Score')
    expect(result.current.isDirty).toBe(false)
  })

  it('isDirty tracks correctly: false initially, true after edit, false after markClean', () => {
    const { result } = renderHook(() => useScore())

    expect(result.current.isDirty).toBe(false)

    act(() => result.current.updateTitle('Changed'))
    expect(result.current.isDirty).toBe(true)

    act(() => result.current.markClean())
    expect(result.current.isDirty).toBe(false)
  })

  it('setTriplet marks cell at beatIndex * subdivision as triplet', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.measures[0].id
    const laneId = result.current.score.lanes[0].id

    // beatIndex 1 with subdivision 4 => cellIndex 4
    act(() => result.current.setTriplet(measureId, laneId, 1))
    expect(result.current.score.measures[0].cells[laneId][4].triplet).toBe(true)
  })

  it('setRoll sets roll on a cell', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.measures[0].id
    const laneId = result.current.score.lanes[0].id

    act(() => result.current.setRoll(measureId, laneId, 3, 2))
    expect(result.current.score.measures[0].cells[laneId][3].roll).toEqual({ length: 2 })
  })
})
