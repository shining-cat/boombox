import type { Score } from '../model/types'
import { flattenMeasures } from '../utils/scoreUtils'
import { DEFAULT_SYMBOL_VELOCITIES } from '../model/midiMappings'

export interface NoteEvent {
  time: number          // absolute time in seconds from start
  note: number          // GM MIDI note number
  velocity: number      // 0-1 gain
  measureIndex: number  // index in flattened measures (for visual tracking)
}

export function buildNoteEvents(
  score: Score,
  instrumentMap: Record<string, number>,
  tempo: number,
): NoteEvent[] {
  const flatMeasures = flattenMeasures(score)
  const events: NoteEvent[] = []
  let currentTime = 0

  for (let i = 0; i < flatMeasures.length; i++) {
    const { measure, visualIndex: measureIndex } = flatMeasures[i]
    const { beats, subdivision } = measure.timeSignature
    const beatDuration = 60 / tempo
    const normalCellDuration = beatDuration / subdivision

    // Track the measure's total duration so we can advance currentTime after processing all lanes
    const totalCells = beats * subdivision
    const measureDuration = totalCells * normalCellDuration

    for (const laneId of Object.keys(measure.cells)) {
      const cells = measure.cells[laneId]
      const gmNote = instrumentMap[laneId]
      if (gmNote === undefined) continue

      const tripletBeats = measure.tripletBeats?.[laneId] ?? []

      let cellTimeOffset = 0
      let cellIndex = 0

      for (let beatIndex = 0; beatIndex < beats; beatIndex++) {
        const isTriplet = tripletBeats.includes(beatIndex)
        const cellsInBeat = isTriplet ? 3 : subdivision
        const cellDuration = beatDuration / cellsInBeat

        for (let subIndex = 0; subIndex < cellsInBeat; subIndex++) {
          if (cellIndex >= cells.length) break

          const cell = cells[cellIndex]
          if (cell.symbol !== null) {
            const rawVelocity = DEFAULT_SYMBOL_VELOCITIES[cell.symbol] ?? 90
            const velocity = rawVelocity / 127

            if (cell.roll) {
              // Rolls: rapid repeated notes over the roll span
              const rollDuration = cell.roll.length * cellDuration
              const rollInterval = 0.04 // ~25 notes per second
              const rollCount = Math.max(1, Math.floor(rollDuration / rollInterval))
              const actualInterval = rollDuration / rollCount

              for (let r = 0; r < rollCount; r++) {
                events.push({
                  time: currentTime + cellTimeOffset + r * actualInterval,
                  note: gmNote,
                  velocity,
                  measureIndex,
                })
              }
            } else {
              events.push({
                time: currentTime + cellTimeOffset,
                note: gmNote,
                velocity,
                measureIndex,
              })
            }
          }

          cellTimeOffset += cellDuration
          cellIndex++
        }
      }
    }

    currentTime += measureDuration
  }

  events.sort((a, b) => a.time - b.time)
  return events
}

export interface SchedulerController {
  start: () => void
  stop: () => void
  pause: () => void
  resume: () => void
  getCurrentMeasureIndex: () => number
}

const LOOKAHEAD_MS = 25    // how often to call the scheduling function (ms)
const SCHEDULE_AHEAD = 0.1 // how far ahead to schedule audio (seconds)

export function createScheduler(
  ctx: AudioContext,
  samples: Map<number, AudioBuffer>,
  events: NoteEvent[],
  onMeasureChange: (index: number) => void,
  onEnd: () => void,
): SchedulerController {
  let nextEventIndex = 0
  let currentMeasureIndex = -1
  let timerID: ReturnType<typeof setInterval> | null = null
  let startTime = 0
  let pauseTime = 0
  let pauseOffset = 0

  function scheduleNote(event: NoteEvent, when: number) {
    const buffer = samples.get(event.note)
    if (!buffer) return

    const source = ctx.createBufferSource()
    source.buffer = buffer

    const gain = ctx.createGain()
    gain.gain.value = event.velocity
    source.connect(gain)
    gain.connect(ctx.destination)

    source.start(when)
  }

  function scheduler() {
    const elapsed = ctx.currentTime - startTime + pauseOffset
    const scheduleUntil = elapsed + SCHEDULE_AHEAD

    while (nextEventIndex < events.length && events[nextEventIndex].time <= scheduleUntil) {
      const event = events[nextEventIndex]
      const playAt = startTime + event.time - pauseOffset

      if (playAt >= ctx.currentTime) {
        scheduleNote(event, playAt)
      }

      if (event.measureIndex !== currentMeasureIndex) {
        currentMeasureIndex = event.measureIndex
        onMeasureChange(currentMeasureIndex)
      }

      nextEventIndex++
    }

    if (nextEventIndex >= events.length) {
      stop()
      onEnd()
    }
  }

  function start() {
    nextEventIndex = 0
    currentMeasureIndex = -1
    pauseOffset = 0
    startTime = ctx.currentTime
    timerID = setInterval(scheduler, LOOKAHEAD_MS)
    scheduler() // run immediately to catch events at time 0
  }

  function stop() {
    if (timerID !== null) {
      clearInterval(timerID)
      timerID = null
    }
    nextEventIndex = 0
    currentMeasureIndex = -1
    pauseOffset = 0
  }

  function pause() {
    if (timerID !== null) {
      clearInterval(timerID)
      timerID = null
    }
    pauseTime = ctx.currentTime
  }

  function resume() {
    pauseOffset += ctx.currentTime - pauseTime
    timerID = setInterval(scheduler, LOOKAHEAD_MS)
    scheduler()
  }

  function getCurrentMeasureIndex() {
    return currentMeasureIndex
  }

  return { start, stop, pause, resume, getCurrentMeasureIndex }
}
