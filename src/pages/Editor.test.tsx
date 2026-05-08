import { describe, it, expect } from 'vitest'
import { slug } from './Editor'

describe('slug()', () => {
  it('lowercases and joins words with hyphens', () => {
    expect(slug('Cow Bell')).toBe('cow-bell')
  })

  it('strips non-alphanumeric except hyphens, then collapses runs', () => {
    expect(slug('Clave  (3-2)')).toBe('clave-3-2')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slug('  Clave  ')).toBe('clave')
  })

  it('returns empty string for empty input', () => {
    expect(slug('')).toBe('')
  })

  it('returns empty string when input has only non-alphanumeric chars', () => {
    expect(slug('   ')).toBe('')
    expect(slug('---')).toBe('')
  })
})
