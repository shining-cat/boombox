import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionBanner } from './SectionBanner'

const defaultProps = {
  label: 'CHORUS',
  length: 3,
  repeat: { times: 4 },
  maxLength: 8,
  width: 240,
  onLabelChange: vi.fn(),
  onLengthChange: vi.fn(),
  onRepeatChange: vi.fn(),
}

describe('SectionBanner — idle render (named with repeat)', () => {
  it('renders the section label', () => {
    render(<SectionBanner {...defaultProps} />)
    expect(screen.getByText('CHORUS')).toBeInTheDocument()
  })

  it('renders the length field with value', () => {
    render(<SectionBanner {...defaultProps} />)
    expect(screen.getByText('Length:')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders the repeat field with value (N×)', () => {
    render(<SectionBanner {...defaultProps} />)
    expect(screen.getByText('Repeat:')).toBeInTheDocument()
    expect(screen.getByText('4×')).toBeInTheDocument()
  })
})

describe('SectionBanner — idle render (named, no repeat)', () => {
  it('shows "no repeat" when repeat is null', () => {
    render(<SectionBanner {...defaultProps} repeat={null} />)
    expect(screen.getByText('no repeat')).toBeInTheDocument()
    expect(screen.queryByText('4×')).not.toBeInTheDocument()
  })
})
