import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MeasureHeader } from './MeasureHeader'

const defaultProps = {
  beats: 4,
  subdivision: 4,
  onTimeSignatureChange: vi.fn(),
  onRemove: vi.fn(),
  canRemove: true,
}

describe('MeasureHeader', () => {
  it('displays summary of cells', () => {
    render(<MeasureHeader {...defaultProps} />)
    expect(screen.getByText('4×4=16')).toBeInTheDocument()
  })

  it('displays pulses dropdown with correct value', () => {
    render(<MeasureHeader {...defaultProps} />)
    const beatsSelect = screen.getByLabelText('Beats') as HTMLSelectElement
    expect(beatsSelect.value).toBe('4')
  })

  it('displays subdivision dropdown with correct value', () => {
    render(<MeasureHeader {...defaultProps} />)
    const subdivisionSelect = screen.getByLabelText('Subdivision') as HTMLSelectElement
    expect(subdivisionSelect.value).toBe('4')
  })

  it('shows legend labels for dropdowns', () => {
    render(<MeasureHeader {...defaultProps} />)
    expect(screen.getByText('Pulses')).toBeInTheDocument()
    expect(screen.getByText('Cells/pulse')).toBeInTheDocument()
  })
})
