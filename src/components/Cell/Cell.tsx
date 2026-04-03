import type { CellSymbol } from '../../model/types'
import styles from './Cell.module.css'

const SYMBOL_DISPLAY: Record<string, string> = {
  cross: '✕',
  'empty-round': '○',
  'full-round': '●',
  square: '■',
  diamond: '◆',
}

interface CellProps {
  symbol: CellSymbol
  label?: string
  isBeatStart?: boolean
  isRoll?: boolean
  backgroundColor?: string
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

export function Cell({ symbol, label, isBeatStart, isRoll, backgroundColor, onClick, onContextMenu }: CellProps) {
  const classNames = [
    styles.cell,
    isBeatStart ? styles.beatStart : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={classNames}
      style={backgroundColor ? { backgroundColor } : undefined}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {isRoll ? (
        <span className={styles.roll}>〰</span>
      ) : symbol ? (
        <span className={styles.symbol}>{SYMBOL_DISPLAY[symbol]}</span>
      ) : (
        <span className={styles.empty}>·</span>
      )}
      {label && <span className={styles.label}>{label}</span>}
    </div>
  )
}
