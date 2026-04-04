import { useState } from 'react'
import styles from './Toolbar.module.css'

export interface ToolbarProps {
  title: string
  isDirty: boolean
  onTitleChange: (title: string) => void
  onSave: () => void
  onLoad: () => void
  onExportPdf: () => void
  onExportPng: () => void
  onNewScore: () => void
  showPulse: boolean
  onTogglePulse: () => void
}

export function Toolbar({
  title,
  isDirty,
  onTitleChange,
  onSave,
  onLoad,
  onExportPdf,
  onExportPng,
  onNewScore,
  showPulse,
  onTogglePulse,
}: ToolbarProps) {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className={styles.toolbar}>
      <input
        className={styles.titleInput}
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        aria-label="Score title"
        title="Score title"
      />
      {isDirty && <span className={styles.unsaved}>(unsaved)</span>}
      <div className={styles.spacer} />
      <button onClick={() => setShowHelp(true)} title="Show help">Help</button>
      <div className={styles.spacer} />
      <button onClick={onTogglePulse} title={showPulse ? 'Hide pulse lane' : 'Show pulse lane'}>
        {showPulse ? 'Hide Pulse' : 'Show Pulse'}
      </button>
      <button onClick={onNewScore} title="Create a new empty score">New</button>
      <button onClick={onLoad} title="Load a score from file">Load</button>
      <button className={styles.primaryButton} onClick={onSave} title="Save score to file">
        Save
      </button>
      <button onClick={onExportPdf} title="Export score as PDF">PDF</button>
      <button onClick={onExportPng} title="Export score as PNG image">PNG</button>

      {showHelp && (
        <>
          <div className={styles.helpOverlay} onClick={() => setShowHelp(false)} />
          <div className={styles.helpModal}>
            <div className={styles.helpHeader}>
              <h2>Help</h2>
              <button className={styles.helpClose} onClick={() => setShowHelp(false)} title="Close help">&times;</button>
            </div>
            <div className={styles.helpContent}>
              <p className={styles.helpIntro}>Boombox is a tool for writing and sharing non-melodic percussion scores. It does not offer playback features.</p>

              <section>
                <h3>Getting Started</h3>
                <ul>
                  <li>Click any cell to cycle through symbols (cross, circle, dot, etc.)</li>
                  <li>Right-click a cell for more options</li>
                </ul>
              </section>

              <section>
                <h3>Symbols</h3>
                <ul>
                  <li>✕ Cross, ○ Empty round, ● Full round, ■ Square, ◆ Diamond, • Dot</li>
                  <li>Click cycles through them; right-click to pick directly or clear</li>
                </ul>
              </section>

              <section>
                <h3>Measures &amp; Lines</h3>
                <ul>
                  <li>"+ Measure" adds a measure to the current line</li>
                  <li>"+" between measures inserts one in between</li>
                  <li>"+ Line" adds a new line below</li>
                  <li>Click pulses/cells-per-pulse values to change time signature (resets measure content)</li>
                </ul>
              </section>

              <section>
                <h3>Lanes (Instruments)</h3>
                <ul>
                  <li>"+ Lane" at the bottom of the lane column</li>
                  <li>Click the name or color to edit; changes apply to all lines</li>
                  <li>Delete with the × button (requires confirmation)</li>
                </ul>
              </section>

              <section>
                <h3>Sections &amp; Repeats</h3>
                <ul>
                  <li>Click "+ section" above a measure to create a section</li>
                  <li>Set section length (number of measures) and play count (N×)</li>
                  <li>Click the label to rename or remove</li>
                </ul>
              </section>

              <section>
                <h3>Triplets &amp; Rolls</h3>
                <ul>
                  <li>Right-click a cell → Add triplet: replaces the pulse with 3 wider cells</li>
                  <li>Right-click a cell → Add roll: marks a roll starting from that cell</li>
                  <li>To remove, right-click the starting cell of the triplet or roll</li>
                </ul>
              </section>

              <section>
                <h3>Rhythm Templates</h3>
                <ul>
                  <li>Right-click a cell → Insert a template</li>
                  <li>Preset patterns (Clave, Afoxe, Rumba, etc.) fill from the clicked cell onward</li>
                </ul>
              </section>

              <section>
                <h3>Pulse Lane</h3>
                <ul>
                  <li>"Show Pulse" in the toolbar adds a read-only lane showing beat positions</li>
                </ul>
              </section>

              <section>
                <h3>Files &amp; Sharing</h3>
                <p className={styles.helpWarning}>This program never saves anything on its own. You need to save (download) yourself, and load your saved file next time you want to work on it.</p>
                <ul>
                  <li>Save/Load use <code>.boombox.json</code> files</li>
                  <li>Export to PDF or PNG</li>
                  <li>Warning before leaving with unsaved changes</li>
                  <li>To print, export a PDF file</li>
                  <li>To share with others, export a PDF or PNG file</li>
                  <li>To share a modifiable file, share the <code>.boombox.json</code> file</li>
                </ul>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
