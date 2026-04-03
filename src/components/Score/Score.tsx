import type { Score as ScoreType, TimeSignature } from '../../model/types'
import { LaneHeader } from '../LaneHeader/LaneHeader'
import { MeasureHeader } from '../MeasureHeader/MeasureHeader'
import { Grid } from '../Grid/Grid'
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
  showPulse?: boolean
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
  showPulse,
}: ScoreProps) {
  const canRemoveLane = score.lanes.length > 1
  const insertBtnWidth = 20

  return (
    <div className={styles.scoreContainer}>
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

        const handleSectionLabelEdit = (measureIndex: number) => {
          const section = sections.find(
            s => measureIndex >= s.startIndex && measureIndex < s.startIndex + s.length,
          )
          if (section) {
            const label = window.prompt('Section label (empty to remove):', section.label)
            if (label !== null) {
              onSectionLabelChange(lineIndex, section.measureId, label)
            }
          } else {
            const label = window.prompt('Section label:')
            if (label) {
              onSectionLabelChange(lineIndex, line[measureIndex].id, label)
            }
          }
        }

        const handleSectionLengthEdit = (section: Section) => {
          const maxLen = line.length - section.startIndex
          const input = window.prompt(
            `Section length in measures (1-${maxLen}):`,
            String(section.length),
          )
          if (input !== null) {
            const len = parseInt(input, 10)
            if (!isNaN(len) && len >= 1 && len <= maxLen) {
              onSectionLengthChange(lineIndex, section.measureId, len)
            }
          }
        }

        const handleRepeatClick = (section: Section) => {
          if (section.repeat) {
            const input = window.prompt('Play count (0 to remove):', String(section.repeat.times))
            if (input !== null) {
              const times = parseInt(input, 10)
              onRepeatChange(lineIndex, section.measureId, times > 0 ? times : null)
            }
          } else {
            const input = window.prompt('Play count:', '2')
            if (input !== null) {
              const times = parseInt(input, 10)
              if (times > 0) onRepeatChange(lineIndex, section.measureId, times)
            }
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
                <div className={styles.pulseLabel}>PULSE</div>
              )}
              {score.lanes.map(lane => (
                <LaneHeader
                  key={lane.id}
                  name={lane.name}
                  color={lane.color}
                  onNameChange={name => onLaneNameChange(lane.id, name)}
                  onColorChange={color => onLaneColorChange(lane.id, color)}
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
                        className={styles.sectionBanner}
                        style={{
                          width: sectionWidth,
                          marginLeft: hasInsertBtn ? insertBtnWidth : 0,
                        }}
                      >
                        <span
                          className={styles.sectionLabel}
                          onClick={() => handleSectionLabelEdit(index)}
                          title="Edit section label"
                        >
                          {section.label}
                        </span>
                        <button
                          className={styles.sectionLenBtn}
                          onClick={() => handleSectionLengthEdit(section)}
                          title="Set section length"
                        >
                          {section.length} {section.length === 1 ? 'measure' : 'measures'}
                        </button>
                        <button
                          className={styles.repeatBtn}
                          onClick={() => handleRepeatClick(section)}
                          title="Set repeat"
                        >
                          {section.repeat ? `play ${section.repeat.times}×` : '—'}
                        </button>
                      </div>
                    )
                  } else if (!isInsideSection) {
                    return (
                      <div
                        key={measure.id}
                        className={styles.sectionEmpty}
                        style={{
                          width: colWidth,
                          marginLeft: hasInsertBtn ? insertBtnWidth : 0,
                        }}
                        onClick={() => handleSectionLabelEdit(index)}
                        title="Add section"
                      >
                        <span className={styles.sectionHint}>+ section</span>
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
