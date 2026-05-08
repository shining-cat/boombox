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

export function SectionBanner({ label, width }: SectionBannerProps) {
  return (
    <div className={styles.banner} style={{ width }}>
      <div className={styles.nameRow}>{label}</div>
    </div>
  )
}
