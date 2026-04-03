import { useCallback, useState } from 'react'
import type { Cell, CellSymbol, Score, TimeSignature } from '../model/types'
import { SYMBOL_CYCLE } from '../model/types'
import { createCell, createLane, createMeasure, createScore } from '../model/factory'

const PASTEL_COLORS = [
  '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA',
  '#E8BAFF', '#FFD9BA', '#BAFFF5', '#FFC9DE',
]

export function useScore() {
  const [score, setScore] = useState<Score>(() => createScore())
  const [isDirty, setIsDirty] = useState(false)

  const dirtyUpdate = useCallback((updater: (prev: Score) => Score) => {
    setScore(updater)
    setIsDirty(true)
  }, [])

  const addLane = useCallback((name: string) => {
    dirtyUpdate((prev) => {
      const colorIndex = prev.lanes.length % PASTEL_COLORS.length
      const lane = createLane(name, PASTEL_COLORS[colorIndex])
      const measures = prev.measures.map((m) => ({
        ...m,
        cells: {
          ...m.cells,
          [lane.id]: Array.from(
            { length: m.timeSignature.beats * m.timeSignature.subdivision },
            () => createCell(),
          ),
        },
      }))
      return { ...prev, lanes: [...prev.lanes, lane], measures }
    })
  }, [dirtyUpdate])

  const removeLane = useCallback((laneId: string) => {
    dirtyUpdate((prev) => {
      if (prev.lanes.length <= 1) return prev
      const lanes = prev.lanes.filter((l) => l.id !== laneId)
      const measures = prev.measures.map((m) => {
        const { [laneId]: _, ...rest } = m.cells
        return { ...m, cells: rest }
      })
      return { ...prev, lanes, measures }
    })
  }, [dirtyUpdate])

  const addMeasure = useCallback(() => {
    dirtyUpdate((prev) => {
      const lastMeasure = prev.measures[prev.measures.length - 1]
      const ts = lastMeasure.timeSignature
      const laneIds = prev.lanes.map((l) => l.id)
      const measure = createMeasure(laneIds, ts)
      return { ...prev, measures: [...prev.measures, measure] }
    })
  }, [dirtyUpdate])

  const insertMeasure = useCallback((index: number) => {
    dirtyUpdate((prev) => {
      const refMeasure = prev.measures[index] ?? prev.measures[prev.measures.length - 1]
      const ts = refMeasure.timeSignature
      const laneIds = prev.lanes.map((l) => l.id)
      const measure = createMeasure(laneIds, ts)
      const measures = [...prev.measures]
      measures.splice(index, 0, measure)
      return { ...prev, measures }
    })
  }, [dirtyUpdate])

  const removeMeasure = useCallback((measureId: string) => {
    dirtyUpdate((prev) => {
      if (prev.measures.length <= 1) return prev
      return { ...prev, measures: prev.measures.filter((m) => m.id !== measureId) }
    })
  }, [dirtyUpdate])

  const updateCells = useCallback(
    (measureId: string, laneId: string, updater: (cells: Cell[]) => Cell[]) => {
      dirtyUpdate((prev) => ({
        ...prev,
        measures: prev.measures.map((m) =>
          m.id !== measureId
            ? m
            : {
                ...m,
                cells: {
                  ...m.cells,
                  [laneId]: updater([...m.cells[laneId]]),
                },
              },
        ),
      }))
    },
    [dirtyUpdate],
  )

  const cycleCell = useCallback(
    (measureId: string, laneId: string, cellIndex: number) => {
      updateCells(measureId, laneId, (cells) => {
        const current = cells[cellIndex].symbol
        const idx = SYMBOL_CYCLE.indexOf(current)
        const next = SYMBOL_CYCLE[(idx + 1) % SYMBOL_CYCLE.length]
        cells[cellIndex] = { ...cells[cellIndex], symbol: next }
        return cells
      })
    },
    [updateCells],
  )

  const setCellSymbol = useCallback(
    (measureId: string, laneId: string, cellIndex: number, symbol: CellSymbol) => {
      updateCells(measureId, laneId, (cells) => {
        cells[cellIndex] = { ...cells[cellIndex], symbol }
        return cells
      })
    },
    [updateCells],
  )

  const setCellLabel = useCallback(
    (measureId: string, laneId: string, cellIndex: number, label: string) => {
      updateCells(measureId, laneId, (cells) => {
        cells[cellIndex] = { ...cells[cellIndex], label }
        return cells
      })
    },
    [updateCells],
  )

  const setTriplet = useCallback(
    (measureId: string, laneId: string, beatIndex: number) => {
      dirtyUpdate((prev) => ({
        ...prev,
        measures: prev.measures.map((m) => {
          if (m.id !== measureId) return m
          const cellIndex = beatIndex * m.timeSignature.subdivision
          const cells = [...m.cells[laneId]]
          cells[cellIndex] = { ...cells[cellIndex], triplet: true }
          return { ...m, cells: { ...m.cells, [laneId]: cells } }
        }),
      }))
    },
    [dirtyUpdate],
  )

  const setRoll = useCallback(
    (measureId: string, laneId: string, cellIndex: number, length: number) => {
      updateCells(measureId, laneId, (cells) => {
        cells[cellIndex] = { ...cells[cellIndex], roll: { length } }
        return cells
      })
    },
    [updateCells],
  )

  const setSectionLabel = useCallback(
    (measureId: string, label: string) => {
      dirtyUpdate((prev) => ({
        ...prev,
        measures: prev.measures.map((m) =>
          m.id !== measureId ? m : { ...m, sectionLabel: label || undefined },
        ),
      }))
    },
    [dirtyUpdate],
  )

  const setSectionLength = useCallback(
    (measureId: string, length: number) => {
      dirtyUpdate((prev) => ({
        ...prev,
        measures: prev.measures.map((m) =>
          m.id !== measureId ? m : { ...m, sectionLength: length },
        ),
      }))
    },
    [dirtyUpdate],
  )

  const setRepeat = useCallback(
    (measureId: string, times: number) => {
      dirtyUpdate((prev) => ({
        ...prev,
        measures: prev.measures.map((m) =>
          m.id !== measureId ? m : { ...m, repeat: { times } },
        ),
      }))
    },
    [dirtyUpdate],
  )

  const setTimeSignature = useCallback(
    (measureId: string, ts: TimeSignature) => {
      dirtyUpdate((prev) => ({
        ...prev,
        measures: prev.measures.map((m) => {
          if (m.id !== measureId) return m
          const laneIds = prev.lanes.map((l) => l.id)
          const totalCells = ts.beats * ts.subdivision
          const cells: Record<string, Cell[]> = {}
          for (const laneId of laneIds) {
            cells[laneId] = Array.from({ length: totalCells }, () => createCell())
          }
          return { ...m, timeSignature: ts, cells }
        }),
      }))
    },
    [dirtyUpdate],
  )

  const updateLane = useCallback(
    (laneId: string, updates: { name?: string; color?: string }) => {
      dirtyUpdate((prev) => ({
        ...prev,
        lanes: prev.lanes.map((l) =>
          l.id !== laneId ? l : { ...l, ...updates },
        ),
      }))
    },
    [dirtyUpdate],
  )

  const updateTitle = useCallback(
    (title: string) => {
      dirtyUpdate((prev) => ({ ...prev, title }))
    },
    [dirtyUpdate],
  )

  const loadScore = useCallback((newScore: Score) => {
    setScore(newScore)
    setIsDirty(false)
  }, [])

  const markClean = useCallback(() => {
    setIsDirty(false)
  }, [])

  return {
    score,
    isDirty,
    addLane,
    removeLane,
    addMeasure,
    insertMeasure,
    removeMeasure,
    cycleCell,
    setCellSymbol,
    setCellLabel,
    setTriplet,
    setRoll,
    setSectionLabel,
    setSectionLength,
    setRepeat,
    setTimeSignature,
    updateLane,
    updateTitle,
    loadScore,
    markClean,
  }
}
