import type { CellSymbol } from './types'

export interface TemplateMeasure {
  beats: number
  subdivision: number
  cells: { symbol: CellSymbol; label?: string; roll?: { length: number } }[]
  tripletBeats: number[]
}

export interface RhythmTemplate {
  name: string
  instrument: string
  measures: TemplateMeasure[]
}

export async function loadTemplates(): Promise<RhythmTemplate[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}templates.json`)
  return response.json() as Promise<RhythmTemplate[]>
}
