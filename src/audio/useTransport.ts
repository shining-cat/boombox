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
  const [mutedLanes, setMutedLanes] = useState<Set<string>>(new Set())
  const [looping, setLooping] = useState(false)

  const ctxRef = useRef<AudioContext | null>(null)
  const loaderRef = useRef<SampleLoader | null>(null)
  const schedulerRef = useRef<SchedulerController | null>(null)
  const loopingRef = useRef(false)
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const playRef = useRef<(() => Promise<void>) | null>(null)

  const stopInternal = useCallback(() => {
    if (loopTimerRef.current !== null) {
      clearTimeout(loopTimerRef.current)
      loopTimerRef.current = null
    }
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

    // Map non-muted lanes to GM note numbers
    const instrumentMap: Record<string, number> = {}
    for (const lane of score.lanes) {
      if (!mutedLanes.has(lane.id)) {
        instrumentMap[lane.id] = autoDetectInstrument(lane.name)
      }
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
      () => {
        schedulerRef.current = null
        if (loopingRef.current && playRef.current) {
          setCurrentMeasureIndex(-1)
          loopTimerRef.current = setTimeout(() => {
            loopTimerRef.current = null
            playRef.current?.()
          }, 1000)
        } else {
          stopInternal()
        }
      },
    )

    schedulerRef.current = scheduler
    scheduler.start()
    setState('playing')
  }, [score, tempo, mutedLanes, stopInternal])

  playRef.current = play

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

  const toggleLoop = useCallback(() => {
    setLooping(prev => {
      loopingRef.current = !prev
      return !prev
    })
  }, [])

  const toggleMute = useCallback((laneId: string) => {
    setMutedLanes(prev => {
      const next = new Set(prev)
      if (next.has(laneId)) next.delete(laneId)
      else next.add(laneId)
      return next
    })
  }, [])

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
    mutedLanes,
    looping,
    play,
    pause,
    resume,
    stop,
    setTempo,
    toggleMute,
    toggleLoop,
  }
}
