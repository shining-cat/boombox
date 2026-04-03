export type CellSymbol = 'cross' | 'empty-round' | 'full-round' | 'square' | 'diamond' | null

export const SYMBOL_CYCLE: CellSymbol[] = [null, 'cross', 'empty-round', 'full-round', 'square', 'diamond']

export interface Cell {
  symbol: CellSymbol
  label?: string
  triplet?: boolean
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
}

export interface Lane {
  id: string
  name: string
  color: string
}

export interface Score {
  title: string
  author: string
  tempo: number
  lanes: Lane[]
  measures: Measure[]
}
