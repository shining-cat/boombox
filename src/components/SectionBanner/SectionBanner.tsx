import { useState } from 'react'
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

export function SectionBanner({
  label,
  length,
  repeat,
  width,
  onLabelChange,
}: SectionBannerProps) {
  const locked = label === null
  const lockedClass = locked ? styles.locked : ''

  const [nameEditing, setNameEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  const startNameEdit = () => {
    setNameDraft(label ?? '')
    setNameEditing(true)
  }

  const commitName = () => {
    setNameEditing(false)
    const trimmed = nameDraft.trim()
    if (trimmed === (label ?? '')) return
    onLabelChange(trimmed === '' ? null : trimmed)
  }

  const cancelName = () => {
    setNameEditing(false)
  }

  return (
    <div
      className={`${styles.banner} ${locked ? styles.bannerLocked : ''}`}
      style={{ width }}
    >
      <div className={styles.nameRow}>
        {nameEditing ? (
          <input
            aria-label="Section name"
            className={styles.nameInput}
            value={nameDraft}
            autoFocus
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName()
              else if (e.key === 'Escape') cancelName()
            }}
          />
        ) : locked ? (
          <span className={styles.namePlaceholder} onClick={startNameEdit}>
            + name
          </span>
        ) : (
          <>
            <span className={styles.nameValue} onClick={startNameEdit}>
              {label}
            </span>
            <button
              type="button"
              className={styles.removeBtn}
              aria-label="Remove section name"
              onClick={() => onLabelChange(null)}
            >
              ×
            </button>
          </>
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
