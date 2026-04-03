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
        <button className={styles.item} onClick={() => onSetSymbol('cross')}>✕ Cross</button>
        <button className={styles.item} onClick={() => onSetSymbol('empty-round')}>○ Empty round</button>
        <button className={styles.item} onClick={() => onSetSymbol('full-round')}>● Full round</button>
        <button className={styles.item} onClick={() => onSetSymbol('square')}>■ Square</button>
        <button className={styles.item} onClick={() => onSetSymbol('diamond')}>◆ Diamond</button>
        <button className={styles.item} onClick={() => onSetSymbol(null)}>Clear</button>
        <div className={styles.separator} />
        <button className={styles.item} onClick={onSetLabel}>Add label</button>
        <div className={styles.separator} />
        <button className={styles.item} onClick={onSetTriplet}>Triplet</button>
        <button className={styles.item} onClick={onSetRoll}>Roll</button>
      </div>
    </>
  )
}
