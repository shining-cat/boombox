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
        {score.measures.map((measure, index) => (
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
            {measure.repeat && <span aria-label="repeat start">𝄆</span>}
            <div
              className={[
                styles.measureColumn,
                measure.repeat ? styles.repeatStart : '',
              ].filter(Boolean).join(' ')}
            >
              <MeasureHeader
                beats={measure.timeSignature.beats}
                subdivision={measure.timeSignature.subdivision}
                sectionLabel={measure.sectionLabel ?? ''}
                repeat={measure.repeat}
                onTimeSignatureChange={ts => onTimeSignatureChange(measure.id, ts)}
                onSectionLabelChange={label => onSectionLabelChange(measure.id, label)}
                onRepeatChange={times => onRepeatChange(measure.id, times)}
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
            {measure.repeat && <span aria-label="repeat end">𝄇</span>}
          </div>
        ))}

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
