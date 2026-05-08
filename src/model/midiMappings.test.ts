import { describe, it, expect } from 'vitest'
import { isDoubleSymbol, shouldEmitFlam, FLAM_LEAD_SECONDS, FLAM_VELOCITY_RATIO } from './midiMappings'
import type { Cell } from './types'

describe('isDoubleSymbol', () => {
  it('returns true for double-cross', () => {
    expect(isDoubleSymbol('double-cross')).toBe(true)
  })

  it('returns true for double-full-round', () => {
    expect(isDoubleSymbol('double-full-round')).toBe(true)
  })

  it('returns false for plain cross', () => {
    expect(isDoubleSymbol('cross')).toBe(false)
  })

  it('returns false for non-double symbols', () => {
    expect(isDoubleSymbol('full-round')).toBe(false)
    expect(isDoubleSymbol('empty-round')).toBe(false)
    expect(isDoubleSymbol('square')).toBe(false)
    expect(isDoubleSymbol('diamond')).toBe(false)
    expect(isDoubleSymbol('dot')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isDoubleSymbol(null)).toBe(false)
  })
})

describe('shouldEmitFlam', () => {
  it('returns true when flam is set, symbol exists, and no roll', () => {
    const cell: Cell = { symbol: 'cross', flam: true }
    expect(shouldEmitFlam(cell)).toBe(true)
  })

  it('returns false when flam is not set', () => {
    const cell: Cell = { symbol: 'cross' }
    expect(shouldEmitFlam(cell)).toBe(false)
  })

  it('returns false when symbol is null', () => {
    const cell: Cell = { symbol: null, flam: true }
    expect(shouldEmitFlam(cell)).toBe(false)
  })

  it('returns false when cell is rolled (roll wins)', () => {
    const cell: Cell = { symbol: 'cross', flam: true, roll: { length: 2 } }
    expect(shouldEmitFlam(cell)).toBe(false)
  })
})

describe('flam constants', () => {
  it('FLAM_LEAD_SECONDS is 30ms', () => {
    expect(FLAM_LEAD_SECONDS).toBeCloseTo(0.03, 5)
  })

  it('FLAM_VELOCITY_RATIO is 0.5', () => {
    expect(FLAM_VELOCITY_RATIO).toBeCloseTo(0.5, 5)
  })
})
