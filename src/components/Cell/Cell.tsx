import type { CellSymbol } from '../../model/types'
import styles from './Cell.module.css'

const SYMBOL_DISPLAY: Record<string, string> = {
  cross: '✕',
  'double-cross': '✕✕',
  'empty-round': '○',
  'full-round': '●',
  'double-full-round': '●●',
  square: '■',
  diamond: '◆',
  dot: '•',
}

interface CellProps {
  symbol: CellSymbol
  label?: string
  isBeatStart?: boolean
  isRoll?: boolean
  isFlam?: boolean
  isTriplet?: boolean
  width?: number
  backgroundColor?: string
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

export function Cell({ symbol, label, isBeatStart, isRoll, isFlam, isTriplet, width, backgroundColor, onClick, onContextMenu }: CellProps) {
  const classNames = [
    styles.cell,
    isBeatStart ? styles.beatStart : '',
  ].filter(Boolean).join(' ')

  const style: React.CSSProperties = {}
  if (backgroundColor) style.backgroundColor = backgroundColor
  if (width) style.width = `${width}px`

  return (
    <div
      className={classNames}
      style={style}
      title="Click to cycle symbol, right-click for more options"
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <span className={styles.triZone}>{isTriplet ? 'TRI' : ''}</span>
      {isRoll ? (
        <span className={styles.roll}>≈</span>
      ) : symbol ? (
        <span className={styles.symbol}>
          {isFlam ? 'ʼ' : ''}{SYMBOL_DISPLAY[symbol]}
        </span>
      ) : (
        <span className={styles.empty}>-</span>
      )}
      <span className={styles.labelZone}>{label || ''}</span>
    </div>
  )
}
