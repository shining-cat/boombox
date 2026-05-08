import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('SectionBanner — idle render (unnamed)', () => {
  const unnamedProps = { ...defaultProps, label: null, length: 1, repeat: null }

  it('shows "+ name" placeholder when label is null', () => {
    render(<SectionBanner {...unnamedProps} />)
    expect(screen.getByText('+ name')).toBeInTheDocument()
  })

  it('applies locked class to length and repeat when unnamed', () => {
    render(<SectionBanner {...unnamedProps} />)
    const length = screen.getByText('1')
    const repeat = screen.getByText('no repeat')
    expect(length.className).toMatch(/locked/)
    expect(repeat.className).toMatch(/locked/)
  })

  it('does not render the × remove button when unnamed', () => {
    render(<SectionBanner {...unnamedProps} />)
    expect(screen.queryByLabelText('Remove section name')).not.toBeInTheDocument()
  })
})

describe('SectionBanner — name editing', () => {
  it('clicking the name turns it into an input pre-filled', async () => {
    render(<SectionBanner {...defaultProps} />)
    await userEvent.click(screen.getByText('CHORUS'))
    const input = screen.getByLabelText('Section name') as HTMLInputElement
    expect(input.value).toBe('CHORUS')
  })

  it('Enter commits the new name', async () => {
    const onLabelChange = vi.fn()
    render(<SectionBanner {...defaultProps} onLabelChange={onLabelChange} />)
    await userEvent.click(screen.getByText('CHORUS'))
    const input = screen.getByLabelText('Section name')
    await userEvent.clear(input)
    await userEvent.type(input, 'BRIDGE{Enter}')
    expect(onLabelChange).toHaveBeenCalledWith('BRIDGE')
  })

  it('Esc cancels the edit (no callback fired)', async () => {
    const onLabelChange = vi.fn()
    render(<SectionBanner {...defaultProps} onLabelChange={onLabelChange} />)
    await userEvent.click(screen.getByText('CHORUS'))
    const input = screen.getByLabelText('Section name')
    await userEvent.clear(input)
    await userEvent.type(input, 'BRIDGE{Escape}')
    expect(onLabelChange).not.toHaveBeenCalled()
  })

  it('blur commits', async () => {
    const onLabelChange = vi.fn()
    render(<SectionBanner {...defaultProps} onLabelChange={onLabelChange} />)
    await userEvent.click(screen.getByText('CHORUS'))
    const input = screen.getByLabelText('Section name') as HTMLInputElement
    await userEvent.clear(input)
    await userEvent.type(input, 'BRIDGE')
    input.blur()
    expect(onLabelChange).toHaveBeenCalledWith('BRIDGE')
  })

  it('committing empty name fires onLabelChange(null) — removes name', async () => {
    const onLabelChange = vi.fn()
    render(<SectionBanner {...defaultProps} onLabelChange={onLabelChange} />)
    await userEvent.click(screen.getByText('CHORUS'))
    const input = screen.getByLabelText('Section name')
    await userEvent.clear(input)
    await userEvent.type(input, '{Enter}')
    expect(onLabelChange).toHaveBeenCalledWith(null)
  })

  it('committing empty name on already-unnamed is a no-op', async () => {
    const onLabelChange = vi.fn()
    render(
      <SectionBanner
        {...defaultProps}
        label={null}
        length={1}
        repeat={null}
        onLabelChange={onLabelChange}
      />,
    )
    await userEvent.click(screen.getByText('+ name'))
    const input = screen.getByLabelText('Section name')
    await userEvent.type(input, '{Enter}')
    expect(onLabelChange).not.toHaveBeenCalled()
  })
})

describe('SectionBanner — × remove button', () => {
  it('renders × button when named', () => {
    render(<SectionBanner {...defaultProps} />)
    expect(screen.getByLabelText('Remove section name')).toBeInTheDocument()
  })

  it('clicking × fires onLabelChange(null)', async () => {
    const onLabelChange = vi.fn()
    render(<SectionBanner {...defaultProps} onLabelChange={onLabelChange} />)
    await userEvent.click(screen.getByLabelText('Remove section name'))
    expect(onLabelChange).toHaveBeenCalledWith(null)
  })
})

describe('SectionBanner — length editing', () => {
  it('clicking the length value turns it into a numeric input', async () => {
    render(<SectionBanner {...defaultProps} />)
    await userEvent.click(screen.getByText('3'))
    const input = screen.getByLabelText('Section length') as HTMLInputElement
    expect(input.value).toBe('3')
  })

  it('Enter commits a valid length', async () => {
    const onLengthChange = vi.fn()
    render(<SectionBanner {...defaultProps} onLengthChange={onLengthChange} />)
    await userEvent.click(screen.getByText('3'))
    const input = screen.getByLabelText('Section length')
    await userEvent.clear(input)
    await userEvent.type(input, '5{Enter}')
    expect(onLengthChange).toHaveBeenCalledWith(5)
  })

  it('Esc cancels (no callback)', async () => {
    const onLengthChange = vi.fn()
    render(<SectionBanner {...defaultProps} onLengthChange={onLengthChange} />)
    await userEvent.click(screen.getByText('3'))
    const input = screen.getByLabelText('Section length')
    await userEvent.clear(input)
    await userEvent.type(input, '5{Escape}')
    expect(onLengthChange).not.toHaveBeenCalled()
  })

  it('clamps length to maxLength when input exceeds it', async () => {
    const onLengthChange = vi.fn()
    render(
      <SectionBanner {...defaultProps} maxLength={5} onLengthChange={onLengthChange} />,
    )
    await userEvent.click(screen.getByText('3'))
    const input = screen.getByLabelText('Section length')
    await userEvent.clear(input)
    await userEvent.type(input, '99{Enter}')
    expect(onLengthChange).toHaveBeenCalledWith(5)
  })

  it('clamps length to 1 when input is 0 or negative', async () => {
    const onLengthChange = vi.fn()
    render(<SectionBanner {...defaultProps} onLengthChange={onLengthChange} />)
    await userEvent.click(screen.getByText('3'))
    const input = screen.getByLabelText('Section length')
    await userEvent.clear(input)
    await userEvent.type(input, '0{Enter}')
    expect(onLengthChange).toHaveBeenCalledWith(1)
  })

  it('does not fire callback if length unchanged after clamp', async () => {
    const onLengthChange = vi.fn()
    render(<SectionBanner {...defaultProps} length={3} onLengthChange={onLengthChange} />)
    await userEvent.click(screen.getByText('3'))
    const input = screen.getByLabelText('Section length')
    await userEvent.type(input, '{Enter}')
    expect(onLengthChange).not.toHaveBeenCalled()
  })
})

describe('SectionBanner — repeat editing', () => {
  it('clicking 4× turns into a numeric input pre-filled with 4', async () => {
    render(<SectionBanner {...defaultProps} />)
    await userEvent.click(screen.getByText('4×'))
    const input = screen.getByLabelText('Repeat count') as HTMLInputElement
    expect(input.value).toBe('4')
  })

  it('clicking "no repeat" turns into an empty numeric input', async () => {
    render(<SectionBanner {...defaultProps} repeat={null} />)
    await userEvent.click(screen.getByText('no repeat'))
    const input = screen.getByLabelText('Repeat count') as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('Enter commits a valid repeat', async () => {
    const onRepeatChange = vi.fn()
    render(<SectionBanner {...defaultProps} onRepeatChange={onRepeatChange} />)
    await userEvent.click(screen.getByText('4×'))
    const input = screen.getByLabelText('Repeat count')
    await userEvent.clear(input)
    await userEvent.type(input, '6{Enter}')
    expect(onRepeatChange).toHaveBeenCalledWith(6)
  })

  it('Esc cancels (no callback)', async () => {
    const onRepeatChange = vi.fn()
    render(<SectionBanner {...defaultProps} onRepeatChange={onRepeatChange} />)
    await userEvent.click(screen.getByText('4×'))
    const input = screen.getByLabelText('Repeat count')
    await userEvent.clear(input)
    await userEvent.type(input, '6{Escape}')
    expect(onRepeatChange).not.toHaveBeenCalled()
  })

  it('committing 0 clears the repeat', async () => {
    const onRepeatChange = vi.fn()
    render(<SectionBanner {...defaultProps} onRepeatChange={onRepeatChange} />)
    await userEvent.click(screen.getByText('4×'))
    const input = screen.getByLabelText('Repeat count')
    await userEvent.clear(input)
    await userEvent.type(input, '0{Enter}')
    expect(onRepeatChange).toHaveBeenCalledWith(null)
  })

  it('committing negative clears the repeat', async () => {
    const onRepeatChange = vi.fn()
    render(<SectionBanner {...defaultProps} onRepeatChange={onRepeatChange} />)
    await userEvent.click(screen.getByText('4×'))
    const input = screen.getByLabelText('Repeat count')
    await userEvent.clear(input)
    await userEvent.type(input, '-3{Enter}')
    expect(onRepeatChange).toHaveBeenCalledWith(null)
  })

  it('committing non-numeric cancels (no callback)', async () => {
    const onRepeatChange = vi.fn()
    render(<SectionBanner {...defaultProps} onRepeatChange={onRepeatChange} />)
    await userEvent.click(screen.getByText('4×'))
    const input = screen.getByLabelText('Repeat count')
    await userEvent.clear(input)
    await userEvent.type(input, 'abc{Enter}')
    expect(onRepeatChange).not.toHaveBeenCalled()
  })
})

describe('SectionBanner — locked tooltip', () => {
  it('length field has tooltip when unnamed', () => {
    render(<SectionBanner {...defaultProps} label={null} length={1} />)
    const length = screen.getByText('1')
    expect(length).toHaveAttribute('title', 'Set a name to enable')
  })

  it('repeat field has tooltip when unnamed', () => {
    render(<SectionBanner {...defaultProps} label={null} length={1} repeat={null} />)
    const repeat = screen.getByText('no repeat')
    expect(repeat).toHaveAttribute('title', 'Set a name to enable')
  })

  it('clicking locked length does not enter edit mode', async () => {
    render(<SectionBanner {...defaultProps} label={null} length={1} />)
    await userEvent.click(screen.getByText('1'))
    expect(screen.queryByLabelText('Section length')).not.toBeInTheDocument()
  })
})

describe('SectionBanner — tab order', () => {
  it('idle name/length/repeat spans are focusable when not locked', async () => {
    render(<SectionBanner {...defaultProps} />)
    const name = screen.getByText('CHORUS')
    const length = screen.getByText('3')
    const repeat = screen.getByText('4×')
    expect(name.tabIndex).toBeGreaterThanOrEqual(0)
    expect(length.tabIndex).toBeGreaterThanOrEqual(0)
    expect(repeat.tabIndex).toBeGreaterThanOrEqual(0)
  })

  it('locked length/repeat are NOT focusable', () => {
    render(<SectionBanner {...defaultProps} label={null} length={1} repeat={null} />)
    const length = screen.getByText('1')
    const repeat = screen.getByText('no repeat')
    expect(length.tabIndex).toBe(-1)
    expect(repeat.tabIndex).toBe(-1)
  })
})
