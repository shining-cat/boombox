import { describe, it, expect } from 'vitest'
import { serializeScore, deserializeScore } from './fileIO'
import { createScore } from '../model/factory'

describe('serializeScore', () => {
  it('serializes a score to JSON string', () => {
    const score = createScore()
    const json = serializeScore(score)
    expect(typeof json).toBe('string')
    const parsed = JSON.parse(json)
    expect(parsed.title).toBe('Untitled Score')
  })
})

describe('deserializeScore', () => {
  it('round-trips a score through serialize/deserialize', () => {
    const score = createScore()
    const json = serializeScore(score)
    const restored = deserializeScore(json)
    expect(restored.title).toBe(score.title)
    expect(restored.lanes).toHaveLength(score.lanes.length)
    expect(restored.measures).toHaveLength(score.measures.length)
    expect(restored.measures[0].cells[restored.lanes[0].id]).toHaveLength(16)
  })

  it('throws on invalid JSON', () => {
    expect(() => deserializeScore('not json')).toThrow()
  })

  it('throws on missing required fields', () => {
    expect(() => deserializeScore('{"foo": "bar"}')).toThrow()
  })
})
