import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Toolbar } from './Toolbar'

function renderToolbar(overrides: Partial<React.ComponentProps<typeof Toolbar>> = {}) {
  const props = {
    title: 'My Score',
    isDirty: false,
    onTitleChange: vi.fn(),
    onSave: vi.fn(),
    onLoad: vi.fn(),
    onExportPdf: vi.fn(),
    onExportPng: vi.fn(),
    onExportMidi: vi.fn(),
    onNewScore: vi.fn(),
    showPulse: false,
    onTogglePulse: vi.fn(),
    transportState: 'stopped' as const,
    tempo: 120,
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    onStop: vi.fn(),
    onTempoChange: vi.fn(),
    looping: false,
    onToggleLoop: vi.fn(),
    ...overrides,
  }
  render(<Toolbar {...props} />)
  return props
}

describe('Toolbar', () => {
  it('displays the title in the input', () => {
    renderToolbar({ title: 'Test Title' })
    expect(screen.getByDisplayValue('Test Title')).toBeInTheDocument()
  })

  it('calls onTitleChange when the title is edited', async () => {
    const user = userEvent.setup()
    const props = renderToolbar({ title: '' })
    const input = screen.getByLabelText('Score title')
    await user.type(input, 'A')
    expect(props.onTitleChange).toHaveBeenCalledWith('A')
  })

  it('renders Save and Load buttons', () => {
    renderToolbar()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Load' })).toBeInTheDocument()
  })

  it('shows "(unsaved)" when isDirty is true', () => {
    renderToolbar({ isDirty: true })
    expect(screen.getByText('(unsaved)')).toBeInTheDocument()
  })

  it('does not show "(unsaved)" when isDirty is false', () => {
    renderToolbar({ isDirty: false })
    expect(screen.queryByText('(unsaved)')).not.toBeInTheDocument()
  })

  it('renders New, PDF, and PNG buttons', () => {
    renderToolbar()
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'PDF' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'PNG' })).toBeInTheDocument()
  })
})
