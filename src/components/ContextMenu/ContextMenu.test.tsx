import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ContextMenu } from './ContextMenu'

function renderMenu(overrides = {}) {
  const props = {
    x: 100,
    y: 200,
    onSetSymbol: vi.fn(),
    onSetLabel: vi.fn(),
    onSetTriplet: vi.fn(),
    onSetRoll: vi.fn(),
    onApplyTemplate: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  }
  render(<ContextMenu {...props} />)
  return props
}

describe('ContextMenu', () => {
  it('renders all symbol options', () => {
    renderMenu()
    expect(screen.getByText('✕ Cross')).toBeInTheDocument()
    expect(screen.getByText('○ Empty round')).toBeInTheDocument()
    expect(screen.getByText('● Full round')).toBeInTheDocument()
    expect(screen.getByText('■ Square')).toBeInTheDocument()
    expect(screen.getByText('◆ Diamond')).toBeInTheDocument()
    expect(screen.getByText('Clear')).toBeInTheDocument()
  })

  it('renders Triplet, Roll, and Add label options', () => {
    renderMenu()
    expect(screen.getByText('Add label')).toBeInTheDocument()
    expect(screen.getByText('Triplet')).toBeInTheDocument()
    expect(screen.getByText('Roll')).toBeInTheDocument()
  })

  it('calls onSetSymbol with "cross" when Cross is clicked', async () => {
    const user = userEvent.setup()
    const props = renderMenu()
    await user.click(screen.getByText('✕ Cross'))
    expect(props.onSetSymbol).toHaveBeenCalledWith('cross')
  })

  it('calls onSetSymbol with null when Clear is clicked', async () => {
    const user = userEvent.setup()
    const props = renderMenu()
    await user.click(screen.getByText('Clear'))
    expect(props.onSetSymbol).toHaveBeenCalledWith(null)
  })

  it('calls onSetLabel when Add label is clicked', async () => {
    const user = userEvent.setup()
    const props = renderMenu()
    await user.click(screen.getByText('Add label'))
    expect(props.onSetLabel).toHaveBeenCalled()
  })

  it('calls onSetTriplet when Triplet is clicked', async () => {
    const user = userEvent.setup()
    const props = renderMenu()
    await user.click(screen.getByText('Triplet'))
    expect(props.onSetTriplet).toHaveBeenCalled()
  })

  it('calls onSetRoll when Roll is clicked', async () => {
    const user = userEvent.setup()
    const props = renderMenu()
    await user.click(screen.getByText('Roll'))
    expect(props.onSetRoll).toHaveBeenCalled()
  })
})
