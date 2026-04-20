import { useState, useRef, useCallback, useEffect } from 'react'
import type { Score } from '../model/types'
import { autoDetectInstrument } from '../model/midiMappings'
import { createSampleLoader } from './SampleLoader'
import type { SampleLoader } from './SampleLoader'
import { buildNoteEvents, createScheduler } from './Scheduler'
import type { SchedulerController } from './Scheduler'

export type TransportState = 'stopped' | 'playing' | 'paused'

const MIN_TEMPO = 40
const MAX_TEMPO = 300

function clampTempo(bpm: number): number {
  return Math.max(MIN_TEMPO, Math.min(MAX_TEMPO, bpm))
}

export function useTransport(score: Score) {
  const [state, setState] = useState<TransportState>('stopped')
  const [tempo, setTempoState] = useState(score.tempo)
  const [currentMeasureIndex, setCurrentMeasureIndex] = useState(-1)

  const ctxRef = useRef<AudioContext | null>(null)
  const loaderRef = useRef<SampleLoader | null>(null)
  const schedulerRef = useRef<SchedulerController | null>(null)

  const stopInternal = useCallback(() => {
    schedulerRef.current?.stop()
    schedulerRef.current = null
    setState('stopped')
    setCurrentMeasureIndex(-1)
  }, [])

  const play = useCallback(async () => {
    // Create AudioContext lazily on first play (browser autoplay policy)
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
      loaderRef.current = createSampleLoader(ctxRef.current)
    }

    const ctx = ctxRef.current
    const loader = loaderRef.current!

    // Ensure AudioContext is running (might be suspended from a pause)
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    // Map lanes to GM note numbers
    const instrumentMap: Record<string, number> = {}
    for (const lane of score.lanes) {
      instrumentMap[lane.id] = autoDetectInstrument(lane.name)
    }

    // Load samples for all needed notes
    const noteNumbers = [...new Set(Object.values(instrumentMap))]
    const samples = await loader.loadSamples(noteNumbers)

    // Build note events from score
    const events = buildNoteEvents(score, instrumentMap, tempo)

    // Create and start scheduler
    const scheduler = createScheduler(
      ctx,
      samples,
      events,
      (index) => setCurrentMeasureIndex(index),
      () => stopInternal(),
    )

    schedulerRef.current = scheduler
    scheduler.start()
    setState('playing')
  }, [score, tempo, stopInternal])

  const pause = useCallback(async () => {
    schedulerRef.current?.pause()
    if (ctxRef.current) {
      await ctxRef.current.suspend()
    }
    setState('paused')
  }, [])

  const resume = useCallback(async () => {
    if (ctxRef.current) {
      await ctxRef.current.resume()
    }
    schedulerRef.current?.resume()
    setState('playing')
  }, [])

  const stop = useCallback(() => {
    stopInternal()
  }, [stopInternal])

  const setTempo = useCallback((bpm: number) => {
    const clamped = clampTempo(bpm)
    setTempoState(clamped)
    // If playing, stop playback (user must restart with new tempo)
    if (schedulerRef.current) {
      stopInternal()
    }
  }, [stopInternal])

  // When score changes, auto-stop if playing
  useEffect(() => {
    if (state === 'playing' || state === 'paused') {
      stopInternal()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score])

  return {
    state,
    tempo,
    currentMeasureIndex,
    play,
    pause,
    resume,
    stop,
    setTempo,
  }
}
