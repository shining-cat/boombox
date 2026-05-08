import styles from './SectionBanner.module.css'

export interface SectionBannerProps {
  label: string | null
  length: number
  repeat: { times: number } | null
  maxLength: number
  width: number
  onLabelChange: (label: string | null) => void
  onLengthChange: (length: number) => void
  onRepeatChange: (times: number | null) => void
}

export function SectionBanner({ label, length, repeat, width }: SectionBannerProps) {
  return (
    <div className={styles.banner} style={{ width }}>
      <div className={styles.nameRow}>{label}</div>
      <div className={styles.controlsRow}>
        <span className={styles.fieldLabel}>Length:</span>
        <span className={styles.fieldValue}>{length}</span>
        <span className={styles.fieldLabel}>Repeat:</span>
        {repeat ? (
          <span className={styles.fieldValue}>{repeat.times}×</span>
        ) : (
          <span className={styles.fieldEmpty}>no repeat</span>
        )}
      </div>
    </div>
  )
}
