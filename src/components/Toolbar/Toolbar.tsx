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
      />
      {isDirty && <span className={styles.unsaved}>(unsaved)</span>}
      <div className={styles.spacer} />
      <button onClick={onNewScore}>New</button>
      <button onClick={onLoad}>Load</button>
      <button className={styles.primaryButton} onClick={onSave}>
        Save
      </button>
      <button onClick={onExportPdf}>PDF</button>
      <button onClick={onExportPng}>PNG</button>
    </div>
  )
}
