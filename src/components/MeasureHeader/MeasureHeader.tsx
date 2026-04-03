import type { TimeSignature } from '../../model/types'
import styles from './MeasureHeader.module.css'

interface MeasureHeaderProps {
  measureNumber: number
  totalMeasures: number
  beats: number
  subdivision: number
  onTimeSignatureChange: (ts: TimeSignature) => void
  onRemove: () => void
  canRemove: boolean
}

const BEAT_OPTIONS = [2, 3, 4, 6]
const SUBDIVISION_OPTIONS = [2, 3, 4, 6, 8]

export function MeasureHeader({
  measureNumber,
  totalMeasures,
  beats,
  subdivision,
  onTimeSignatureChange,
  onRemove,
  canRemove,
}: MeasureHeaderProps) {
  const handleBeatsClick = () => {
    const options = BEAT_OPTIONS.filter((b) => b !== beats).join(', ')
    const input = window.prompt(
      `Change pulses (currently ${beats}).\nAvailable: ${options}\nThis will reset the measure content.`,
      String(beats),
    )
    if (input === null) return
    const value = parseInt(input, 10)
    if (BEAT_OPTIONS.includes(value) && value !== beats) {
      onTimeSignatureChange({ beats: value, subdivision })
    }
  }

  const handleSubdivisionClick = () => {
    const options = SUBDIVISION_OPTIONS.filter((s) => s !== subdivision).join(', ')
    const input = window.prompt(
      `Change cells/pulse (currently ${subdivision}).\nAvailable: ${options}\nThis will reset the measure content.`,
      String(subdivision),
    )
    if (input === null) return
    const value = parseInt(input, 10)
    if (SUBDIVISION_OPTIONS.includes(value) && value !== subdivision) {
      onTimeSignatureChange({ beats, subdivision: value })
    }
  }

  return (
    <div className={styles.header}>
      <span className={styles.measureNum}>{measureNumber}/{totalMeasures}</span>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Pulses</span>
        <button
          className={styles.valueBtn}
          onClick={handleBeatsClick}
          title="Change pulses (cycles through values)"
        >
          {beats}
        </button>
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Cells/pulse</span>
        <button
          className={styles.valueBtn}
          onClick={handleSubdivisionClick}
          title="Change cells per pulse (cycles through values)"
        >
          {subdivision}
        </button>
      </div>

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
