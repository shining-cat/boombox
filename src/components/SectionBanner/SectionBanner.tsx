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
  const locked = label === null
  const lockedClass = locked ? styles.locked : ''

  return (
    <div
      className={`${styles.banner} ${locked ? styles.bannerLocked : ''}`}
      style={{ width }}
    >
      <div className={styles.nameRow}>
        {locked ? (
          <span className={styles.namePlaceholder}>+ name</span>
        ) : (
          <span className={styles.nameValue}>{label}</span>
        )}
      </div>
      <div className={styles.controlsRow}>
        <span className={styles.fieldLabel}>Length:</span>
        <span className={`${styles.fieldValue} ${lockedClass}`}>{length}</span>
        <span className={styles.fieldLabel}>Repeat:</span>
        {repeat ? (
          <span className={`${styles.fieldValue} ${lockedClass}`}>{repeat.times}×</span>
        ) : (
          <span className={`${styles.fieldEmpty} ${lockedClass}`}>no repeat</span>
        )}
      </div>
    </div>
  )
}
