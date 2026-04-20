import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSampleLoader } from './SampleLoader'

function createMockAudioContext() {
  return {
    decodeAudioData: vi.fn(),
  } as unknown as AudioContext
}

function createMockAudioBuffer(label: string): AudioBuffer {
  return { label } as unknown as AudioBuffer
}

describe('createSampleLoader', () => {
  let ctx: AudioContext
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    ctx = createMockAudioContext()
    fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    // Stub import.meta.env.BASE_URL — Vitest provides it automatically
    // but we rely on it being '/boombox/' per vite.config.ts
  })

  it('loads and decodes samples for given note numbers', async () => {
    const buf36 = createMockAudioBuffer('36')
    const buf38 = createMockAudioBuffer('38')

    const arrayBuffer36 = new ArrayBuffer(8)
    const arrayBuffer38 = new ArrayBuffer(8)

    fetchSpy
      .mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(arrayBuffer36) })
      .mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(arrayBuffer38) })

    vi.mocked(ctx.decodeAudioData)
      .mockResolvedValueOnce(buf36)
      .mockResolvedValueOnce(buf38)

    const loader = createSampleLoader(ctx)
    const result = await loader.loadSamples([36, 38])

    expect(result.size).toBe(2)
    expect(result.get(36)).toBe(buf36)
    expect(result.get(38)).toBe(buf38)

    // Verify fetch was called with correct URLs
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('36.mp3'))
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('38.mp3'))

    // Verify decodeAudioData was called with the array buffers
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(2)
    expect(ctx.decodeAudioData).toHaveBeenCalledWith(arrayBuffer36)
    expect(ctx.decodeAudioData).toHaveBeenCalledWith(arrayBuffer38)
  })

  it('returns cached samples on second call without re-fetching', async () => {
    const buf36 = createMockAudioBuffer('36')
    const arrayBuffer36 = new ArrayBuffer(8)

    fetchSpy.mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(arrayBuffer36) })
    vi.mocked(ctx.decodeAudioData).mockResolvedValueOnce(buf36)

    const loader = createSampleLoader(ctx)

    const first = await loader.loadSamples([36])
    expect(first.get(36)).toBe(buf36)
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    // Second call — should use cache, not fetch again
    const second = await loader.loadSamples([36])
    expect(second.get(36)).toBe(buf36)
    expect(fetchSpy).toHaveBeenCalledTimes(1) // still 1, no new fetch
  })

  it('skips samples that fail to fetch and returns only successful ones', async () => {
    const buf38 = createMockAudioBuffer('38')
    const arrayBuffer38 = new ArrayBuffer(8)

    fetchSpy
      .mockResolvedValueOnce({ ok: false, status: 404 }) // note 36 fails
      .mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(arrayBuffer38) })

    vi.mocked(ctx.decodeAudioData).mockResolvedValueOnce(buf38)

    const loader = createSampleLoader(ctx)
    const result = await loader.loadSamples([36, 38])

    expect(result.size).toBe(1)
    expect(result.has(36)).toBe(false)
    expect(result.get(38)).toBe(buf38)
  })

  it('skips samples that fail to decode', async () => {
    const arrayBuffer36 = new ArrayBuffer(8)

    fetchSpy.mockResolvedValueOnce({ ok: true, arrayBuffer: () => Promise.resolve(arrayBuffer36) })
    vi.mocked(ctx.decodeAudioData).mockRejectedValueOnce(new Error('decode failed'))

    const loader = createSampleLoader(ctx)
    const result = await loader.loadSamples([36])

    expect(result.size).toBe(0)
    expect(result.has(36)).toBe(false)
  })
})
