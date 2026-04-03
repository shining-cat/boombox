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
}: ToolbarProps) {
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
      <button onClick={onNewScore} title="Create a new empty score">New</button>
      <button onClick={onLoad} title="Load a score from file">Load</button>
      <button className={styles.primaryButton} onClick={onSave} title="Save score to file">
        Save
      </button>
      <button onClick={onExportPdf} title="Export score as PDF">PDF</button>
      <button onClick={onExportPng} title="Export score as PNG image">PNG</button>
    </div>
  )
}
