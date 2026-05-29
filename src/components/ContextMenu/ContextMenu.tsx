import { useRef, useEffect, useState } from 'react'
import type { CellSymbol } from '../../model/types'
import styles from './ContextMenu.module.css'

interface ContextMenuProps {
  x: number
  y: number
  hasTriplet: boolean
  hasRoll: boolean
  inRoll: boolean
  hasFlam: boolean
  hasSymbol: boolean
  onSetSymbol: (symbol: CellSymbol) => void
  onSetLabel: () => void
  onSetTriplet: () => void
  onSetRoll: () => void
  onRemoveRoll: () => void
  onSetFlam: () => void
  onRemoveFlam: () => void
  onOpenTemplates: () => void
  onClose: () => void
}

export function ContextMenu({ x, y, hasTriplet, hasRoll, inRoll, hasFlam, hasSymbol, onSetSymbol, onSetLabel, onSetTriplet, onSetRoll, onRemoveRoll, onSetFlam, onRemoveFlam, onOpenTemplates, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: x, top: y })

  useEffect(() => {
    const reposition = () => {
      const el = menuRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.visualViewport?.height ?? window.innerHeight
      const vw = window.visualViewport?.width ?? window.innerWidth
      let left = x
      let top = y
      if (top + rect.height > vh - 8) {
        top = Math.max(8, vh - rect.height - 8)
      }
      if (left + rect.width > vw - 8) {
        left = Math.max(8, vw - rect.width - 8)
      }
      setPos({ left, top })
    }
    reposition()
    const vv = window.visualViewport
    vv?.addEventListener('resize', reposition)
    return () => vv?.removeEventListener('resize', reposition)
  }, [x, y])

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div ref={menuRef} className={styles.menu} style={{ left: pos.left, top: pos.top }}>
        <button className={styles.item} onClick={() => onSetSymbol('cross')} title="Set cross symbol">✕ Cross</button>
        <button className={styles.item} onClick={() => onSetSymbol('double-cross')} title="Set double cross symbol">✕✕ Double cross</button>
        <button className={styles.item} onClick={() => onSetSymbol('empty-round')} title="Set empty round symbol">○ Empty round</button>
        <button className={styles.item} onClick={() => onSetSymbol('full-round')} title="Set full round symbol">● Full round</button>
        <button className={styles.item} onClick={() => onSetSymbol('double-full-round')} title="Set double full round symbol">●● Double full</button>
        <button className={styles.item} onClick={() => onSetSymbol('cross-circle')} title="Set cross over a full circle">✕● Cross + circle</button>
        <button className={styles.item} onClick={() => onSetSymbol('square')} title="Set square symbol">■ Square</button>
        <button className={styles.item} onClick={() => onSetSymbol('diamond')} title="Set diamond symbol">◆ Diamond</button>
        <button className={styles.item} onClick={() => onSetSymbol('dot')} title="Set dot symbol">• Dot</button>
        <button className={styles.item} onClick={() => onSetSymbol(null)} title="Remove symbol from cell">Clear</button>
        <div className={styles.separator} />
        <button className={styles.item} onClick={onSetLabel} title="Add a text label below the cell">Add label</button>
        <div className={styles.separator} />
        <button className={styles.item} onClick={onSetTriplet} title={hasTriplet ? 'Remove triplet from this pulse' : 'Add triplet on this pulse (3 notes)'}>
          {hasTriplet ? 'Remove triplet' : 'Add triplet'}
        </button>
        {(hasRoll || inRoll) ? (
          <button className={styles.item} onClick={onRemoveRoll} title="Remove roll from this cell">Remove roll</button>
        ) : (
          <button className={styles.item} onClick={onSetRoll} title="Set a roll starting from this cell">Add roll</button>
        )}
        {hasSymbol && (hasFlam ? (
          <button className={styles.item} onClick={onRemoveFlam} title="Remove flam from this cell">Remove flam</button>
        ) : (
          <button className={styles.item} onClick={onSetFlam} title="Add a flam grace note before this hit">Add flam</button>
        ))}
        <div className={styles.separator} />
        <button className={styles.item} onClick={onOpenTemplates} title="Insert a preset rhythm pattern">
          Insert a template...
        </button>
      </div>
    </>
  )
}
