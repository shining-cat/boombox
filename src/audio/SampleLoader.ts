export interface SampleLoader {
  loadSamples(noteNumbers: number[]): Promise<Map<number, AudioBuffer>>
}

export function createSampleLoader(ctx: AudioContext): SampleLoader {
  const cache = new Map<number, AudioBuffer>()

  return {
    async loadSamples(noteNumbers: number[]): Promise<Map<number, AudioBuffer>> {
      const result = new Map<number, AudioBuffer>()

      const uncached = noteNumbers.filter((n) => {
        if (cache.has(n)) {
          result.set(n, cache.get(n)!)
          return false
        }
        return true
      })

      const settlements = await Promise.allSettled(
        uncached.map(async (note) => {
          const url = `${import.meta.env.BASE_URL}samples/${note}.mp3`
          const response = await fetch(url)
          if (!response.ok) {
            throw new Error(`fetch failed for ${note}: ${response.status}`)
          }
          const arrayBuffer = await response.arrayBuffer()
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
          return { note, audioBuffer }
        }),
      )

      for (const settlement of settlements) {
        if (settlement.status === 'fulfilled') {
          const { note, audioBuffer } = settlement.value
          cache.set(note, audioBuffer)
          result.set(note, audioBuffer)
        }
        // rejected settlements are silently skipped — graceful degradation
      }

      return result
    },
  }
}
