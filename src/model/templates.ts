import type { CellSymbol } from './types'

export interface RhythmTemplate {
  name: string
  beats: number
  subdivision: number
  measures: number
  pattern: CellSymbol[]
}

function parsePattern(str: string): CellSymbol[] {
  return [...str].map(c => (c === 'x' ? 'full-round' : null))
}

export const RHYTHM_TEMPLATES: RhythmTemplate[] = [
  {
    name: '3-2 Clave',
    beats: 4,
    subdivision: 4,
    measures: 1,
    pattern: parsePattern('x..x..x...x.x...'),
  },
  {
    name: 'Afoxe',
    beats: 4,
    subdivision: 4,
    measures: 1,
    pattern: parsePattern('xx.x.xx.x.x.x.x.'),
  },
  {
    name: 'Rumba',
    beats: 4,
    subdivision: 4,
    measures: 1,
    pattern: parsePattern('x..x...x..x.x.x.'),
  },
  {
    name: 'Tambourim',
    beats: 4,
    subdivision: 4,
    measures: 1,
    pattern: parsePattern('.x.x.xx.x.x.x.xx'),
  },
  {
    name: 'Samba Reggae',
    beats: 4,
    subdivision: 4,
    measures: 1,
    pattern: parsePattern('......x.....xxxx'),
  },
  {
    name: 'Funk',
    beats: 4,
    subdivision: 4,
    measures: 2,
    pattern: parsePattern('xx....xx....xxxxxx....xx....x...'),
  },
]
