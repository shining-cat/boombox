import { useCallback, useState } from 'react'
import type { Cell, CellSymbol, Measure, Score, TimeSignature } from '../model/types'
import type { RhythmTemplate } from '../model/templates'
import { SYMBOL_CYCLE } from '../model/types'
import { createCell, createLane, createMeasure, createScore } from '../model/factory'

const PASTEL_COLORS = [
  '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA',
  '#E8BAFF', '#FFD9BA', '#BAFFF5', '#FFC9DE',
]

function mapLine(
  lines: Measure[][],
  lineIndex: number,
  mapper: (measures: Measure[]) => Measure[],
): Measure[][] {
  return lines.map((line, li) => (li !== lineIndex ? line : mapper(line)))
}

function mapMeasuresInLine(
  lines: Measure[][],
  lineIndex: number,
  mapper: (m: Measure) => Measure,
): Measure[][] {
  return mapLine(lines, lineIndex, (line) => line.map(mapper))
}

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
      const lines = prev.lines.map((line) =>
        line.map((m) => ({
          ...m,
          cells: {
            ...m.cells,
            [lane.id]: Array.from(
              { length: m.timeSignature.beats * m.timeSignature.subdivision },
              () => createCell(),
            ),
          },
        })),
      )
      return { ...prev, lanes: [...prev.lanes, lane], lines }
    })
  }, [dirtyUpdate])

  const removeLane = useCallback((laneId: string) => {
    dirtyUpdate((prev) => {
      if (prev.lanes.length <= 1) return prev
      const lanes = prev.lanes.filter((l) => l.id !== laneId)
      const lines = prev.lines.map((line) =>
        line.map((m) => {
          const { [laneId]: _, ...rest } = m.cells
          const tripletBeats = m.tripletBeats
            ? (() => { const { [laneId]: __, ...tb } = m.tripletBeats!; return Object.keys(tb).length ? tb : undefined })()
            : undefined
          return { ...m, cells: rest, tripletBeats }
        }),
      )
      return { ...prev, lanes, lines }
    })
  }, [dirtyUpdate])

  const addMeasure = useCallback((lineIndex: number) => {
    dirtyUpdate((prev) => {
      const line = prev.lines[lineIndex]
      const lastMeasure = line[line.length - 1]
      const ts = lastMeasure.timeSignature
      const laneIds = prev.lanes.map((l) => l.id)
      const measure = createMeasure(laneIds, ts)
      return { ...prev, lines: mapLine(prev.lines, lineIndex, (l) => [...l, measure]) }
    })
  }, [dirtyUpdate])

  const insertMeasure = useCallback((lineIndex: number, index: number) => {
    dirtyUpdate((prev) => {
      const line = prev.lines[lineIndex]
      const refMeasure = line[index] ?? line[line.length - 1]
      const ts = refMeasure.timeSignature
      const laneIds = prev.lanes.map((l) => l.id)
      const measure = createMeasure(laneIds, ts)
      return {
        ...prev,
        lines: mapLine(prev.lines, lineIndex, (l) => {
          const newLine = [...l]
          newLine.splice(index, 0, measure)
          return newLine
        }),
      }
    })
  }, [dirtyUpdate])

  const removeMeasure = useCallback((lineIndex: number, measureId: string) => {
    dirtyUpdate((prev) => {
      const line = prev.lines[lineIndex]
      if (line.length <= 1) {
        // Last measure in line: remove the line (unless it's the only line)
        if (prev.lines.length <= 1) return prev
        return { ...prev, lines: prev.lines.filter((_, li) => li !== lineIndex) }
      }
      return {
        ...prev,
        lines: mapLine(prev.lines, lineIndex, (l) => l.filter((m) => m.id !== measureId)),
      }
    })
  }, [dirtyUpdate])

  const addLine = useCallback(() => {
    dirtyUpdate((prev) => {
      const lastLine = prev.lines[prev.lines.length - 1]
      const lastMeasure = lastLine[lastLine.length - 1]
      const ts = lastMeasure.timeSignature
      const laneIds = prev.lanes.map((l) => l.id)
      const measure = createMeasure(laneIds, ts)
      return { ...prev, lines: [...prev.lines, [measure]] }
    })
  }, [dirtyUpdate])

  const updateCells = useCallback(
    (lineIndex: number, measureId: string, laneId: string, updater: (cells: Cell[]) => Cell[]) => {
      dirtyUpdate((prev) => ({
        ...prev,
        lines: mapMeasuresInLine(prev.lines, lineIndex, (m) =>
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
    (lineIndex: number, measureId: string, laneId: string, cellIndex: number) => {
      updateCells(lineIndex, measureId, laneId, (cells) => {
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
    (lineIndex: number, measureId: string, laneId: string, cellIndex: number, symbol: CellSymbol) => {
      updateCells(lineIndex, measureId, laneId, (cells) => {
        cells[cellIndex] = { ...cells[cellIndex], symbol }
        return cells
      })
    },
    [updateCells],
  )

  const setCellLabel = useCallback(
    (lineIndex: number, measureId: string, laneId: string, cellIndex: number, label: string) => {
      updateCells(lineIndex, measureId, laneId, (cells) => {
        cells[cellIndex] = { ...cells[cellIndex], label }
        return cells
      })
    },
    [updateCells],
  )

  const setTriplet = useCallback(
    (lineIndex: number, measureId: string, laneId: string, beatIndex: number) => {
      dirtyUpdate((prev) => ({
        ...prev,
        lines: mapMeasuresInLine(prev.lines, lineIndex, (m) => {
          if (m.id !== measureId) return m
          const { subdivision, beats } = m.timeSignature
          if (beatIndex < 0 || beatIndex >= beats) return m

          const laneTriplets = m.tripletBeats?.[laneId] ?? []
          const wasTriplet = laneTriplets.includes(beatIndex)
          const newTriplets = wasTriplet
            ? laneTriplets.filter((b) => b !== beatIndex)
            : [...laneTriplets, beatIndex]

          const oldCells = m.cells[laneId] ?? []
          const newCells: Cell[] = []
          let oldOffset = 0
          for (let b = 0; b < beats; b++) {
            const wasThisBeatTriplet = laneTriplets.includes(b)
            const oldBeatSize = wasThisBeatTriplet ? 3 : subdivision
            if (b === beatIndex) {
              const newBeatSize = wasTriplet ? subdivision : 3
              for (let i = 0; i < newBeatSize; i++) newCells.push(createCell())
            } else {
              for (let i = 0; i < oldBeatSize; i++) {
                newCells.push(oldCells[oldOffset + i] ?? createCell())
              }
            }
            oldOffset += oldBeatSize
          }

          return {
            ...m,
            cells: { ...m.cells, [laneId]: newCells },
            tripletBeats: { ...(m.tripletBeats ?? {}), [laneId]: newTriplets },
          }
        }),
      }))
    },
    [dirtyUpdate],
  )

  const setRoll = useCallback(
    (lineIndex: number, measureId: string, laneId: string, cellIndex: number, length: number) => {
      updateCells(lineIndex, measureId, laneId, (cells) => {
        cells[cellIndex] = { ...cells[cellIndex], roll: { length } }
        return cells
      })
    },
    [updateCells],
  )

  const removeRoll = useCallback(
    (lineIndex: number, measureId: string, laneId: string, cellIndex: number) => {
      updateCells(lineIndex, measureId, laneId, (cells) => {
        const { roll: _, ...rest } = cells[cellIndex]
        cells[cellIndex] = rest
        return cells
      })
    },
    [updateCells],
  )

  const setFlam = useCallback(
    (lineIndex: number, measureId: string, laneId: string, cellIndex: number, flam: boolean) => {
      updateCells(lineIndex, measureId, laneId, (cells) => {
        if (flam) {
          cells[cellIndex] = { ...cells[cellIndex], flam: true }
        } else {
          const { flam: _, ...rest } = cells[cellIndex]
          cells[cellIndex] = rest
        }
        return cells
      })
    },
    [updateCells],
  )

  const setSectionLabel = useCallback(
    (lineIndex: number, measureId: string, label: string) => {
      dirtyUpdate((prev) => ({
        ...prev,
        lines: mapMeasuresInLine(prev.lines, lineIndex, (m) => {
          if (m.id !== measureId) return m
          if (label) return { ...m, sectionLabel: label }
          return {
            ...m,
            sectionLabel: undefined,
            sectionLength: undefined,
            repeat: undefined,
          }
        }),
      }))
    },
    [dirtyUpdate],
  )

  const setSectionLength = useCallback(
    (lineIndex: number, measureId: string, length: number) => {
      dirtyUpdate((prev) => {
        const line = prev.lines[lineIndex]
        const startIndex = line.findIndex((m) => m.id === measureId)
        if (startIndex === -1) return prev

        const remaining = line.length - startIndex
        const measuresToAdd = Math.max(0, length - remaining)
        const lastMeasure = line[line.length - 1]
        const ts = lastMeasure.timeSignature
        const laneIds = prev.lanes.map((l) => l.id)

        const grownLine = [...line]
        for (let i = 0; i < measuresToAdd; i++) {
          grownLine.push(createMeasure(laneIds, ts))
        }

        const updatedLine = grownLine.map((m) =>
          m.id !== measureId ? m : { ...m, sectionLength: length },
        )

        return {
          ...prev,
          lines: prev.lines.map((l, i) => (i === lineIndex ? updatedLine : l)),
        }
      })
    },
    [dirtyUpdate],
  )

  const setRepeat = useCallback(
    (lineIndex: number, measureId: string, times: number) => {
      dirtyUpdate((prev) => ({
        ...prev,
        lines: mapMeasuresInLine(prev.lines, lineIndex, (m) =>
          m.id !== measureId ? m : { ...m, repeat: { times } },
        ),
      }))
    },
    [dirtyUpdate],
  )

  const setTimeSignature = useCallback(
    (lineIndex: number, measureId: string, ts: TimeSignature) => {
      dirtyUpdate((prev) => ({
        ...prev,
        lines: mapMeasuresInLine(prev.lines, lineIndex, (m) => {
          if (m.id !== measureId) return m
          const laneIds = prev.lanes.map((l) => l.id)
          const totalCells = ts.beats * ts.subdivision
          const cells: Record<string, Cell[]> = {}
          for (const laneId of laneIds) {
            cells[laneId] = Array.from({ length: totalCells }, () => createCell())
          }
          return { ...m, timeSignature: ts, cells, tripletBeats: undefined }
        }),
      }))
    },
    [dirtyUpdate],
  )

  const updateLane = useCallback(
    (laneId: string, updates: { name?: string; color?: string; gmNote?: number }) => {
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

  const applyTemplate = useCallback(
    (lineIndex: number, measureIndex: number, laneId: string, template: RhythmTemplate) => {
      dirtyUpdate((prev) => {
        const laneIds = prev.lanes.map((l) => l.id)
        const newLine = [...prev.lines[lineIndex]]

        for (let i = 0; i < template.measures.length; i++) {
          const tm = template.measures[i]
          const targetIdx = measureIndex + i

          // Auto-add measure if it doesn't exist
          while (newLine.length <= targetIdx) {
            const lastTs = newLine[newLine.length - 1].timeSignature
            newLine.push(createMeasure(laneIds, lastTs))
          }

          const oldMeasure = newLine[targetIdx]
          const newTs = { beats: tm.beats, subdivision: tm.subdivision }
          const tsChanged =
            oldMeasure.timeSignature.beats !== newTs.beats ||
            oldMeasure.timeSignature.subdivision !== newTs.subdivision

          // Build cells for the target lane from template
          const templateCells: Cell[] = tm.cells.map((c) => {
            const cell: Cell = { symbol: c.symbol }
            if (c.label) cell.label = c.label
            if (c.roll) cell.roll = { length: c.roll.length }
            return cell
          })

          // Build cells map: template lane gets template cells, others keep or rebuild
          const newCells: Record<string, Cell[]> = {}
          const newCellCount = newTs.beats * newTs.subdivision
          for (const lid of laneIds) {
            if (lid === laneId) {
              newCells[lid] = templateCells
            } else if (tsChanged) {
              newCells[lid] = Array.from({ length: newCellCount }, () => createCell())
            } else {
              newCells[lid] = oldMeasure.cells[lid] ?? Array.from({ length: newCellCount }, () => createCell())
            }
          }

          // Build tripletBeats
          const newTripletBeats: Record<string, number[]> = {}
          if (tm.tripletBeats.length > 0) {
            newTripletBeats[laneId] = tm.tripletBeats
          }
          if (!tsChanged && oldMeasure.tripletBeats) {
            for (const lid of laneIds) {
              if (lid === laneId) continue
              if (oldMeasure.tripletBeats[lid]?.length) {
                newTripletBeats[lid] = oldMeasure.tripletBeats[lid]
              }
            }
          }

          newLine[targetIdx] = {
            ...oldMeasure,
            timeSignature: newTs,
            cells: newCells,
            tripletBeats: Object.keys(newTripletBeats).length > 0 ? newTripletBeats : undefined,
          }
        }

        return { ...prev, lines: mapLine(prev.lines, lineIndex, () => newLine) }
      })
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
    addLine,
    cycleCell,
    setCellSymbol,
    setCellLabel,
    setTriplet,
    setRoll,
    removeRoll,
    setFlam,
    setSectionLabel,
    setSectionLength,
    setRepeat,
    setTimeSignature,
    applyTemplate,
    updateLane,
    updateTitle,
    loadScore,
    markClean,
  }
}
