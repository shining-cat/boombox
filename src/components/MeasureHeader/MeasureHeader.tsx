import type { TimeSignature } from '../../model/types'
import styles from './MeasureHeader.module.css'

interface MeasureHeaderProps {
  beats: number
  subdivision: number
  sectionLabel: string
  repeat: { times: number } | undefined
  onTimeSignatureChange: (ts: TimeSignature) => void
  onSectionLabelChange: (label: string) => void
  onRepeatChange: (times: number | null) => void
  onRemove: () => void
  canRemove: boolean
}

export function MeasureHeader({
  beats,
  subdivision,
  sectionLabel,
  repeat,
  onTimeSignatureChange,
  onSectionLabelChange,
  onRepeatChange,
  onRemove,
  canRemove,
}: MeasureHeaderProps) {
  const handleRepeatClick = () => {
    if (repeat) {
      const input = window.prompt('Repeat count (0 to remove):', String(repeat.times))
      if (input !== null) {
        const times = parseInt(input, 10)
        onRepeatChange(times > 0 ? times : null)
      }
    } else {
      const input = window.prompt('Repeat count:', '2')
      if (input !== null) {
        const times = parseInt(input, 10)
        if (times > 0) onRepeatChange(times)
      }
    }
  }

  return (
    <div className={styles.header}>
      <input
        className={styles.sectionLabel}
        type="text"
        value={sectionLabel}
        placeholder="section"
        aria-label="Section label"
        onChange={(e) => onSectionLabelChange(e.target.value)}
        style={{ textTransform: 'uppercase' }}
      />

      <span className={styles.timeSignature}>{beats}/4</span>

      <select
        className={styles.beatsSelect}
        value={beats}
        aria-label="Beats"
        onChange={(e) =>
          onTimeSignatureChange({ beats: Number(e.target.value), subdivision })
        }
      >
        {[2, 3, 4, 5, 6].map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>

      <select
        className={styles.subdivisionSelect}
        value={subdivision}
        aria-label="Subdivision"
        onChange={(e) =>
          onTimeSignatureChange({ beats, subdivision: Number(e.target.value) })
        }
      >
        {[2, 3, 4, 6].map((s) => (
          <option key={s} value={s}>
            ÷{s}
          </option>
        ))}
      </select>

      <button className={styles.repeatButton} onClick={handleRepeatClick} title="Set repeat">
        {repeat ? `×${repeat.times}` : '🔁'}
      </button>

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
