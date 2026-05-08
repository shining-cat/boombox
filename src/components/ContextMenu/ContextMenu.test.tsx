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
    onRemoveRoll: vi.fn(),
    onSetFlam: vi.fn(),
    onRemoveFlam: vi.fn(),
    hasTriplet: false,
    hasRoll: false,
    inRoll: false,
    hasFlam: false,
    hasSymbol: true,
    onOpenTemplates: vi.fn(),
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
    expect(screen.getByText('✕✕ Double cross')).toBeInTheDocument()
    expect(screen.getByText('○ Empty round')).toBeInTheDocument()
    expect(screen.getByText('● Full round')).toBeInTheDocument()
    expect(screen.getByText('●● Double full')).toBeInTheDocument()
    expect(screen.getByText('■ Square')).toBeInTheDocument()
    expect(screen.getByText('◆ Diamond')).toBeInTheDocument()
    expect(screen.getByText('Clear')).toBeInTheDocument()
  })

  it('calls onSetSymbol with "double-cross" when Double cross is clicked', async () => {
    const user = userEvent.setup()
    const props = renderMenu()
    await user.click(screen.getByText('✕✕ Double cross'))
    expect(props.onSetSymbol).toHaveBeenCalledWith('double-cross')
  })

  it('calls onSetSymbol with "double-full-round" when Double full is clicked', async () => {
    const user = userEvent.setup()
    const props = renderMenu()
    await user.click(screen.getByText('●● Double full'))
    expect(props.onSetSymbol).toHaveBeenCalledWith('double-full-round')
  })

  it('renders Add triplet, Add roll, and Add label options', () => {
    renderMenu()
    expect(screen.getByText('Add label')).toBeInTheDocument()
    expect(screen.getByText('Add triplet')).toBeInTheDocument()
    expect(screen.getByText('Add roll')).toBeInTheDocument()
  })

  it('renders Remove triplet when hasTriplet is true', () => {
    renderMenu({ hasTriplet: true })
    expect(screen.getByText('Remove triplet')).toBeInTheDocument()
  })

  it('renders Remove roll when hasRoll is true', () => {
    renderMenu({ hasRoll: true })
    expect(screen.getByText('Remove roll')).toBeInTheDocument()
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

  it('calls onSetTriplet when Add triplet is clicked', async () => {
    const user = userEvent.setup()
    const props = renderMenu()
    await user.click(screen.getByText('Add triplet'))
    expect(props.onSetTriplet).toHaveBeenCalled()
  })

  it('calls onSetRoll when Add roll is clicked', async () => {
    const user = userEvent.setup()
    const props = renderMenu()
    await user.click(screen.getByText('Add roll'))
    expect(props.onSetRoll).toHaveBeenCalled()
  })

  it('renders Add flam when hasFlam is false and hasSymbol is true', () => {
    renderMenu({ hasFlam: false, hasSymbol: true })
    expect(screen.getByText('Add flam')).toBeInTheDocument()
  })

  it('renders Remove flam when hasFlam is true', () => {
    renderMenu({ hasFlam: true, hasSymbol: true })
    expect(screen.getByText('Remove flam')).toBeInTheDocument()
  })

  it('does not render flam options when hasSymbol is false', () => {
    renderMenu({ hasSymbol: false, hasFlam: false })
    expect(screen.queryByText('Add flam')).not.toBeInTheDocument()
    expect(screen.queryByText('Remove flam')).not.toBeInTheDocument()
  })

  it('calls onSetFlam when Add flam is clicked', async () => {
    const user = userEvent.setup()
    const props = renderMenu({ hasFlam: false, hasSymbol: true })
    await user.click(screen.getByText('Add flam'))
    expect(props.onSetFlam).toHaveBeenCalled()
  })

  it('calls onRemoveFlam when Remove flam is clicked', async () => {
    const user = userEvent.setup()
    const props = renderMenu({ hasFlam: true, hasSymbol: true })
    await user.click(screen.getByText('Remove flam'))
    expect(props.onRemoveFlam).toHaveBeenCalled()
  })

  it('shows Remove roll when inRoll is true (interior of a roll)', () => {
    renderMenu({ hasRoll: false, inRoll: true })
    expect(screen.getByText('Remove roll')).toBeInTheDocument()
    expect(screen.queryByText('Add roll')).not.toBeInTheDocument()
  })

  it('shows Remove roll when hasRoll is true (start cell)', () => {
    renderMenu({ hasRoll: true, inRoll: false })
    expect(screen.getByText('Remove roll')).toBeInTheDocument()
  })

  it('shows Add roll when neither hasRoll nor inRoll', () => {
    renderMenu({ hasRoll: false, inRoll: false })
    expect(screen.getByText('Add roll')).toBeInTheDocument()
  })
})
