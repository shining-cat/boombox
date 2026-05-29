import { v4 as uuidv4 } from 'uuid'
import type { Cell, Lane, Measure, Score, TimeSignature } from './types'
import type { RhythmTemplate, TemplateMeasure } from './templates'

const PASTEL_COLORS = [
  '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA',
  '#E8BAFF', '#FFD9BA', '#BAFFF5', '#FFC9DE',
]

const KNOWN_INSTRUMENT_ORDER = ['Surdo', 'Caixa', 'Repinique', 'Timbao']

function instrumentSortKey(name: string): [number, string] {
  const idx = KNOWN_INSTRUMENT_ORDER.indexOf(name)
  return idx === -1
    ? [KNOWN_INSTRUMENT_ORDER.length, name.toLowerCase()]
    : [idx, '']
}

function parsePartName(name: string): { base: string; part: number | null } {
  const m = name.match(/^(.+?)\s*\(part\s+(\d+)\)\s*$/i)
  if (m && m[1].trim()) return { base: m[1].trim(), part: parseInt(m[2], 10) }
  return { base: name, part: null }
}

function templateCellsToCells(tmCells: TemplateMeasure['cells']): Cell[] {
  return tmCells.map(c => {
    const cell: Cell = { symbol: c.symbol }
    if (c.label) cell.label = c.label
    if (c.flam) cell.flam = true
    if (c.roll) cell.roll = { length: c.roll.length }
    return cell
  })
}

function makeEmptyCells(count: number): Cell[] {
  return Array.from({ length: count }, () => ({ symbol: null }))
}

export function generateShowcaseScore(templates: RhythmTemplate[]): Score {
  if (templates.length === 0) {
    return { title: 'Library Showcase', author: '', tempo: 120, lanes: [], lines: [] }
  }

  const instruments = Array.from(new Set(templates.map(t => t.instrument))).sort((a, b) => {
    const [ai, an] = instrumentSortKey(a)
    const [bi, bn] = instrumentSortKey(b)
    return ai !== bi ? ai - bi : an.localeCompare(bn)
  })

  const lanes: Lane[] = instruments.map((name, i) => ({
    id: uuidv4(),
    name,
    color: PASTEL_COLORS[i % PASTEL_COLORS.length],
  }))

  // Group by base name; within each base, group by part number (null = standalone)
  const baseGroups = new Map<string, Map<number | null, RhythmTemplate[]>>()
  for (const t of templates) {
    const { base, part } = parsePartName(t.name)
    const partsMap = baseGroups.get(base) ?? new Map<number | null, RhythmTemplate[]>()
    const list = partsMap.get(part) ?? []
    list.push(t)
    partsMap.set(part, list)
    baseGroups.set(base, partsMap)
  }
  const sortedBaseNames = Array.from(baseGroups.keys()).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  )

  const lines: Measure[][] = sortedBaseNames.map(baseName => {
    const partsMap = baseGroups.get(baseName)!
    // Order parts: null (standalone) first if alone, else by part number ascending
    const sortedParts = Array.from(partsMap.entries()).sort(([a], [b]) => {
      if (a === null && b === null) return 0
      if (a === null) return -1
      if (b === null) return 1
      return a - b
    })

    const line: Measure[] = []
    for (const [partNumber, variants] of sortedParts) {
      const partMeasureCount = Math.max(...variants.map(v => v.measures.length))
      const partTs: TimeSignature = {
        beats: variants[0].measures[0].beats,
        subdivision: variants[0].measures[0].subdivision,
      }
      const baseCellCount = partTs.beats * partTs.subdivision
      const sectionLabel = partNumber === null ? baseName : `${baseName} (part ${partNumber})`

      for (let i = 0; i < partMeasureCount; i++) {
        const cells: Record<string, Cell[]> = {}
        const tripletBeats: Record<string, number[]> = {}

        for (const lane of lanes) {
          const variant = variants.find(v => v.instrument === lane.name)
          if (variant && i < variant.measures.length) {
            const vMeasure = variant.measures[i]
            cells[lane.id] = templateCellsToCells(vMeasure.cells)
            if (vMeasure.tripletBeats.length > 0) {
              tripletBeats[lane.id] = vMeasure.tripletBeats
            }
          } else {
            cells[lane.id] = makeEmptyCells(baseCellCount)
          }
        }

        line.push({
          id: uuidv4(),
          timeSignature: partTs,
          cells,
          ...(i === 0 ? { sectionLabel, sectionLength: partMeasureCount } : {}),
          ...(Object.keys(tripletBeats).length > 0 ? { tripletBeats } : {}),
        })
      }
    }

    return line
  })

  return { title: 'Library Showcase', author: '', tempo: 120, lanes, lines }
}
