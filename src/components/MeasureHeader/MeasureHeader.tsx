import type { TimeSignature } from '../../model/types'
import styles from './MeasureHeader.module.css'

interface MeasureHeaderProps {
  beats: number
  subdivision: number
  onTimeSignatureChange: (ts: TimeSignature) => void
  onRemove: () => void
  canRemove: boolean
}

export function MeasureHeader({
  beats,
  subdivision,
  onTimeSignatureChange,
  onRemove,
  canRemove,
}: MeasureHeaderProps) {
  return (
    <div className={styles.header}>
      <label className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Pulses</span>
        <select
          className={styles.select}
          value={beats}
          aria-label="Beats"
          onChange={(e) =>
            onTimeSignatureChange({ beats: Number(e.target.value), subdivision })
          }
        >
          {[2, 3, 4, 5, 6].map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </label>

      <label className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Cells/pulse</span>
        <select
          className={styles.select}
          value={subdivision}
          aria-label="Subdivision"
          onChange={(e) =>
            onTimeSignatureChange({ beats, subdivision: Number(e.target.value) })
          }
        >
          {[2, 3, 4, 6].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>

      <span className={styles.summary}>{beats}×{subdivision}={beats * subdivision}</span>

      <button
        className={styles.removeButton}
        onClick={onRemove}
        disabled={!canRemove}
        aria-label="Remove measure"
      >
        ✕
      </button>
    </div>
  )
}
