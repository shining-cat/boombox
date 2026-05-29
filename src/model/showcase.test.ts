import { describe, it, expect } from 'vitest'
import { generateShowcaseScore } from './showcase'
import type { RhythmTemplate } from './templates'

const m16 = (symbol: 'cross' | 'dot' | 'full-round' | null) => ({
  beats: 4,
  subdivision: 4,
  cells: Array.from({ length: 16 }, () => ({ symbol })),
  tripletBeats: [],
})

const mockTemplates: RhythmTemplate[] = [
  { name: 'Foo', instrument: 'Surdo', measures: [m16('full-round')] },
  { name: 'Foo', instrument: 'Caixa', measures: [m16('cross')] },
  { name: 'Bar', instrument: 'Repinique', measures: [m16('dot'), m16('cross')] },
  { name: 'Bar', instrument: 'Timbao', measures: [m16('dot')] },
]

describe('generateShowcaseScore', () => {
  it('returns one line per family, sorted alphabetically (numeric-aware)', () => {
    const score = generateShowcaseScore(mockTemplates)
    expect(score.lines).toHaveLength(2)
    expect(score.lines[0][0].sectionLabel).toBe('Bar')
    expect(score.lines[1][0].sectionLabel).toBe('Foo')
  })

  it('uses union of instruments as global lanes', () => {
    const score = generateShowcaseScore(mockTemplates)
    expect(score.lanes.map(l => l.name).sort()).toEqual(['Caixa', 'Repinique', 'Surdo', 'Timbao'])
  })

  it('orders known instruments first (Surdo, Caixa, Repinique, Timbao)', () => {
    const score = generateShowcaseScore(mockTemplates)
    expect(score.lanes.map(l => l.name)).toEqual(['Surdo', 'Caixa', 'Repinique', 'Timbao'])
  })

  it('line measure count = max variant measure count', () => {
    const score = generateShowcaseScore(mockTemplates)
    expect(score.lines[0]).toHaveLength(2) // Bar
    expect(score.lines[1]).toHaveLength(1) // Foo
  })

  it('fills empty cells for lanes the family does not have', () => {
    const score = generateShowcaseScore(mockTemplates)
    const surdo = score.lanes.find(l => l.name === 'Surdo')!
    const barLine = score.lines[0]
    const surdoCellsInBar = barLine[0].cells[surdo.id]
    expect(surdoCellsInBar).toBeDefined()
    expect(surdoCellsInBar.every(c => c.symbol === null)).toBe(true)
  })

  it('fills cells from the variant when present', () => {
    const score = generateShowcaseScore(mockTemplates)
    const repi = score.lanes.find(l => l.name === 'Repinique')!
    const barLine = score.lines[0]
    expect(barLine[0].cells[repi.id].every(c => c.symbol === 'dot')).toBe(true)
    expect(barLine[1].cells[repi.id].every(c => c.symbol === 'cross')).toBe(true)
  })

  it('pads shorter variants with empty cells past their measure count', () => {
    const score = generateShowcaseScore(mockTemplates)
    const timbao = score.lanes.find(l => l.name === 'Timbao')!
    const barLine = score.lines[0]
    // Timbao has 1 measure, Bar's line has 2 measures — measure 1 should be empty for Timbao
    expect(barLine[0].cells[timbao.id].every(c => c.symbol === 'dot')).toBe(true)
    expect(barLine[1].cells[timbao.id].every(c => c.symbol === null)).toBe(true)
  })

  it('returns a valid empty score when given no templates', () => {
    const score = generateShowcaseScore([])
    expect(score.title).toBe('Library Showcase')
    expect(score.tempo).toBe(120)
    expect(score.lanes).toEqual([])
    expect(score.lines).toEqual([])
  })

  it('sets score title and default tempo', () => {
    const score = generateShowcaseScore(mockTemplates)
    expect(score.title).toBe('Library Showcase')
    expect(score.tempo).toBe(120)
  })

  it('sets sectionLength on the first measure of each section to span its measure count', () => {
    const score = generateShowcaseScore(mockTemplates)
    // Bar has 2 measures
    expect(score.lines[0][0].sectionLength).toBe(2)
    expect(score.lines[0][1].sectionLength).toBeUndefined()
    // Foo has 1 measure
    expect(score.lines[1][0].sectionLength).toBe(1)
  })

  it('sets sectionLength per part independently so combined parts stay separate sections', () => {
    const partTemplates: RhythmTemplate[] = [
      // part 1: 2 measures; part 2: 1 measure
      { name: 'Combo (part 1)', instrument: 'Surdo', measures: [m16('full-round'), m16('full-round')] },
      { name: 'Combo (part 2)', instrument: 'Surdo', measures: [m16('cross')] },
    ]
    const score = generateShowcaseScore(partTemplates)
    expect(score.lines[0]).toHaveLength(3)
    expect(score.lines[0][0].sectionLabel).toBe('Combo (part 1)')
    expect(score.lines[0][0].sectionLength).toBe(2)
    expect(score.lines[0][1].sectionLabel).toBeUndefined()
    expect(score.lines[0][2].sectionLabel).toBe('Combo (part 2)')
    expect(score.lines[0][2].sectionLength).toBe(1)
  })

  it('combines "(part N)" variants onto the same line in part order', () => {
    const partTemplates: RhythmTemplate[] = [
      { name: 'Combo (part 2)', instrument: 'Surdo', measures: [m16('cross')] },
      { name: 'Combo (part 1)', instrument: 'Surdo', measures: [m16('full-round')] },
    ]
    const score = generateShowcaseScore(partTemplates)
    expect(score.lines).toHaveLength(1)
    expect(score.lines[0]).toHaveLength(2)
    expect(score.lines[0][0].sectionLabel).toBe('Combo (part 1)')
    expect(score.lines[0][1].sectionLabel).toBe('Combo (part 2)')
    const surdo = score.lanes.find(l => l.name === 'Surdo')!
    expect(score.lines[0][0].cells[surdo.id].every(c => c.symbol === 'full-round')).toBe(true)
    expect(score.lines[0][1].cells[surdo.id].every(c => c.symbol === 'cross')).toBe(true)
  })

  it('keeps base name sort key for "(part N)" lines vs other families', () => {
    const mixed: RhythmTemplate[] = [
      { name: 'Alpha', instrument: 'Surdo', measures: [m16('cross')] },
      { name: 'Beta (part 1)', instrument: 'Surdo', measures: [m16('cross')] },
      { name: 'Beta (part 2)', instrument: 'Surdo', measures: [m16('cross')] },
      { name: 'Gamma', instrument: 'Surdo', measures: [m16('cross')] },
    ]
    const score = generateShowcaseScore(mixed)
    expect(score.lines).toHaveLength(3)
    expect(score.lines[0][0].sectionLabel).toBe('Alpha')
    expect(score.lines[1][0].sectionLabel).toBe('Beta (part 1)')
    expect(score.lines[2][0].sectionLabel).toBe('Gamma')
  })
})
