import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders with default score', () => {
    render(<App />)
    expect(screen.getByDisplayValue('Untitled Score')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Instrument 1')).toBeInTheDocument()
    expect(screen.getByText('+ Measure')).toBeInTheDocument()
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('can cycle a cell symbol by clicking', () => {
    render(<App />)
    const dots = screen.getAllByText('·')
    fireEvent.click(dots[0])
    const crosses = screen.getAllByText('✕')
    const cellCross = crosses.find(el => el.classList.contains('_symbol_8b3d2f'))
    expect(cellCross).toBeInTheDocument()
  })

  it('shows unsaved indicator after edit', () => {
    render(<App />)
    const dots = screen.getAllByText('·')
    fireEvent.click(dots[0])
    expect(screen.getByText('(unsaved)')).toBeInTheDocument()
  })
})
