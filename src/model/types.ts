export type CellSymbol =
  | 'cross'
  | 'double-cross'
  | 'empty-round'
  | 'full-round'
  | 'double-full-round'
  | 'square'
  | 'diamond'
  | 'dot'
  | null

export const SYMBOL_CYCLE: CellSymbol[] = [null, 'cross', 'empty-round', 'full-round', 'square', 'diamond', 'dot']

export interface Cell {
  symbol: CellSymbol
  label?: string
  flam?: boolean
  roll?: { length: number }
}

export interface TimeSignature {
  beats: number
  subdivision: number
}

export interface Measure {
  id: string
  timeSignature: TimeSignature
  sectionLabel?: string
  sectionLength?: number
  repeat?: { times: number }
  cells: Record<string, Cell[]>
  tripletBeats?: Record<string, number[]>
}

export interface Lane {
  id: string
  name: string
  color: string
  gmNote?: number
}

export interface Score {
  title: string
  author: string
  tempo: number
  lanes: Lane[]
  lines: Measure[][]
}
