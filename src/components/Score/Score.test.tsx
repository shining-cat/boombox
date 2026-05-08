import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Score } from './Score'
import { createScore } from '../../model/factory'

function renderScore() {
  const score = createScore()
  return render(
    <Score
      score={score}
      onCycleCell={vi.fn()}
      onSplitRoll={vi.fn()}
      onCellContextMenu={vi.fn()}
      onLaneNameChange={vi.fn()}
      onLaneColorChange={vi.fn()}
      onRemoveLane={vi.fn()}
      onTimeSignatureChange={vi.fn()}
      onSectionLabelChange={vi.fn()}
      onSectionLengthChange={vi.fn()}
      onRepeatChange={vi.fn()}
      onRemoveMeasure={vi.fn()}
      onInsertMeasure={vi.fn()}
      onAddMeasure={vi.fn()}
      onAddLane={vi.fn()}
      onAddLine={vi.fn()}
      onToggleMute={vi.fn()}
      onInstrumentChange={vi.fn()}
      onTogglePulse={vi.fn()}
      pulseNote={37}
      onPulseInstrumentChange={vi.fn()}
    />
  )
}

describe('Score', () => {
  it('renders lane header with instrument name', () => {
    renderScore()
    const input = screen.getByDisplayValue('Instrument 1')
    expect(input).toBeDefined()
  })

  it('renders measure header with summary', () => {
    renderScore()
    expect(screen.getByText('4×4=16')).toBeDefined()
  })

  it('renders 16 grid cells (4 beats × 4 subdivisions)', () => {
    const { container } = renderScore()
    const dots = container.querySelectorAll('[class*="cell"]')
    expect(dots).toHaveLength(16)
  })

  it('renders "+ Measure" button', () => {
    renderScore()
    expect(screen.getByText('+ Measure')).toBeDefined()
  })
})
