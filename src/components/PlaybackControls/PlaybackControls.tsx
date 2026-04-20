import type { TransportState } from '../../audio/useTransport'
import styles from './PlaybackControls.module.css'

export interface PlaybackControlsProps {
  state: TransportState
  tempo: number
  onPlay: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onTempoChange: (bpm: number) => void
}

export function PlaybackControls({
  state,
  tempo,
  onPlay,
  onPause,
  onResume,
  onStop,
  onTempoChange,
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
