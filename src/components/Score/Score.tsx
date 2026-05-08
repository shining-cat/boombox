import { useRef, useState } from 'react'
import type { Score as ScoreType, TimeSignature } from '../../model/types'
import { autoDetectInstrument, GM_PERCUSSION } from '../../model/midiMappings'
import { LaneHeader } from '../LaneHeader/LaneHeader'
import { MeasureHeader } from '../MeasureHeader/MeasureHeader'
import { Grid } from '../Grid/Grid'
import { InstrumentPicker } from '../InstrumentPicker/InstrumentPicker'
import { SectionBanner } from '../SectionBanner/SectionBanner'
import styles from './Score.module.css'

interface Section {
  measureId: string
  label: string
  length: number
  repeat?: { times: number }
  startIndex: number
}

interface ScoreProps {
  score: ScoreType
  onCycleCell: (lineIndex: number, measureId: string, laneId: string, cellIndex: number) => void
  onCellContextMenu: (lineIndex: number, measureId: string, laneId: string, cellIndex: number, event: React.MouseEvent) => void
  onLaneNameChange: (laneId: string, name: string) => void
  onLaneColorChange: (laneId: string, color: string) => void
  onRemoveLane: (laneId: string) => void
  onTimeSignatureChange: (lineIndex: number, measureId: string, ts: TimeSignature) => void
  onSectionLabelChange: (lineIndex: number, measureId: string, label: string) => void
  onSectionLengthChange: (lineIndex: number, measureId: string, length: number) => void
  onRepeatChange: (lineIndex: number, measureId: string, times: number | null) => void
  onRemoveMeasure: (lineIndex: number, measureId: string) => void
  onInsertMeasure: (lineIndex: number, index: number) => void
  onAddMeasure: (lineIndex: number) => void
  onAddLane: () => void
  onAddLine: () => void
  onToggleMute: (laneId: string) => void
  onInstrumentChange: (laneId: string, note: number | undefined) => void
  onTogglePulse: () => void
  pulseNote: number
  onPulseInstrumentChange: (note: number) => void
  showPulse?: boolean
  highlightMeasureIndex?: number
  mutedLaneIds?: Set<string>
}

function computeSections(measures: ScoreType['lines'][0]): Section[] {
  const sections: Section[] = []
  for (let i = 0; i < measures.length; i++) {
    const m = measures[i]
    if (m.sectionLabel) {
      sections.push({
        measureId: m.id,
        label: m.sectionLabel,
        length: Math.min(m.sectionLength ?? 1, measures.length - i),
        repeat: m.repeat,
        startIndex: i,
      })
    }
  }
  return sections
}

function PulseLabel({ muted, pulseNote, onToggleMute, onInstrumentChange }: {
  muted: boolean
  pulseNote: number
  onToggleMute: () => void
  onInstrumentChange: (note: number) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const instrumentName = GM_PERCUSSION.find(i => i.note === pulseNote)?.name ?? 'Unknown'

  return (
    <div className={`${styles.pulseLabel} ${muted ? styles.pulseMuted : ''}`}>
      <button
        className={styles.pulseMuteBtn}
        onClick={onToggleMute}
        title={muted ? 'Unmute pulse' : 'Mute pulse'}
        aria-label={muted ? 'Unmute pulse' : 'Mute pulse'}
      >
        {muted ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 010 7.07" />
          </svg>
        )}
      </button>
      <button
        ref={btnRef}
        className={styles.pulseInstrumentBtn}
        onClick={() => {
          if (pickerOpen) {
            setPickerOpen(false)
          } else {
            setAnchorRect(btnRef.current!.getBoundingClientRect())
            setPickerOpen(true)
          }
        }}
        title={`Sound: ${instrumentName} — click to change`}
      >
        {instrumentName}
      </button>
      {pickerOpen && anchorRect && (
        <InstrumentPicker
          currentNote={pulseNote}
          anchorRect={anchorRect}
          onSelect={onInstrumentChange}
          onClose={() => setPickerOpen(false)}
        />
      )}
      PULSE
    </div>
  )
}

function getMeasureColumnWidth(beats: number, subdivision: number): number {
  return beats * subdivision * 28 + 1
}

export function Score({
  score,
  onCycleCell,
  onCellContextMenu,
  onLaneNameChange,
  onLaneColorChange,
  onRemoveLane,
  onTimeSignatureChange,
  onSectionLabelChange,
  onSectionLengthChange,
  onRepeatChange,
  onRemoveMeasure,
  onInsertMeasure,
  onAddMeasure,
  onAddLane,
  onAddLine,
  onToggleMute,
  onInstrumentChange,
  onTogglePulse,
  pulseNote,
  onPulseInstrumentChange,
  showPulse,
  highlightMeasureIndex,
  mutedLaneIds,
}: ScoreProps) {
  const canRemoveLane = score.lanes.length > 1
  const insertBtnWidth = 20

  // Compute the starting global measure index for each line
  const lineStartIndex: number[] = []
  let runningCount = 0
  for (const line of score.lines) {
    lineStartIndex.push(runningCount)
    runningCount += line.length
  }

  return (
    <div className={styles.scoreContainer}>
      <button
        className={`${styles.pulseToggle} ${showPulse ? styles.pulseToggleActive : ''}`}
        onClick={onTogglePulse}
        title={showPulse ? 'Hide pulse lane' : 'Show pulse lane'}
      >
        {showPulse ? 'Hide Pulse' : 'Show Pulse'}
      </button>
      {score.lines.map((line, lineIndex) => {
        const canRemoveMeasure = line.length > 1 || score.lines.length > 1
        const totalMeasures = line.length
        const sections = computeSections(line)

        const measureOffsets: number[] = []
        let offset = 0
        for (let i = 0; i < line.length; i++) {
          if (i > 0) offset += insertBtnWidth
          measureOffsets.push(offset)
          offset += getMeasureColumnWidth(
            line[i].timeSignature.beats,
            line[i].timeSignature.subdivision,
          )
        }

        const handleRemoveMeasure = (measureId: string, measureNumber: number) => {
          if (window.confirm(`Delete measure ${measureNumber}, confirm?`)) {
            onRemoveMeasure(lineIndex, measureId)
          }
        }

        const measureSectionMap: (Section | null)[] = line.map((_, i) => {
          return sections.find(s => i >= s.startIndex && i < s.startIndex + s.length) ?? null
        })

        return (
          <div key={lineIndex} className={styles.lineWrapper}>
            <div className={styles.laneHeaders}>
              <div className={styles.sectionSpacer} />
              <div className={styles.headerSpacer} />
              {showPulse && (
                <PulseLabel
                  muted={mutedLaneIds?.has('__pulse') ?? false}
                  pulseNote={pulseNote}
                  onToggleMute={() => onToggleMute('__pulse')}
                  onInstrumentChange={onPulseInstrumentChange}
                />
              )}
              {score.lanes.map(lane => (
                <LaneHeader
                  key={lane.id}
                  name={lane.name}
                  color={lane.color}
                  muted={mutedLaneIds?.has(lane.id) ?? false}
                  resolvedNote={lane.gmNote ?? autoDetectInstrument(lane.name)}
                  onNameChange={name => onLaneNameChange(lane.id, name)}
                  onColorChange={color => onLaneColorChange(lane.id, color)}
                  onToggleMute={() => onToggleMute(lane.id)}
                  onInstrumentChange={note => onInstrumentChange(lane.id, note)}
                  onRemove={() => onRemoveLane(lane.id)}
                  canRemove={canRemoveLane}
                />
              ))}
              {lineIndex === 0 && (
                <button
                  className={styles.addLaneBtn}
                  onClick={onAddLane}
                  title="Add a new instrument lane"
                >
                  + Lane
                </button>
              )}
            </div>

            <div className={styles.measuresArea}>
              {/* Section banners */}
              <div className={styles.sectionBannerRow}>
                {line.map((measure, index) => {
                  const section = sections.find(s => s.startIndex === index)
                  const isInsideSection = measureSectionMap[index] !== null
                  const colWidth = getMeasureColumnWidth(
                    measure.timeSignature.beats,
                    measure.timeSignature.subdivision,
                  )
                  const hasInsertBtn = index > 0

                  if (section) {
                    let sectionWidth = 0
                    for (let j = 0; j < section.length; j++) {
                      const mi = section.startIndex + j
                      if (mi >= line.length) break
                      if (j > 0) sectionWidth += insertBtnWidth
                      sectionWidth += getMeasureColumnWidth(
                        line[mi].timeSignature.beats,
                        line[mi].timeSignature.subdivision,
                      )
                    }
                    return (
                      <div
                        key={measure.id}
                        style={{ marginLeft: hasInsertBtn ? insertBtnWidth : 0 }}
                      >
                        <SectionBanner
                          label={section.label}
                          length={section.length}
                          repeat={section.repeat ?? null}
                          width={sectionWidth}
                          onLabelChange={(label) =>
                            onSectionLabelChange(lineIndex, section.measureId, label ?? '')
                          }
                          onLengthChange={(len) =>
                            onSectionLengthChange(lineIndex, section.measureId, len)
                          }
                          onRepeatChange={(times) =>
                            onRepeatChange(lineIndex, section.measureId, times)
                          }
                        />
                      </div>
                    )
                  } else if (!isInsideSection) {
                    return (
                      <div
                        key={measure.id}
                        style={{ marginLeft: hasInsertBtn ? insertBtnWidth : 0 }}
                      >
                        <SectionBanner
                          label={null}
                          length={1}
                          repeat={null}
                          width={colWidth}
                          onLabelChange={(label) =>
                            onSectionLabelChange(lineIndex, measure.id, label ?? '')
                          }
                          onLengthChange={() => { /* unreachable when locked */ }}
                          onRepeatChange={() => { /* unreachable when locked */ }}
                        />
                      </div>
                    )
                  }
                  return null
                })}
              </div>

              {/* Measure columns */}
              <div className={styles.measureColumnsRow}>
                {line.map((measure, index) => {
                  const section = measureSectionMap[index]
                  const isFirstOfSection = section?.startIndex === index
                  const isLastOfSection = section
                    ? index === section.startIndex + section.length - 1
                    : false
                  const showSectionBorder = section !== null

                  return (
                    <div key={measure.id} style={{ display: 'flex' }}>
                      {index > 0 && (
                        <button
                          className={styles.insertBtn}
                          onClick={() => onInsertMeasure(lineIndex, index)}
                          title="Insert measure"
                        >
                          +
                        </button>
                      )}
                      <div
                        className={[
                          styles.measureColumn,
                          showSectionBorder ? styles.inSection : '',
                          isFirstOfSection ? styles.sectionStart : '',
                          isLastOfSection ? styles.sectionEnd : '',
                          highlightMeasureIndex != null && lineStartIndex[lineIndex] + index === highlightMeasureIndex ? styles.measureHighlight : '',
                        ].filter(Boolean).join(' ')}
                      >
                        <MeasureHeader
                          measureNumber={index + 1}
                          totalMeasures={totalMeasures}
                          beats={measure.timeSignature.beats}
                          subdivision={measure.timeSignature.subdivision}
                          onTimeSignatureChange={ts => onTimeSignatureChange(lineIndex, measure.id, ts)}
                          onRemove={() => handleRemoveMeasure(measure.id, index + 1)}
                          canRemove={canRemoveMeasure}
                        />
                        <Grid
                          measure={measure}
                          lanes={score.lanes}
                          showPulse={showPulse}
                          mutedLaneIds={mutedLaneIds}
                          onCycleCell={(laneId, cellIndex) => onCycleCell(lineIndex, measure.id, laneId, cellIndex)}
                          onCellContextMenu={(laneId, cellIndex, e) => onCellContextMenu(lineIndex, measure.id, laneId, cellIndex, e)}
                        />
                      </div>
                    </div>
                  )
                })}

                <button
                  className={styles.addMeasureBtn}
                  onClick={() => onAddMeasure(lineIndex)}
                  title="Add a measure to this line"
                >
                  + Measure
                </button>
              </div>
            </div>
          </div>
        )
      })}

      <button
        className={styles.addLineBtn}
        onClick={onAddLine}
        title="Add a new line of measures below"
      >
        + Line
      </button>
    </div>
  )
}
