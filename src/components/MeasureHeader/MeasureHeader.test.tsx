import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MeasureHeader } from './MeasureHeader'

const defaultProps = {
  beats: 4,
  subdivision: 4,
  sectionLabel: '',
  repeat: undefined,
  onTimeSignatureChange: vi.fn(),
  onSectionLabelChange: vi.fn(),
  onRepeatChange: vi.fn(),
  onRemove: vi.fn(),
  canRemove: true,
}

describe('MeasureHeader', () => {
  it('displays time signature "4/4"', () => {
    render(<MeasureHeader {...defaultProps} />)
    expect(screen.getByText('4/4')).toBeInTheDocument()
  })

  it('displays subdivision "÷4"', () => {
    render(<MeasureHeader {...defaultProps} />)
    const subdivisionSelect = screen.getByLabelText('Subdivision') as HTMLSelectElement
    expect(subdivisionSelect.value).toBe('4')
    // The selected option text should show ÷4
    const selectedOption = subdivisionSelect.options[subdivisionSelect.selectedIndex]
    expect(selectedOption.textContent).toBe('÷4')
  })

  it('displays section label when set', () => {
    render(<MeasureHeader {...defaultProps} sectionLabel="Intro" />)
    const input = screen.getByLabelText('Section label') as HTMLInputElement
    expect(input.value).toBe('Intro')
  })

  it('displays repeat "×3" when set', () => {
    render(<MeasureHeader {...defaultProps} repeat={{ times: 3 }} />)
    expect(screen.getByText('×3')).toBeInTheDocument()
  })
})
