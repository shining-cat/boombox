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
  onCycleCell: (measureId: string, laneId: string, cellIndex: number) => void
  onCellContextMenu: (measureId: string, laneId: string, cellIndex: number, event: React.MouseEvent) => void
  onLaneNameChange: (laneId: string, name: string) => void
  onLaneColorChange: (laneId: string, color: string) => void
  onRemoveLane: (laneId: string) => void
  onTimeSignatureChange: (measureId: string, ts: TimeSignature) => void
  onSectionLabelChange: (measureId: string, label: string) => void
  onSectionLengthChange: (measureId: string, length: number) => void
  onRepeatChange: (measureId: string, times: number | null) => void
  onRemoveMeasure: (measureId: string) => void
  onInsertMeasure: (index: number) => void
  onAddMeasure: () => void
}

function computeSections(measures: ScoreType['measures']): Section[] {
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
  return beats * subdivision * 28 + 1 // +1 for border
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
}: ScoreProps) {
  const canRemoveLane = score.lanes.length > 1
  const canRemoveMeasure = score.measures.length > 1
  const totalMeasures = score.measures.length
  const sections = computeSections(score.measures)

  // Compute cumulative pixel offsets for each measure column
  // Account for insert buttons (20px wide) between measures
  const insertBtnWidth = 20
  const measureOffsets: number[] = []
  let offset = 0
  for (let i = 0; i < score.measures.length; i++) {
    if (i > 0) offset += insertBtnWidth
    measureOffsets.push(offset)
    offset += getMeasureColumnWidth(
      score.measures[i].timeSignature.beats,
      score.measures[i].timeSignature.subdivision,
    )
  }

  const handleRemoveMeasure = (measureId: string, measureNumber: number) => {
    if (window.confirm(`Delete measure ${measureNumber}, confirm?`)) {
      onRemoveMeasure(measureId)
    }
  }

  const handleSectionLabelEdit = (measureIndex: number) => {
    // Find if this measure is covered by a section
    const section = sections.find(
      s => measureIndex >= s.startIndex && measureIndex < s.startIndex + s.length,
    )
    if (section) {
      // Edit existing section
      const label = window.prompt('Section label (empty to remove):', section.label)
      if (label !== null) {
        onSectionLabelChange(section.measureId, label)
      }
    } else {
      // Create new section on this measure
      const label = window.prompt('Section label:')
      if (label) {
        onSectionLabelChange(score.measures[measureIndex].id, label)
      }
    }
  }

  const handleSectionLengthEdit = (section: Section) => {
    const maxLen = score.measures.length - section.startIndex
    const input = window.prompt(
      `Section length in measures (1-${maxLen}):`,
      String(section.length),
    )
    if (input !== null) {
      const len = parseInt(input, 10)
      if (!isNaN(len) && len >= 1 && len <= maxLen) {
        onSectionLengthChange(section.measureId, len)
      }
    }
  }

  const handleRepeatClick = (section: Section) => {
    if (section.repeat) {
      const input = window.prompt('Repeat count (0 to remove):', String(section.repeat.times))
      if (input !== null) {
        const times = parseInt(input, 10)
        onRepeatChange(section.measureId, times > 0 ? times : null)
      }
    } else {
      const input = window.prompt('Repeat count:', '2')
      if (input !== null) {
        const times = parseInt(input, 10)
        if (times > 0) onRepeatChange(section.measureId, times)
      }
    }
  }

  // For each measure, determine if it's inside a section
  const measureSectionMap: (Section | null)[] = score.measures.map((_, i) => {
    return sections.find(s => i >= s.startIndex && i < s.startIndex + s.length) ?? null
  })

  return (
    <div className={styles.scoreWrapper}>
      <div className={styles.laneHeaders}>
        <div className={styles.sectionSpacer} />
        <div className={styles.headerSpacer} />
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
      </div>

      <div className={styles.measuresArea}>
        {/* Section banners */}
        <div className={styles.sectionBannerRow}>
          {score.measures.map((measure, index) => {
            const section = sections.find(s => s.startIndex === index)
            const isInsideSection = measureSectionMap[index] !== null
            const colWidth = getMeasureColumnWidth(
              measure.timeSignature.beats,
              measure.timeSignature.subdivision,
            )
            const hasInsertBtn = index > 0

            if (section) {
              // Compute total width of this section's measures + insert buttons between them
              let sectionWidth = 0
              for (let j = 0; j < section.length; j++) {
                const mi = section.startIndex + j
                if (mi >= score.measures.length) break
                if (j > 0) sectionWidth += insertBtnWidth
                sectionWidth += getMeasureColumnWidth(
                  score.measures[mi].timeSignature.beats,
                  score.measures[mi].timeSignature.subdivision,
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
                  <span className={styles.repeatLabel}>section repeats</span>
                  <button
                    className={styles.repeatBtn}
                    onClick={() => handleRepeatClick(section)}
                    title="Set repeat"
                  >
                    {section.repeat ? `×${section.repeat.times}` : '—'}
                  </button>
                </div>
              )
            } else if (!isInsideSection) {
              // Empty space for measures not in any section — clickable to create section
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
            // Measures inside a section (not the first) render nothing
            return null
          })}
        </div>

        {/* Measure columns */}
        <div className={styles.measureColumnsRow}>
          {score.measures.map((measure, index) => {
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
                    onClick={() => onInsertMeasure(index)}
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
                    onTimeSignatureChange={ts => onTimeSignatureChange(measure.id, ts)}
                    onRemove={() => handleRemoveMeasure(measure.id, index + 1)}
                    canRemove={canRemoveMeasure}
                  />
                  <Grid
                    measure={measure}
                    lanes={score.lanes}
                    onCycleCell={(laneId, cellIndex) => onCycleCell(measure.id, laneId, cellIndex)}
                    onCellContextMenu={(laneId, cellIndex, e) => onCellContextMenu(measure.id, laneId, cellIndex, e)}
                  />
                </div>
              </div>
            )
          })}

          <button
            className={styles.addMeasureBtn}
            onClick={onAddMeasure}
          >
            + Measure
          </button>
        </div>
      </div>
    </div>
  )
}
