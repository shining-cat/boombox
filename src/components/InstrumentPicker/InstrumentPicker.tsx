import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { GM_PERCUSSION, INSTRUMENT_GROUPS } from '../../model/midiMappings'
import styles from './InstrumentPicker.module.css'

interface InstrumentPickerProps {
  currentNote: number
  anchorRect: DOMRect
  onSelect: (note: number) => void
  onClose: () => void
}

export function InstrumentPicker({ currentNote, anchorRect, onSelect, onClose }: InstrumentPickerProps) {
  const currentInstrument = GM_PERCUSSION.find(i => i.note === currentNote)
  const [activeGroup, setActiveGroup] = useState(currentInstrument?.group ?? INSTRUMENT_GROUPS[0])
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const instruments = GM_PERCUSSION.filter(i => i.group === activeGroup)

  return createPortal(
    <div
      className={styles.popover}
      ref={popoverRef}
      style={{ top: anchorRect.bottom + 4, left: anchorRect.left }}
    >
      <div className={styles.tabs}>
        {INSTRUMENT_GROUPS.map(group => (
          <button
            key={group}
            className={`${styles.tab} ${group === activeGroup ? styles.tabActive : ''}`}
            onClick={() => setActiveGroup(group)}
          >
            {group}
          </button>
        ))}
      </div>
      <div className={styles.grid}>
        {instruments.map(inst => (
          <button
            key={inst.note}
            className={`${styles.instrument} ${inst.note === currentNote ? styles.instrumentActive : ''}`}
            onClick={() => { onSelect(inst.note); onClose() }}
            title={`${inst.name} (${inst.note})`}
          >
            {inst.name}
          </button>
        ))}
      </div>
    </div>,
    document.body,
  )
}
