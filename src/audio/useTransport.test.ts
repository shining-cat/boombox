import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useTransport } from './useTransport'
import { createScore } from '../model/factory'

describe('useTransport', () => {
  it('starts in stopped state with score tempo', () => {
    const score = createScore() // tempo = 120
    const { result } = renderHook(() => useTransport(score))

    expect(result.current.state).toBe('stopped')
    expect(result.current.tempo).toBe(120)
    expect(result.current.currentMeasureIndex).toBe(-1)
  })

  it('setTempo updates tempo value', () => {
    const score = createScore()
    const { result } = renderHook(() => useTransport(score))

    act(() => result.current.setTempo(90))
    expect(result.current.tempo).toBe(90)

    act(() => result.current.setTempo(200))
    expect(result.current.tempo).toBe(200)
  })

  it('setTempo clamps to 40-300 range', () => {
    const score = createScore()
    const { result } = renderHook(() => useTransport(score))

    act(() => result.current.setTempo(10))
    expect(result.current.tempo).toBe(40)

    act(() => result.current.setTempo(500))
    expect(result.current.tempo).toBe(300)

    act(() => result.current.setTempo(40))
    expect(result.current.tempo).toBe(40)

    act(() => result.current.setTempo(300))
    expect(result.current.tempo).toBe(300)
  })
})
