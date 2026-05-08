import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useScore } from './useScore'
import { SYMBOL_CYCLE } from '../model/types'
import type { Score } from '../model/types'

describe('useScore', () => {
  it('initializes with default score (1 lane, 1 line, 1 measure)', () => {
    const { result } = renderHook(() => useScore())
    const { score, isDirty } = result.current

    expect(score.title).toBe('Untitled Score')
    expect(score.lanes).toHaveLength(1)
    expect(score.lines).toHaveLength(1)
    expect(score.lines[0]).toHaveLength(1)
    expect(isDirty).toBe(false)

    const lane = score.lanes[0]
    const measure = score.lines[0][0]
    expect(measure.cells[lane.id]).toHaveLength(16)
  })

  it('addLane creates new lane with cells in all lines', () => {
    const { result } = renderHook(() => useScore())

    act(() => result.current.addLane('Snare'))

    const { score } = result.current
    expect(score.lanes).toHaveLength(2)
    expect(score.lanes[1].name).toBe('Snare')
    expect(score.lanes[1].color).toBe('#BAFFC9')

    const newLaneId = score.lanes[1].id
    expect(score.lines[0][0].cells[newLaneId]).toHaveLength(16)
  })

  it('removeLane removes a lane but not the last one', () => {
    const { result } = renderHook(() => useScore())

    act(() => result.current.addLane('Snare'))
    const secondLaneId = result.current.score.lanes[1].id

    act(() => result.current.removeLane(secondLaneId))
    expect(result.current.score.lanes).toHaveLength(1)

    const lastLaneId = result.current.score.lanes[0].id
    act(() => result.current.removeLane(lastLaneId))
    expect(result.current.score.lanes).toHaveLength(1)
  })

  it('addMeasure adds a measure to the specified line', () => {
    const { result } = renderHook(() => useScore())

    act(() => result.current.addMeasure(0))

    expect(result.current.score.lines[0]).toHaveLength(2)
    const [first, second] = result.current.score.lines[0]
    expect(second.timeSignature).toEqual(first.timeSignature)
  })

  it('insertMeasure inserts at the given index in the specified line', () => {
    const { result } = renderHook(() => useScore())

    act(() => result.current.addMeasure(0))
    const originalFirstId = result.current.score.lines[0][0].id

    act(() => result.current.insertMeasure(0, 0))

    expect(result.current.score.lines[0]).toHaveLength(3)
    expect(result.current.score.lines[0][1].id).toBe(originalFirstId)
  })

  it('removeMeasure removes a measure from the specified line', () => {
    const { result } = renderHook(() => useScore())

    act(() => result.current.addMeasure(0))
    expect(result.current.score.lines[0]).toHaveLength(2)

    const firstId = result.current.score.lines[0][0].id
    act(() => result.current.removeMeasure(0, firstId))
    expect(result.current.score.lines[0]).toHaveLength(1)

    // Try removing the last measure in the only line - no-op
    const lastId = result.current.score.lines[0][0].id
    act(() => result.current.removeMeasure(0, lastId))
    expect(result.current.score.lines[0]).toHaveLength(1)
  })

  it('addLine creates a new line with one measure', () => {
    const { result } = renderHook(() => useScore())

    act(() => result.current.addLine())

    expect(result.current.score.lines).toHaveLength(2)
    expect(result.current.score.lines[1]).toHaveLength(1)
    expect(result.current.score.lines[1][0].timeSignature).toEqual(
      result.current.score.lines[0][0].timeSignature,
    )
  })

  it('cycleCell cycles through SYMBOL_CYCLE', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.lines[0][0].id
    const laneId = result.current.score.lanes[0].id

    for (let i = 0; i < SYMBOL_CYCLE.length; i++) {
      const expectedSymbol = SYMBOL_CYCLE[(i + 1) % SYMBOL_CYCLE.length]
      act(() => result.current.cycleCell(0, measureId, laneId, 0))
      expect(result.current.score.lines[0][0].cells[laneId][0].symbol).toBe(expectedSymbol)
    }
  })

  it('setCellSymbol sets a specific symbol', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.lines[0][0].id
    const laneId = result.current.score.lanes[0].id

    act(() => result.current.setCellSymbol(0, measureId, laneId, 0, 'diamond'))
    expect(result.current.score.lines[0][0].cells[laneId][0].symbol).toBe('diamond')
  })

  it('setCellLabel sets label on a cell', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.lines[0][0].id
    const laneId = result.current.score.lanes[0].id

    act(() => result.current.setCellLabel(0, measureId, laneId, 2, 'R'))
    expect(result.current.score.lines[0][0].cells[laneId][2].label).toBe('R')
  })

  it('setSectionLabel sets section label on a measure', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.lines[0][0].id

    act(() => result.current.setSectionLabel(0, measureId, 'Chorus'))
    expect(result.current.score.lines[0][0].sectionLabel).toBe('Chorus')
  })

  it('setSectionLabel with empty string clears label, sectionLength, and repeat together', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.lines[0][0].id

    act(() => result.current.setSectionLabel(0, measureId, 'Chorus'))
    act(() => result.current.setSectionLength(0, measureId, 1))
    act(() => result.current.setRepeat(0, measureId, 4))
    expect(result.current.score.lines[0][0].sectionLabel).toBe('Chorus')
    expect(result.current.score.lines[0][0].repeat).toEqual({ times: 4 })

    act(() => result.current.setSectionLabel(0, measureId, ''))
    const measure = result.current.score.lines[0][0]
    expect(measure.sectionLabel).toBeUndefined()
    expect(measure.sectionLength).toBeUndefined()
    expect(measure.repeat).toBeUndefined()
  })

  it('setSectionLength grows the line if length exceeds remaining measures', () => {
    const { result } = renderHook(() => useScore())
    const firstId = result.current.score.lines[0][0].id

    expect(result.current.score.lines[0]).toHaveLength(1)

    act(() => result.current.setSectionLength(0, firstId, 3))

    expect(result.current.score.lines[0]).toHaveLength(3)
    expect(result.current.score.lines[0][0].sectionLength).toBe(3)
    expect(result.current.score.lines[0][1].timeSignature).toEqual(
      result.current.score.lines[0][0].timeSignature,
    )
    expect(result.current.score.lines[0][2].timeSignature).toEqual(
      result.current.score.lines[0][0].timeSignature,
    )
  })

  it('setSectionLength does not add measures when length fits in remaining', () => {
    const { result } = renderHook(() => useScore())
    act(() => result.current.addMeasure(0))
    act(() => result.current.addMeasure(0))
    expect(result.current.score.lines[0]).toHaveLength(3)

    const firstId = result.current.score.lines[0][0].id
    act(() => result.current.setSectionLength(0, firstId, 2))

    expect(result.current.score.lines[0]).toHaveLength(3)
    expect(result.current.score.lines[0][0].sectionLength).toBe(2)
  })

  it('setFlam sets and clears the flam flag on a cell', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.lines[0][0].id
    const laneId = result.current.score.lanes[0].id

    act(() => result.current.setCellSymbol(0, measureId, laneId, 0, 'cross'))
    expect(result.current.score.lines[0][0].cells[laneId][0].flam).toBeUndefined()

    act(() => result.current.setFlam(0, measureId, laneId, 0, true))
    expect(result.current.score.lines[0][0].cells[laneId][0].flam).toBe(true)

    act(() => result.current.setFlam(0, measureId, laneId, 0, false))
    expect(result.current.score.lines[0][0].cells[laneId][0].flam).toBeUndefined()
  })

  it('setRepeat sets repeat on a measure', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.lines[0][0].id

    act(() => result.current.setRepeat(0, measureId, 4))
    expect(result.current.score.lines[0][0].repeat).toEqual({ times: 4 })
  })

  it('setTimeSignature changes time sig and rebuilds cells', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.lines[0][0].id
    const laneId = result.current.score.lanes[0].id

    act(() => result.current.setCellSymbol(0, measureId, laneId, 0, 'cross'))

    act(() => result.current.setTimeSignature(0, measureId, { beats: 3, subdivision: 3 }))

    const measure = result.current.score.lines[0][0]
    expect(measure.timeSignature).toEqual({ beats: 3, subdivision: 3 })
    expect(measure.cells[laneId]).toHaveLength(9)
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

    act(() => result.current.updateTitle('Dirty'))
    expect(result.current.isDirty).toBe(true)

    const newScore: Score = {
      title: 'Loaded Score',
      author: 'Test',
      tempo: 140,
      lanes: [{ id: 'lane-1', name: 'Kick', color: '#000' }],
      lines: [
        [
          {
            id: 'measure-1',
            timeSignature: { beats: 4, subdivision: 4 },
            cells: { 'lane-1': Array.from({ length: 16 }, () => ({ symbol: null })) },
          },
        ],
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

  it('setTriplet toggles triplet on a beat and resizes cells', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.lines[0][0].id
    const laneId = result.current.score.lanes[0].id

    expect(result.current.score.lines[0][0].cells[laneId]).toHaveLength(16)

    act(() => result.current.setTriplet(0, measureId, laneId, 1))
    expect(result.current.score.lines[0][0].cells[laneId]).toHaveLength(15)
    expect(result.current.score.lines[0][0].tripletBeats?.[laneId]).toContain(1)

    act(() => result.current.setTriplet(0, measureId, laneId, 1))
    expect(result.current.score.lines[0][0].cells[laneId]).toHaveLength(16)
    expect(result.current.score.lines[0][0].tripletBeats?.[laneId]).not.toContain(1)
  })

  it('setRoll sets roll on a cell', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.lines[0][0].id
    const laneId = result.current.score.lanes[0].id

    act(() => result.current.setRoll(0, measureId, laneId, 3, 2))
    expect(result.current.score.lines[0][0].cells[laneId][3].roll).toEqual({ length: 2 })
  })
})
