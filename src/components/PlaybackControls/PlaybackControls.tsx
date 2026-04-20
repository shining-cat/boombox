import type { TransportState } from '../../audio/useTransport'
import styles from './PlaybackControls.module.css'

export interface PlaybackControlsProps {
  state: TransportState
  tempo: number
  looping: boolean
  onPlay: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onTempoChange: (bpm: number) => void
  onToggleLoop: () => void
}

export function PlaybackControls({
  state,
  tempo,
  looping,
  onPlay,
  onPause,
  onResume,
  onStop,
  onTempoChange,
  onToggleLoop,
}: PlaybackControlsProps) {
  const handlePlayPause = () => {
    if (state === 'playing') {
      onPause()
    } else if (state === 'paused') {
      onResume()
    } else {
      onPlay()
    }
  }

  const handleTempoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      onTempoChange(Math.max(40, Math.min(300, value)))
    }
  }

  const handleTempoSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTempoChange(parseInt(e.target.value, 10))
  }

  return (
    <div className={styles.playbackBlock}>
      <button
        className={styles.transportBtn}
        onClick={handlePlayPause}
        title={state === 'playing' ? 'Pause' : 'Play'}
      >
        {state === 'playing' ? '⏸' : '▶'}
      </button>
      <button
        className={styles.transportBtn}
        onClick={onStop}
        disabled={state === 'stopped'}
        title="Stop"
      >
        ⏹
      </button>
      <button
        className={`${styles.transportBtn} ${looping ? styles.loopActive : ''}`}
        onClick={onToggleLoop}
        title={looping ? 'Disable loop' : 'Loop all'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 014-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 01-4 4H3" />
        </svg>
      </button>
      <span className={styles.tempoLabel}>
        <svg className={styles.noteIcon} viewBox="0 0 24 32" aria-hidden="true">
          <ellipse cx="8" cy="27" rx="7" ry="5" transform="rotate(-20 8 27)" fill="currentColor" />
          <rect x="14" y="2" width="2.5" height="25" fill="currentColor" />
        </svg>
        =
      </span>
      <input
        className={styles.tempoInput}
        type="number"
        min={40}
        max={300}
        value={tempo}
        onChange={handleTempoInput}
        title="Tempo (BPM)"
      />
      <input
        className={styles.tempoSlider}
        type="range"
        min={40}
        max={300}
        value={tempo}
        onChange={handleTempoSlider}
        title="Tempo slider"
      />
    </div>
  )
}
