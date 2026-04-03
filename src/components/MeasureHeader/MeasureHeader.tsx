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

const BEAT_OPTIONS = [2, 3, 4, 5, 6]
const SUBDIVISION_OPTIONS = [2, 3, 4, 6]

function cycleValue(current: number, options: number[]): number {
  const idx = options.indexOf(current)
  return options[(idx + 1) % options.length]
}

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
    const next = cycleValue(beats, BEAT_OPTIONS)
    if (window.confirm(`Change pulses from ${beats} to ${next}? This will reset the measure content.`)) {
      onTimeSignatureChange({ beats: next, subdivision })
    }
  }

  const handleSubdivisionClick = () => {
    const next = cycleValue(subdivision, SUBDIVISION_OPTIONS)
    if (window.confirm(`Change cells/pulse from ${subdivision} to ${next}? This will reset the measure content.`)) {
      onTimeSignatureChange({ beats, subdivision: next })
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
