import type { Score as ScoreType, TimeSignature } from '../../model/types'
import { LaneHeader } from '../LaneHeader/LaneHeader'
import { MeasureHeader } from '../MeasureHeader/MeasureHeader'
import { Grid } from '../Grid/Grid'
import styles from './Score.module.css'

interface ScoreProps {
  score: ScoreType
  onCycleCell: (measureId: string, laneId: string, cellIndex: number) => void
  onCellContextMenu: (measureId: string, laneId: string, cellIndex: number, event: React.MouseEvent) => void
  onLaneNameChange: (laneId: string, name: string) => void
  onLaneColorChange: (laneId: string, color: string) => void
  onRemoveLane: (laneId: string) => void
  onTimeSignatureChange: (measureId: string, ts: TimeSignature) => void
  onSectionLabelChange: (measureId: string, label: string) => void
  onRepeatChange: (measureId: string, times: number | null) => void
  onRemoveMeasure: (measureId: string) => void
  onInsertMeasure: (index: number) => void
  onAddMeasure: () => void
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
  onRepeatChange,
  onRemoveMeasure,
  onInsertMeasure,
  onAddMeasure,
}: ScoreProps) {
  const canRemoveLane = score.lanes.length > 1
  const canRemoveMeasure = score.measures.length > 1

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
        {score.measures.map((measure, index) => {
          const cellCount = measure.timeSignature.beats * measure.timeSignature.subdivision

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
              <div className={styles.measureColumn}>
                <div className={styles.sectionRow}>
                  <input
                    className={styles.sectionInput}
                    type="text"
                    value={measure.sectionLabel ?? ''}
                    placeholder="section"
                    onChange={e => onSectionLabelChange(measure.id, e.target.value)}
                    style={{ width: `${Math.max(cellCount * 28, 80)}px` }}
                  />
                  {measure.sectionLabel && (
                    <button
                      className={styles.repeatBtn}
                      onClick={() => {
                        if (measure.repeat) {
                          const input = window.prompt('Repeat count (0 to remove):', String(measure.repeat.times))
                          if (input !== null) {
                            const times = parseInt(input, 10)
                            onRepeatChange(measure.id, times > 0 ? times : null)
                          }
                        } else {
                          const input = window.prompt('Repeat count:', '2')
                          if (input !== null) {
                            const times = parseInt(input, 10)
                            if (times > 0) onRepeatChange(measure.id, times)
                          }
                        }
                      }}
                      title="Set repeat for this section"
                    >
                      {measure.repeat ? `×${measure.repeat.times}` : '🔁'}
                    </button>
                  )}
                </div>
                <MeasureHeader
                  beats={measure.timeSignature.beats}
                  subdivision={measure.timeSignature.subdivision}
                  onTimeSignatureChange={ts => onTimeSignatureChange(measure.id, ts)}
                  onRemove={() => onRemoveMeasure(measure.id)}
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
  )
}
