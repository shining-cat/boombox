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
  const cellWidth = 28

  return (
    <div className={styles.grid}>
      {lanes.map((lane, laneIndex) => {
        const cells = measure.cells[lane.id] ?? []
        const tripletBeats: number[] = []
        cells.forEach((cell, i) => {
          if (cell.triplet && i % subdivision === 0) {
            tripletBeats.push(i)
          }
        })

        return (
          <div key={lane.id} className={styles.laneRow}>
            {laneIndex === 0 && tripletBeats.map(startIdx => (
              <div
                key={`tri-${startIdx}`}
                className={styles.tripletMarker}
                style={{
                  left: startIdx * cellWidth,
                  width: subdivision * cellWidth,
                }}
              >
                TRI
              </div>
            ))}
            {cells.map((cell, i) => {
              const isBeatStart = i % subdivision === 0
              const isInRoll = cells.some(
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
        )
      })}
    </div>
  )
}
