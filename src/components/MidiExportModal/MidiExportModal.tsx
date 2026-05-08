import { useState, useMemo } from 'react'
import type { Score, CellSymbol } from '../../model/types'
import {
  GM_PERCUSSION,
  INSTRUMENT_GROUPS,
  VELOCITY_PRESETS,
  DEFAULT_SYMBOL_VELOCITIES,
  autoDetectInstrument,
} from '../../model/midiMappings'
import { generateMidi, downloadMidi } from '../../utils/midiExport'
import styles from './MidiExportModal.module.css'

const SYMBOL_DISPLAY: Record<string, string> = {
  cross: '✕ Cross',
  'double-cross': '✕✕ Double cross',
  'empty-round': '○ Empty round',
  'full-round': '● Full round',
  'double-full-round': '●● Double full',
  square: '■ Square',
  diamond: '◆ Diamond',
  dot: '• Dot',
}

interface MidiExportModalProps {
  score: Score
  onClose: () => void
}

export function MidiExportModal({ score, onClose }: MidiExportModalProps) {
  const [tempo, setTempo] = useState(120)
  const [instrumentMap, setInstrumentMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    for (const lane of score.lanes) {
      map[lane.id] = autoDetectInstrument(lane.name)
    }
    return map
  })
  const [velocityMap, setVelocityMap] = useState<Record<string, number>>(
    () => ({ ...DEFAULT_SYMBOL_VELOCITIES })
  )

  const usedSymbols = useMemo(() => {
    const symbols = new Set<CellSymbol>()
    for (const line of score.lines) {
      for (const measure of line) {
        for (const cells of Object.values(measure.cells)) {
          for (const cell of cells) {
            if (cell.symbol) symbols.add(cell.symbol)
          }
        }
      }
    }
    return [...symbols]
  }, [score])

  const handleExport = () => {
    const data = generateMidi(score, { tempo, instrumentMap, velocityMap })
    const filename = score.title || 'score'
    downloadMidi(data, `${filename}.mid`)
  }

  const groupedInstruments = useMemo(() => {
    const groups: Record<string, typeof GM_PERCUSSION> = {}
    for (const group of INSTRUMENT_GROUPS) {
      groups[group] = GM_PERCUSSION.filter(i => i.group === group)
    }
    return groups
  }, [])

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Export to MIDI</h2>
          <button className={styles.closeBtn} onClick={onClose} title="Close">&times;</button>
        </div>
        <div className={styles.content}>
          <p className={styles.disclaimer}>Experimental feature. Results may vary.</p>

          <div className={styles.field}>
            <label className={styles.label}>Tempo</label>
            <div className={styles.tempoRow}>
              <input
                className={styles.tempoInput}
                type="number"
                min={40}
                max={300}
                value={tempo}
                onChange={e => setTempo(Math.max(40, Math.min(300, parseInt(e.target.value, 10) || 120)))}
              />
              <span className={styles.bpmLabel}>BPM</span>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Instruments</h3>
            {score.lanes.map(lane => (
              <div key={lane.id} className={styles.mappingRow}>
                <span className={styles.laneName}>{lane.name}</span>
                <select
                  className={styles.select}
                  value={instrumentMap[lane.id]}
                  onChange={e => setInstrumentMap(prev => ({ ...prev, [lane.id]: parseInt(e.target.value, 10) }))}
                >
                  {INSTRUMENT_GROUPS.map(group => (
                    <optgroup key={group} label={group}>
                      {groupedInstruments[group].map(inst => (
                        <option key={inst.note} value={inst.note}>{inst.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {usedSymbols.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Velocities</h3>
              {usedSymbols.map(symbol => (
                <div key={symbol} className={styles.mappingRow}>
                  <span className={styles.laneName}>{SYMBOL_DISPLAY[symbol!] ?? symbol}</span>
                  <select
                    className={styles.select}
                    value={velocityMap[symbol!] ?? 90}
                    onChange={e => setVelocityMap(prev => ({ ...prev, [symbol!]: parseInt(e.target.value, 10) }))}
                  >
                    {VELOCITY_PRESETS.map(p => (
                      <option key={p.value} value={p.value}>{p.label} ({p.value})</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          <button className={styles.exportBtn} onClick={handleExport}>Export MIDI</button>
        </div>
      </div>
    </>
  )
}
