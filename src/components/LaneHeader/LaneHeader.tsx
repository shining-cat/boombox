import { useRef, useState } from 'react'
import { GM_PERCUSSION } from '../../model/midiMappings'
import { InstrumentPicker } from '../InstrumentPicker/InstrumentPicker'
import styles from './LaneHeader.module.css'

interface LaneHeaderProps {
  name: string
  color: string
  muted: boolean
  resolvedNote: number
  onNameChange: (name: string) => void
  onColorChange: (color: string) => void
  onToggleMute: () => void
  onInstrumentChange: (note: number | undefined) => void
  onRemove: () => void
  canRemove: boolean
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  if (muted) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5L6 9H2v6h4l5 4V5z" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M19.07 4.93a10 10 0 010 14.14" />
      <path d="M15.54 8.46a5 5 0 010 7.07" />
    </svg>
  )
}

export function LaneHeader({
  name,
  color,
  muted,
  resolvedNote,
  onNameChange,
  onColorChange,
  onToggleMute,
  onInstrumentChange,
  onRemove,
  canRemove,
}: LaneHeaderProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const instrumentName = GM_PERCUSSION.find(i => i.note === resolvedNote)?.name ?? 'Unknown'

  return (
    <div className={`${styles.laneHeader} ${muted ? styles.laneHeaderMuted : ''}`} style={{ backgroundColor: color }}>
      <button
        className={`${styles.muteButton} ${muted ? styles.muted : ''}`}
        onClick={onToggleMute}
        title={muted ? 'Unmute lane' : 'Mute lane'}
        aria-label={muted ? 'Unmute lane' : 'Mute lane'}
      >
        <SpeakerIcon muted={muted} />
      </button>
      <button
        ref={btnRef}
        className={styles.instrumentBtn}
        onClick={() => {
          if (pickerOpen) {
            setPickerOpen(false)
          } else {
            setAnchorRect(btnRef.current!.getBoundingClientRect())
            setPickerOpen(true)
          }
        }}
        title={`Sound: ${instrumentName} — click to change`}
      >
        {instrumentName}
      </button>
      {pickerOpen && anchorRect && (
        <InstrumentPicker
          currentNote={resolvedNote}
          anchorRect={anchorRect}
          onSelect={(note) => onInstrumentChange(note)}
          onClose={() => setPickerOpen(false)}
        />
      )}
      <input
        className={styles.nameInput}
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        aria-label="Lane name"
        title="Instrument name (applies to all lines)"
      />
      <input
        className={styles.colorInput}
        type="color"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        aria-label="Lane color"
        title="Lane background color"
      />
      <button
        className={styles.removeButton}
        onClick={() => {
          if (window.confirm(`Delete lane "${name}", confirm?`)) onRemove()
        }}
        disabled={!canRemove}
        title="Delete this lane"
      >
        &times;
      </button>
    </div>
  )
}
