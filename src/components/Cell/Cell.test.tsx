import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Cell } from './Cell'

const noop = () => {}
const noopContext = (e: React.MouseEvent) => { e.preventDefault() }

describe('Cell', () => {
  it('renders dot for null symbol', () => {
    render(<Cell symbol={null} onClick={noop} onContextMenu={noopContext} />)
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it.each([
    ['cross', '✕'],
    ['empty-round', '○'],
    ['full-round', '●'],
    ['square', '■'],
    ['diamond', '◆'],
  ] as const)('renders %s as %s', (symbol, expected) => {
    render(<Cell symbol={symbol} onClick={noop} onContextMenu={noopContext} />)
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    render(<Cell symbol={null} onClick={handleClick} onContextMenu={noopContext} />)
    await userEvent.click(screen.getByText('-'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('renders label when provided', () => {
    render(<Cell symbol={null} label="R" onClick={noop} onContextMenu={noopContext} />)
    expect(screen.getByText('R')).toBeInTheDocument()
  })

  it('applies beatStart class when isBeatStart is true', () => {
    const { container } = render(
      <Cell symbol={null} isBeatStart onClick={noop} onContextMenu={noopContext} />
    )
    const cell = container.firstChild as HTMLElement
    expect(cell.className).toMatch(/beatStart/)
  })

  it('renders roll symbol when isRoll is true', () => {
    render(<Cell symbol="cross" isRoll onClick={noop} onContextMenu={noopContext} />)
    expect(screen.getByText('〰')).toBeInTheDocument()
    expect(screen.queryByText('✕')).not.toBeInTheDocument()
  })
})
