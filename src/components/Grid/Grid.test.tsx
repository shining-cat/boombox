import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Grid } from './Grid'
import { createMeasure, createLane } from '../../model/factory'

describe('Grid', () => {
  it('renders correct number of cells for one lane (16 for 4/4 with subdivision 4)', () => {
    const lane = createLane('Surdo', '#FFB3BA')
    const measure = createMeasure([lane.id], { beats: 4, subdivision: 4 })

    const { container } = render(
      <Grid
        measure={measure}
        lanes={[lane]}
        onCycleCell={vi.fn()}
        onCellContextMenu={vi.fn()}
      />
    )

    const laneRows = container.querySelectorAll('[class*="laneRow"]')
    expect(laneRows).toHaveLength(1)

    const cells = laneRows[0].children
    expect(cells).toHaveLength(16)
  })

  it('renders cells for multiple lanes (32 total for 2 lanes)', () => {
    const lane1 = createLane('Surdo', '#FFB3BA')
    const lane2 = createLane('Caixa', '#BAFFC9')
    const measure = createMeasure([lane1.id, lane2.id], { beats: 4, subdivision: 4 })

    const { container } = render(
      <Grid
        measure={measure}
        lanes={[lane1, lane2]}
        onCycleCell={vi.fn()}
        onCellContextMenu={vi.fn()}
      />
    )

    const laneRows = container.querySelectorAll('[class*="laneRow"]')
    expect(laneRows).toHaveLength(2)

    const totalCells =
      laneRows[0].children.length + laneRows[1].children.length
    expect(totalCells).toBe(32)
  })
})
