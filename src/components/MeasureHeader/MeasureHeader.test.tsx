import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MeasureHeader } from './MeasureHeader'

const defaultProps = {
  measureNumber: 1,
  totalMeasures: 3,
  beats: 4,
  subdivision: 4,
  onTimeSignatureChange: vi.fn(),
  onRemove: vi.fn(),
  canRemove: true,
}

describe('MeasureHeader', () => {
  it('displays measure number', () => {
    render(<MeasureHeader {...defaultProps} />)
    expect(screen.getByText('1/3')).toBeInTheDocument()
  })

  it('displays summary of cells', () => {
    render(<MeasureHeader {...defaultProps} />)
    expect(screen.getByText('4×4=16')).toBeInTheDocument()
  })

  it('displays pulses button with correct value', () => {
    render(<MeasureHeader {...defaultProps} />)
    expect(screen.getByTitle('Click to change number of pulses per measure')).toHaveTextContent('4')
  })

  it('displays subdivision button with correct value', () => {
    render(<MeasureHeader {...defaultProps} />)
    expect(screen.getByTitle('Click to change number of cells per pulse')).toHaveTextContent('4')
  })

  it('shows legend labels for dropdowns', () => {
    render(<MeasureHeader {...defaultProps} />)
    expect(screen.getByText('Pulses')).toBeInTheDocument()
    expect(screen.getByText('Cells/pulse')).toBeInTheDocument()
  })
})
