import MidiWriter from 'midi-writer-js'
import type { Score } from '../model/types'

interface MidiExportOptions {
  tempo: number
  instrumentMap: Record<string, number>  // laneId → MIDI note number
  velocityMap: Record<string, number>    // symbol name → velocity (0-127)
}

function flattenMeasures(score: Score) {
  const allMeasures: typeof score.lines[0] = []
  for (const line of score.lines) {
    const sections: { startIndex: number; length: number; repeatTimes: number }[] = []
    for (let i = 0; i < line.length; i++) {
      const m = line[i]
      if (m.sectionLabel) {
        sections.push({
          startIndex: i,
          length: Math.min(m.sectionLength ?? 1, line.length - i),
          repeatTimes: m.repeat?.times ?? 1,
        })
      }
    }

    const measureSectionMap = new Map<number, typeof sections[0]>()
    for (const sec of sections) {
      for (let j = sec.startIndex; j < sec.startIndex + sec.length; j++) {
        measureSectionMap.set(j, sec)
      }
    }

    let i = 0
    while (i < line.length) {
      const sec = measureSectionMap.get(i)
      if (sec && sec.startIndex === i) {
        for (let rep = 0; rep < sec.repeatTimes; rep++) {
          for (let j = sec.startIndex; j < sec.startIndex + sec.length; j++) {
            allMeasures.push(line[j])
          }
        }
        i = sec.startIndex + sec.length
      } else if (!measureSectionMap.has(i)) {
        allMeasures.push(line[i])
        i++
      } else {
        i++
      }
    }
  }
  return allMeasures
}

function toMidiWriterVelocity(v: number): number {
  return Math.max(1, Math.min(100, Math.round((v / 127) * 100)))
}

function getSubdivisionDuration(subdivision: number): string {
  switch (subdivision) {
    case 1: return '4'
    case 2: return '8'
    case 3: return '8t'
    case 4: return '16'
    case 6: return '16t'
    case 8: return '32'
    default: return '16'
  }
}

export function generateMidi(score: Score, options: MidiExportOptions): Uint8Array {
  const measures = flattenMeasures(score)
  const tracks: InstanceType<typeof MidiWriter.Track>[] = []

  for (const lane of score.lanes) {
    const track = new MidiWriter.Track()
    track.addTrackName(lane.name)
    track.setTempo(options.tempo)

    const midiNote = options.instrumentMap[lane.id] ?? 38

    for (const measure of measures) {
      const { beats, subdivision } = measure.timeSignature
      const cells = measure.cells[lane.id] ?? []
      const laneTriplets = measure.tripletBeats?.[lane.id] ?? []
      const baseDuration = getSubdivisionDuration(subdivision)

      let cellOffset = 0
      for (let beat = 0; beat < beats; beat++) {
        const isTriplet = laneTriplets.includes(beat)
        const beatCellCount = isTriplet ? 3 : subdivision
        const beatCells = cells.slice(cellOffset, cellOffset + beatCellCount)
        const duration = isTriplet ? '8t' : baseDuration

        for (let i = 0; i < beatCells.length; i++) {
          const cell = beatCells[i]

          // Check if this cell is covered by a roll from an earlier cell
          const isInRoll = cells.some(
            (c, ci) => c.roll && ci <= cellOffset + i && ci + c.roll.length > cellOffset + i && ci !== cellOffset + i
          )

          if (isInRoll) {
            // Already handled by the roll's rapid notes — emit a rest
            continue
          }

          if (cell.roll) {
            const rollLength = cell.roll.length
            const velocity = cell.symbol
              ? toMidiWriterVelocity(options.velocityMap[cell.symbol] ?? 90)
              : toMidiWriterVelocity(90)
            // Render roll as rapid 32nd notes over the roll span
            const rollNotes = rollLength * 2
            for (let r = 0; r < rollNotes; r++) {
              track.addEvent(new MidiWriter.NoteEvent({
                pitch: [midiNote],
                duration: '32',
                velocity,
                channel: 10,
              }))
            }
          } else if (cell.symbol) {
            const velocity = toMidiWriterVelocity(options.velocityMap[cell.symbol] ?? 90)
            track.addEvent(new MidiWriter.NoteEvent({
              pitch: [midiNote],
              duration,
              velocity,
              channel: 10,
            }))
          } else {
            // Rest
            track.addEvent(new MidiWriter.NoteEvent({
              pitch: [midiNote],
              duration,
              velocity: 1,
              channel: 10,
              wait: duration,
            }))
          }
        }

        cellOffset += beatCellCount
      }
    }

    tracks.push(track)
  }

  const writer = new MidiWriter.Writer(tracks)
  return writer.buildFile()
}

export function downloadMidi(data: Uint8Array, filename: string) {
  const blob = new Blob([data], { type: 'audio/midi' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.mid') ? filename : `${filename}.mid`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
