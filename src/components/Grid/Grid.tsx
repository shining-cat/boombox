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
  const { beats, subdivision } = measure.timeSignature
  const tripletBeats = measure.tripletBeats ?? {}

  return (
    <div className={styles.grid}>
      {lanes.map(lane => {
        const cells = measure.cells[lane.id] ?? []
        const laneTriplets = tripletBeats[lane.id] ?? []

        const beatElements: React.ReactNode[] = []
        let cellOffset = 0

        for (let beat = 0; beat < beats; beat++) {
          const isTriplet = laneTriplets.includes(beat)
          const beatCellCount = isTriplet ? 3 : subdivision
          const beatCells = cells.slice(cellOffset, cellOffset + beatCellCount)
          const startOffset = cellOffset

          if (isTriplet) {
            const tripletCellWidth = (subdivision * 28) / 3
            beatElements.push(
              <div key={`t${beat}`} className={styles.tripletGroup}>
                <span className={styles.tripletLabel}>TRI</span>
                <div className={styles.tripletCells}>
                  {beatCells.map((cell, i) => (
                    <Cell
                      key={startOffset + i}
                      symbol={cell.symbol}
                      label={cell.label}
                      isBeatStart={i === 0}
                      isRoll={!!cell.roll}
                      width={tripletCellWidth}
                      backgroundColor={lane.color}
                      onClick={() => onCycleCell(lane.id, startOffset + i)}
                      onContextMenu={e => onCellContextMenu(lane.id, startOffset + i, e)}
                    />
                  ))}
                </div>
              </div>
            )
          } else {
            beatCells.forEach((cell, i) => {
              const globalIdx = startOffset + i
              const isInRoll = cells.some(
                (c, ci) => c.roll && ci <= globalIdx && ci + c.roll.length > globalIdx && ci !== globalIdx
              )
              beatElements.push(
                <Cell
                  key={globalIdx}
                  symbol={isInRoll ? null : cell.symbol}
                  label={cell.label}
                  isBeatStart={i === 0}
                  isRoll={isInRoll || !!cell.roll}
                  backgroundColor={lane.color}
                  onClick={() => onCycleCell(lane.id, globalIdx)}
                  onContextMenu={e => onCellContextMenu(lane.id, globalIdx, e)}
                />
              )
            })
          }

          cellOffset += beatCellCount
        }

        return (
          <div key={lane.id} className={styles.laneRow}>
            {beatElements}
          </div>
        )
      })}
    </div>
  )
}
