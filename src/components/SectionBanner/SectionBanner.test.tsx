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
})
