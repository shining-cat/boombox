import { describe, it, expect } from 'vitest'
import { isDoubleSymbol } from './midiMappings'

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
