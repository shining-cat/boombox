import type { CellSymbol } from '../../model/types'
import styles from './ContextMenu.module.css'

interface ContextMenuProps {
  x: number
  y: number
  onSetSymbol: (symbol: CellSymbol) => void
  onSetLabel: () => void
  onSetTriplet: () => void
  onSetRoll: () => void
  onClose: () => void
}

export function ContextMenu({ x, y, onSetSymbol, onSetLabel, onSetTriplet, onSetRoll, onClose }: ContextMenuProps) {
  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.menu} style={{ left: x, top: y }}>
        <button className={styles.item} onClick={() => onSetSymbol('cross')} title="Set cross symbol">✕ Cross</button>
        <button className={styles.item} onClick={() => onSetSymbol('empty-round')} title="Set empty round symbol">○ Empty round</button>
        <button className={styles.item} onClick={() => onSetSymbol('full-round')} title="Set full round symbol">● Full round</button>
        <button className={styles.item} onClick={() => onSetSymbol('square')} title="Set square symbol">■ Square</button>
        <button className={styles.item} onClick={() => onSetSymbol('diamond')} title="Set diamond symbol">◆ Diamond</button>
        <button className={styles.item} onClick={() => onSetSymbol(null)} title="Remove symbol from cell">Clear</button>
        <div className={styles.separator} />
        <button className={styles.item} onClick={onSetLabel} title="Add a text label below the cell">Add label</button>
        <div className={styles.separator} />
        <button className={styles.item} onClick={onSetTriplet} title="Toggle triplet on this pulse (3 notes)">Triplet</button>
        <button className={styles.item} onClick={onSetRoll} title="Set a roll starting from this cell">Roll</button>
      </div>
    </>
  )
}
