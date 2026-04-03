import type { Measure, Lane } from '../../model/types'
import { Cell } from '../Cell/Cell'
import styles from './Grid.module.css'

interface GridProps {
  measure: Measure
  lanes: Lane[]
  onCycleCell: (laneId: string, cellIndex: number) => void
  onCellContextMenu: (laneId: string, cellIndex: number, e: React.MouseEvent) => void
}

export function Grid({ measure, lanes, onCycleCell, onCellContextMenu }: GridProps) {
  const { subdivision } = measure.timeSignature

  return (
    <div className={styles.grid}>
      {lanes.map(lane => (
        <div key={lane.id} className={styles.laneRow}>
          {measure.cells[lane.id]?.map((cell, i) => {
            const isBeatStart = i % subdivision === 0
            const isInRoll = measure.cells[lane.id].some(
              (c, ci) => c.roll && ci <= i && ci + c.roll.length > i && ci !== i
            )
            return (
              <Cell
                key={i}
                symbol={isInRoll ? null : cell.symbol}
                label={cell.label}
                isBeatStart={isBeatStart}
                isRoll={isInRoll || !!cell.roll}
                backgroundColor={lane.color}
                onClick={() => onCycleCell(lane.id, i)}
                onContextMenu={e => onCellContextMenu(lane.id, i, e)}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
