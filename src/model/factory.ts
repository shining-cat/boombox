import { v4 as uuidv4 } from 'uuid'
import type { Cell, Lane, Measure, Score, TimeSignature } from './types'

const PASTEL_COLORS = [
  '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA',
  '#E8BAFF', '#FFD9BA', '#BAFFF5', '#FFC9DE',
]

export function createCell(): Cell {
  return { symbol: null }
}

export function createMeasure(laneIds: string[], timeSignature: TimeSignature): Measure {
  const totalCells = timeSignature.beats * timeSignature.subdivision
  const cells: Record<string, Cell[]> = {}
  for (const laneId of laneIds) {
    cells[laneId] = Array.from({ length: totalCells }, () => createCell())
  }
  return {
    id: uuidv4(),
    timeSignature,
    cells,
  }
}

export function createLane(name: string, color?: string): Lane {
  return {
    id: uuidv4(),
    name,
    color: color ?? PASTEL_COLORS[0],
  }
}

export function createScore(): Score {
  const lane = createLane('Instrument 1', PASTEL_COLORS[0])
  const measure = createMeasure([lane.id], { beats: 4, subdivision: 4 })
  return {
    title: 'Untitled Score',
    author: '',
    tempo: 120,
    lanes: [lane],
    measures: [measure],
  }
}
