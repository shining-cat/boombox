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
  maxLength,
  width,
  onLabelChange,
  onLengthChange,
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

  const [lengthEditing, setLengthEditing] = useState(false)
  const [lengthDraft, setLengthDraft] = useState('')

  const startLengthEdit = () => {
    if (locked) return
    setLengthDraft(String(length))
    setLengthEditing(true)
  }

  const commitLength = () => {
    setLengthEditing(false)
    const parsed = parseInt(lengthDraft, 10)
    if (isNaN(parsed)) return
    const clamped = Math.max(1, Math.min(parsed, maxLength))
    if (clamped !== length) onLengthChange(clamped)
  }

  const cancelLength = () => setLengthEditing(false)

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
        {lengthEditing ? (
          <input
            aria-label="Section length"
            type="text"
            inputMode="numeric"
            className={styles.numInput}
            value={lengthDraft}
            autoFocus
            onChange={(e) => setLengthDraft(e.target.value)}
            onBlur={commitLength}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitLength()
              else if (e.key === 'Escape') cancelLength()
            }}
          />
        ) : (
          <span
            className={`${styles.fieldValue} ${lockedClass}`}
            onClick={startLengthEdit}
          >
            {length}
          </span>
        )}
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
