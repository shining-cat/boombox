import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LaneHeader } from './LaneHeader'

const defaultProps = {
  name: 'Kick',
  color: '#ffcccc',
  onNameChange: vi.fn(),
  onColorChange: vi.fn(),
  onRemove: vi.fn(),
  canRemove: true,
}

describe('LaneHeader', () => {
  it('displays lane name in input', () => {
    render(<LaneHeader {...defaultProps} />)
    const input = screen.getByLabelText('Lane name') as HTMLInputElement
    expect(input.value).toBe('Kick')
  })

  it('calls onNameChange on edit', async () => {
    const onNameChange = vi.fn()
    render(<LaneHeader {...defaultProps} onNameChange={onNameChange} />)
    const input = screen.getByLabelText('Lane name')
    await userEvent.clear(input)
    await userEvent.type(input, 'Snare')
    expect(onNameChange).toHaveBeenCalled()
  })

  it('disables remove button when canRemove is false', () => {
    render(<LaneHeader {...defaultProps} canRemove={false} />)
    const button = screen.getByTitle('Remove lane')
    expect(button).toBeDisabled()
  })

  it('enables remove button when canRemove is true', () => {
    render(<LaneHeader {...defaultProps} canRemove={true} />)
    const button = screen.getByTitle('Remove lane')
    expect(button).not.toBeDisabled()
  })

  it('calls onRemove when remove button is clicked and confirmed', async () => {
    const onRemove = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<LaneHeader {...defaultProps} onRemove={onRemove} />)
    const button = screen.getByTitle('Remove lane')
    await userEvent.click(button)
    expect(onRemove).toHaveBeenCalledOnce()
    vi.restoreAllMocks()
  })
})
