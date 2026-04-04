import { useState } from 'react'
import type { CellSymbol } from '../../model/types'
import type { RhythmTemplate } from '../../model/templates'
import { RHYTHM_TEMPLATES } from '../../model/templates'
import styles from './ContextMenu.module.css'

interface ContextMenuProps {
  x: number
  y: number
  hasTriplet: boolean
  hasRoll: boolean
  onSetSymbol: (symbol: CellSymbol) => void
  onSetLabel: () => void
  onSetTriplet: () => void
  onSetRoll: () => void
  onRemoveRoll: () => void
  onApplyTemplate: (template: RhythmTemplate) => void
  onClose: () => void
}

export function ContextMenu({ x, y, hasTriplet, hasRoll, onSetSymbol, onSetLabel, onSetTriplet, onSetRoll, onRemoveRoll, onApplyTemplate, onClose }: ContextMenuProps) {
  const [showTemplates, setShowTemplates] = useState(false)

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.menu} style={{ left: x, top: y }}>
        <button className={styles.item} onClick={() => onSetSymbol('cross')} title="Set cross symbol">✕ Cross</button>
        <button className={styles.item} onClick={() => onSetSymbol('empty-round')} title="Set empty round symbol">○ Empty round</button>
        <button className={styles.item} onClick={() => onSetSymbol('full-round')} title="Set full round symbol">● Full round</button>
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
        {hasRoll ? (
          <button className={styles.item} onClick={onRemoveRoll} title="Remove roll from this cell">Remove roll</button>
        ) : (
          <button className={styles.item} onClick={onSetRoll} title="Set a roll starting from this cell">Add roll</button>
        )}
        <div className={styles.separator} />
        <button
          className={`${styles.item} ${styles.submenuTrigger}`}
          onClick={() => setShowTemplates(!showTemplates)}
          title="Insert a preset rhythm pattern"
        >
          Insert a template {showTemplates ? '▾' : '▸'}
        </button>
        {showTemplates && RHYTHM_TEMPLATES.map(t => (
          <button
            key={t.name}
            className={`${styles.item} ${styles.templateItem}`}
            onClick={() => onApplyTemplate(t)}
            title={`${t.name} — ${t.beats}/${t.subdivision}, ${t.measures} ${t.measures === 1 ? 'measure' : 'measures'}`}
          >
            {t.name}
          </button>
        ))}
      </div>
    </>
  )
}
