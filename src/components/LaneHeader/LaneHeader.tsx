import styles from './LaneHeader.module.css'

interface LaneHeaderProps {
  name: string
  color: string
  onNameChange: (name: string) => void
  onColorChange: (color: string) => void
  onRemove: () => void
  canRemove: boolean
}

export function LaneHeader({
  name,
  color,
  onNameChange,
  onColorChange,
  onRemove,
  canRemove,
}: LaneHeaderProps) {
  return (
    <div className={styles.laneHeader} style={{ backgroundColor: color }}>
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
