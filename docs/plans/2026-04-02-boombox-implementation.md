# Boombox Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a web app for writing and reading Brazilian drum band rhythm scores — no playback, just notation.

**Architecture:** React SPA with all state managed in a single `useScore` hook. Score data is a tree: Score -> Measures -> Cells (per lane). File I/O is JSON save/load via browser file APIs. Export via html2canvas + jsPDF. No backend.

**Tech Stack:** React 18, TypeScript, Vite, CSS Modules, jsPDF, html2canvas, uuid, Vitest + React Testing Library.

**Design doc:** `docs/plans/2026-04-02-boombox-design.md`

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `LICENSE`
- Create: `.github/workflows/deploy.yml`
- Create: `.gitignore`

**Step 1: Scaffold Vite + React + TypeScript project**

Run:
```bash
cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox
npm create vite@latest . -- --template react-ts
```

If it prompts about existing files, allow overwrite of config files but keep `docs/` and `plans/`.

**Step 2: Install dependencies**

Run:
```bash
cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox
npm install uuid jspdf html2canvas
npm install -D @types/uuid vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Step 3: Configure Vitest**

Add to `vite.config.ts`:
```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/boombox/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

Create `src/test/setup.ts`:
```ts
import '@testing-library/jest-dom'
```

Add to `tsconfig.json` compilerOptions:
```json
"types": ["vitest/globals"]
```

**Step 4: Add test script to package.json**

Add to scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 5: Add GPL-3.0 LICENSE file**

Download or write the GPL-3.0 license text to `LICENSE`.

**Step 6: Create .gitignore**

```
node_modules/
dist/
.DS_Store
```

**Step 7: Create GitHub Actions deploy workflow**

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Step 8: Clean up Vite boilerplate**

Replace `src/App.tsx` with:
```tsx
function App() {
  return <div>Boombox</div>
}

export default App
```

Remove `src/App.css` contents (keep file). Remove Vite/React logos from `public/` and `src/`.

**Step 9: Verify build and test**

Run:
```bash
cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox
npm run build && npm test
```

Expected: Build succeeds, no tests yet (0 tests).

**Step 10: Commit**

```bash
git add -A
git commit -m "Scaffold Vite + React + TypeScript project with Vitest and GitHub Pages deploy"
```

---

### Task 2: Data Model & Types

**Files:**
- Create: `src/model/types.ts`
- Create: `src/model/types.test.ts`
- Create: `src/model/factory.ts`
- Create: `src/model/factory.test.ts`

**Step 1: Write the type definitions**

Create `src/model/types.ts`:
```ts
export type CellSymbol = 'cross' | 'empty-round' | 'full-round' | 'square' | 'diamond' | null

export const SYMBOL_CYCLE: CellSymbol[] = [null, 'cross', 'empty-round', 'full-round', 'square', 'diamond']

export interface Cell {
  symbol: CellSymbol
  label?: string
  triplet?: boolean
  roll?: { length: number }
}

export interface TimeSignature {
  beats: number
  subdivision: number
}

export interface Measure {
  id: string
  timeSignature: TimeSignature
  sectionLabel?: string
  repeat?: { times: number }
  cells: Record<string, Cell[]> // keyed by lane ID
}

export interface Lane {
  id: string
  name: string
  color: string
}

export interface Score {
  title: string
  author: string
  tempo: number
  lanes: Lane[]
  measures: Measure[]
}
```

**Step 2: Write failing tests for factory functions**

Create `src/model/factory.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { createCell, createMeasure, createLane, createScore } from './factory'

describe('createCell', () => {
  it('creates an empty cell', () => {
    const cell = createCell()
    expect(cell.symbol).toBeNull()
    expect(cell.label).toBeUndefined()
    expect(cell.triplet).toBeUndefined()
    expect(cell.roll).toBeUndefined()
  })
})

describe('createMeasure', () => {
  it('creates a measure with correct number of cells per lane', () => {
    const laneIds = ['lane-1', 'lane-2']
    const measure = createMeasure(laneIds, { beats: 4, subdivision: 4 })
    expect(measure.timeSignature).toEqual({ beats: 4, subdivision: 4 })
    expect(measure.cells['lane-1']).toHaveLength(16)
    expect(measure.cells['lane-2']).toHaveLength(16)
    expect(measure.cells['lane-1'][0].symbol).toBeNull()
  })

  it('creates a ternary measure with 12 cells', () => {
    const measure = createMeasure(['lane-1'], { beats: 4, subdivision: 3 })
    expect(measure.cells['lane-1']).toHaveLength(12)
  })
})

describe('createLane', () => {
  it('creates a lane with name and color', () => {
    const lane = createLane('Surdo', '#FFB3BA')
    expect(lane.name).toBe('Surdo')
    expect(lane.color).toBe('#FFB3BA')
    expect(lane.id).toBeTruthy()
  })
})

describe('createScore', () => {
  it('creates a default score with 1 lane and 1 measure', () => {
    const score = createScore()
    expect(score.title).toBe('Untitled Score')
    expect(score.lanes).toHaveLength(1)
    expect(score.measures).toHaveLength(1)
    expect(score.measures[0].cells[score.lanes[0].id]).toHaveLength(16)
  })
})
```

**Step 3: Run tests to verify they fail**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/model/factory.test.ts`

Expected: FAIL — `factory` module not found.

**Step 4: Implement factory functions**

Create `src/model/factory.ts`:
```ts
import { v4 as uuidv4 } from 'uuid'
import type { Cell, Lane, Measure, Score, TimeSignature } from './types'

const PASTEL_COLORS = [
  '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA',
  '#E8BAFF', '#FFD9BA', '#BAFFF5', '#FFC9DE',
]

export function createCell(): Cell {
  return { symbol: null }
}

export function createMeasure(laneIds: string[], timeSignature: TimeSignature): Measure {
  const totalCells = timeSignature.beats * timeSignature.subdivision
  const cells: Record<string, Cell[]> = {}
  for (const laneId of laneIds) {
    cells[laneId] = Array.from({ length: totalCells }, () => createCell())
  }
  return {
    id: uuidv4(),
    timeSignature,
    cells,
  }
}

export function createLane(name: string, color?: string): Lane {
  return {
    id: uuidv4(),
    name,
    color: color ?? PASTEL_COLORS[0],
  }
}

export function createScore(): Score {
  const lane = createLane('Instrument 1', PASTEL_COLORS[0])
  const measure = createMeasure([lane.id], { beats: 4, subdivision: 4 })
  return {
    title: 'Untitled Score',
    author: '',
    tempo: 120,
    lanes: [lane],
    measures: [measure],
  }
}
```

**Step 5: Run tests to verify they pass**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/model/factory.test.ts`

Expected: All PASS.

**Step 6: Commit**

```bash
git add src/model/
git commit -m "Add data model types and factory functions with tests"
```

---

### Task 3: Score State Management Hook

**Files:**
- Create: `src/state/useScore.ts`
- Create: `src/state/useScore.test.ts`

**Step 1: Write failing tests for the score hook**

Create `src/state/useScore.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useScore } from './useScore'

describe('useScore', () => {
  it('initializes with a default score', () => {
    const { result } = renderHook(() => useScore())
    expect(result.current.score.lanes).toHaveLength(1)
    expect(result.current.score.measures).toHaveLength(1)
  })

  it('adds a lane', () => {
    const { result } = renderHook(() => useScore())
    act(() => result.current.addLane('Surdo'))
    expect(result.current.score.lanes).toHaveLength(2)
    expect(result.current.score.lanes[1].name).toBe('Surdo')
    // New lane should have cells in existing measure
    const newLaneId = result.current.score.lanes[1].id
    expect(result.current.score.measures[0].cells[newLaneId]).toHaveLength(16)
  })

  it('removes a lane', () => {
    const { result } = renderHook(() => useScore())
    act(() => result.current.addLane('Surdo'))
    const laneId = result.current.score.lanes[1].id
    act(() => result.current.removeLane(laneId))
    expect(result.current.score.lanes).toHaveLength(1)
  })

  it('does not remove the last lane', () => {
    const { result } = renderHook(() => useScore())
    const laneId = result.current.score.lanes[0].id
    act(() => result.current.removeLane(laneId))
    expect(result.current.score.lanes).toHaveLength(1)
  })

  it('adds a measure at the end', () => {
    const { result } = renderHook(() => useScore())
    act(() => result.current.addMeasure())
    expect(result.current.score.measures).toHaveLength(2)
  })

  it('inserts a measure at a specific index', () => {
    const { result } = renderHook(() => useScore())
    act(() => result.current.addMeasure())
    const firstId = result.current.score.measures[0].id
    act(() => result.current.insertMeasure(1))
    expect(result.current.score.measures).toHaveLength(3)
    expect(result.current.score.measures[0].id).toBe(firstId)
  })

  it('removes a measure', () => {
    const { result } = renderHook(() => useScore())
    act(() => result.current.addMeasure())
    const measureId = result.current.score.measures[0].id
    act(() => result.current.removeMeasure(measureId))
    expect(result.current.score.measures).toHaveLength(1)
  })

  it('does not remove the last measure', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.measures[0].id
    act(() => result.current.removeMeasure(measureId))
    expect(result.current.score.measures).toHaveLength(1)
  })

  it('cycles cell symbol', () => {
    const { result } = renderHook(() => useScore())
    const laneId = result.current.score.lanes[0].id
    const measureId = result.current.score.measures[0].id
    act(() => result.current.cycleCell(measureId, laneId, 0))
    expect(result.current.score.measures[0].cells[laneId][0].symbol).toBe('cross')
    act(() => result.current.cycleCell(measureId, laneId, 0))
    expect(result.current.score.measures[0].cells[laneId][0].symbol).toBe('empty-round')
  })

  it('sets cell symbol directly', () => {
    const { result } = renderHook(() => useScore())
    const laneId = result.current.score.lanes[0].id
    const measureId = result.current.score.measures[0].id
    act(() => result.current.setCellSymbol(measureId, laneId, 0, 'diamond'))
    expect(result.current.score.measures[0].cells[laneId][0].symbol).toBe('diamond')
  })

  it('sets cell label', () => {
    const { result } = renderHook(() => useScore())
    const laneId = result.current.score.lanes[0].id
    const measureId = result.current.score.measures[0].id
    act(() => result.current.setCellLabel(measureId, laneId, 0, 'DOWN'))
    expect(result.current.score.measures[0].cells[laneId][0].label).toBe('DOWN')
  })

  it('sets section label on measure', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.measures[0].id
    act(() => result.current.setSectionLabel(measureId, 'INTRO'))
    expect(result.current.score.measures[0].sectionLabel).toBe('INTRO')
  })

  it('sets repeat on measure', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.measures[0].id
    act(() => result.current.setRepeat(measureId, 3))
    expect(result.current.score.measures[0].repeat).toEqual({ times: 3 })
  })

  it('updates time signature and resizes cells', () => {
    const { result } = renderHook(() => useScore())
    const measureId = result.current.score.measures[0].id
    const laneId = result.current.score.lanes[0].id
    act(() => result.current.setTimeSignature(measureId, { beats: 3, subdivision: 3 }))
    expect(result.current.score.measures[0].timeSignature).toEqual({ beats: 3, subdivision: 3 })
    expect(result.current.score.measures[0].cells[laneId]).toHaveLength(9)
  })

  it('updates lane name', () => {
    const { result } = renderHook(() => useScore())
    const laneId = result.current.score.lanes[0].id
    act(() => result.current.updateLane(laneId, { name: 'Surdo' }))
    expect(result.current.score.lanes[0].name).toBe('Surdo')
  })

  it('updates lane color', () => {
    const { result } = renderHook(() => useScore())
    const laneId = result.current.score.lanes[0].id
    act(() => result.current.updateLane(laneId, { color: '#FF0000' }))
    expect(result.current.score.lanes[0].color).toBe('#FF0000')
  })

  it('updates score title', () => {
    const { result } = renderHook(() => useScore())
    act(() => result.current.updateTitle('My Samba'))
    expect(result.current.score.title).toBe('My Samba')
  })

  it('loads a score', () => {
    const { result } = renderHook(() => useScore())
    const newScore = { ...result.current.score, title: 'Loaded Score' }
    act(() => result.current.loadScore(newScore))
    expect(result.current.score.title).toBe('Loaded Score')
  })

  it('tracks dirty state', () => {
    const { result } = renderHook(() => useScore())
    expect(result.current.isDirty).toBe(false)
    act(() => result.current.updateTitle('Changed'))
    expect(result.current.isDirty).toBe(true)
  })

  it('resets dirty state after markClean', () => {
    const { result } = renderHook(() => useScore())
    act(() => result.current.updateTitle('Changed'))
    act(() => result.current.markClean())
    expect(result.current.isDirty).toBe(false)
  })

  it('sets triplet on a beat', () => {
    const { result } = renderHook(() => useScore())
    const laneId = result.current.score.lanes[0].id
    const measureId = result.current.score.measures[0].id
    act(() => result.current.setTriplet(measureId, laneId, 0)) // beat index 0
    // Beat 0 with subdivision 4 starts at cell index 0
    expect(result.current.score.measures[0].cells[laneId][0].triplet).toBe(true)
  })

  it('sets roll on cells', () => {
    const { result } = renderHook(() => useScore())
    const laneId = result.current.score.lanes[0].id
    const measureId = result.current.score.measures[0].id
    act(() => result.current.setRoll(measureId, laneId, 2, 4))
    expect(result.current.score.measures[0].cells[laneId][2].roll).toEqual({ length: 4 })
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/state/useScore.test.ts`

Expected: FAIL — module not found.

**Step 3: Implement the useScore hook**

Create `src/state/useScore.ts`:
```ts
import { useState, useCallback } from 'react'
import type { Score, CellSymbol, TimeSignature } from '../model/types'
import { SYMBOL_CYCLE } from '../model/types'
import { createScore, createLane, createMeasure, createCell } from '../model/factory'

const PASTEL_COLORS = [
  '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA',
  '#E8BAFF', '#FFD9BA', '#BAFFF5', '#FFC9DE',
]

export function useScore() {
  const [score, setScore] = useState<Score>(createScore)
  const [isDirty, setIsDirty] = useState(false)

  const modify = useCallback((updater: (s: Score) => Score) => {
    setScore(prev => updater(prev))
    setIsDirty(true)
  }, [])

  const addLane = useCallback((name: string) => {
    modify(s => {
      const color = PASTEL_COLORS[s.lanes.length % PASTEL_COLORS.length]
      const lane = createLane(name, color)
      const measures = s.measures.map(m => ({
        ...m,
        cells: {
          ...m.cells,
          [lane.id]: Array.from(
            { length: m.timeSignature.beats * m.timeSignature.subdivision },
            () => createCell()
          ),
        },
      }))
      return { ...s, lanes: [...s.lanes, lane], measures }
    })
  }, [modify])

  const removeLane = useCallback((laneId: string) => {
    modify(s => {
      if (s.lanes.length <= 1) return s
      const lanes = s.lanes.filter(l => l.id !== laneId)
      const measures = s.measures.map(m => {
        const { [laneId]: _, ...rest } = m.cells
        return { ...m, cells: rest }
      })
      return { ...s, lanes, measures }
    })
  }, [modify])

  const addMeasure = useCallback(() => {
    modify(s => {
      const lastMeasure = s.measures[s.measures.length - 1]
      const ts = lastMeasure?.timeSignature ?? { beats: 4, subdivision: 4 }
      const measure = createMeasure(s.lanes.map(l => l.id), ts)
      return { ...s, measures: [...s.measures, measure] }
    })
  }, [modify])

  const insertMeasure = useCallback((index: number) => {
    modify(s => {
      const refMeasure = s.measures[index] ?? s.measures[s.measures.length - 1]
      const ts = refMeasure?.timeSignature ?? { beats: 4, subdivision: 4 }
      const measure = createMeasure(s.lanes.map(l => l.id), ts)
      const measures = [...s.measures]
      measures.splice(index, 0, measure)
      return { ...s, measures }
    })
  }, [modify])

  const removeMeasure = useCallback((measureId: string) => {
    modify(s => {
      if (s.measures.length <= 1) return s
      return { ...s, measures: s.measures.filter(m => m.id !== measureId) }
    })
  }, [modify])

  const updateMeasureCells = useCallback(
    (measureId: string, laneId: string, updater: (cells: typeof score.measures[0]['cells'][string]) => typeof score.measures[0]['cells'][string]) => {
      modify(s => ({
        ...s,
        measures: s.measures.map(m =>
          m.id !== measureId ? m : {
            ...m,
            cells: { ...m.cells, [laneId]: updater(m.cells[laneId]) },
          }
        ),
      }))
    },
    [modify]
  )

  const cycleCell = useCallback((measureId: string, laneId: string, cellIndex: number) => {
    updateMeasureCells(measureId, laneId, cells =>
      cells.map((c, i) => {
        if (i !== cellIndex) return c
        const currentIdx = SYMBOL_CYCLE.indexOf(c.symbol)
        const nextSymbol = SYMBOL_CYCLE[(currentIdx + 1) % SYMBOL_CYCLE.length]
        return { ...c, symbol: nextSymbol }
      })
    )
  }, [updateMeasureCells])

  const setCellSymbol = useCallback((measureId: string, laneId: string, cellIndex: number, symbol: CellSymbol) => {
    updateMeasureCells(measureId, laneId, cells =>
      cells.map((c, i) => i === cellIndex ? { ...c, symbol } : c)
    )
  }, [updateMeasureCells])

  const setCellLabel = useCallback((measureId: string, laneId: string, cellIndex: number, label: string) => {
    updateMeasureCells(measureId, laneId, cells =>
      cells.map((c, i) => i === cellIndex ? { ...c, label } : c)
    )
  }, [updateMeasureCells])

  const setTriplet = useCallback((measureId: string, laneId: string, beatIndex: number) => {
    modify(s => ({
      ...s,
      measures: s.measures.map(m => {
        if (m.id !== measureId) return m
        const cellIndex = beatIndex * m.timeSignature.subdivision
        const cells = {
          ...m.cells,
          [laneId]: m.cells[laneId].map((c, i) =>
            i === cellIndex ? { ...c, triplet: true } : c
          ),
        }
        return { ...m, cells }
      }),
    }))
  }, [modify])

  const setRoll = useCallback((measureId: string, laneId: string, cellIndex: number, length: number) => {
    updateMeasureCells(measureId, laneId, cells =>
      cells.map((c, i) => i === cellIndex ? { ...c, roll: { length } } : c)
    )
  }, [updateMeasureCells])

  const setSectionLabel = useCallback((measureId: string, label: string) => {
    modify(s => ({
      ...s,
      measures: s.measures.map(m =>
        m.id === measureId ? { ...m, sectionLabel: label } : m
      ),
    }))
  }, [modify])

  const setRepeat = useCallback((measureId: string, times: number) => {
    modify(s => ({
      ...s,
      measures: s.measures.map(m =>
        m.id === measureId ? { ...m, repeat: { times } } : m
      ),
    }))
  }, [modify])

  const setTimeSignature = useCallback((measureId: string, ts: TimeSignature) => {
    modify(s => ({
      ...s,
      measures: s.measures.map(m => {
        if (m.id !== measureId) return m
        const totalCells = ts.beats * ts.subdivision
        const cells: Record<string, typeof m.cells[string]> = {}
        for (const laneId of s.lanes.map(l => l.id)) {
          cells[laneId] = Array.from({ length: totalCells }, () => createCell())
        }
        return { ...m, timeSignature: ts, cells }
      }),
    }))
  }, [modify])

  const updateLane = useCallback((laneId: string, updates: Partial<Pick<typeof score.lanes[0], 'name' | 'color'>>) => {
    modify(s => ({
      ...s,
      lanes: s.lanes.map(l => l.id === laneId ? { ...l, ...updates } : l),
    }))
  }, [modify])

  const updateTitle = useCallback((title: string) => {
    modify(s => ({ ...s, title }))
  }, [modify])

  const loadScore = useCallback((newScore: Score) => {
    setScore(newScore)
    setIsDirty(false)
  }, [])

  const markClean = useCallback(() => {
    setIsDirty(false)
  }, [])

  return {
    score,
    isDirty,
    addLane,
    removeLane,
    addMeasure,
    insertMeasure,
    removeMeasure,
    cycleCell,
    setCellSymbol,
    setCellLabel,
    setTriplet,
    setRoll,
    setSectionLabel,
    setRepeat,
    setTimeSignature,
    updateLane,
    updateTitle,
    loadScore,
    markClean,
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/state/useScore.test.ts`

Expected: All PASS.

**Step 5: Commit**

```bash
git add src/state/
git commit -m "Add useScore hook with full state management and tests"
```

---

### Task 4: File I/O Utilities

**Files:**
- Create: `src/utils/fileIO.ts`
- Create: `src/utils/fileIO.test.ts`

**Step 1: Write failing tests**

Create `src/utils/fileIO.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { serializeScore, deserializeScore } from './fileIO'
import { createScore } from '../model/factory'

describe('serializeScore', () => {
  it('serializes a score to JSON string', () => {
    const score = createScore()
    const json = serializeScore(score)
    expect(typeof json).toBe('string')
    const parsed = JSON.parse(json)
    expect(parsed.title).toBe('Untitled Score')
  })
})

describe('deserializeScore', () => {
  it('round-trips a score through serialize/deserialize', () => {
    const score = createScore()
    const json = serializeScore(score)
    const restored = deserializeScore(json)
    expect(restored.title).toBe(score.title)
    expect(restored.lanes).toHaveLength(score.lanes.length)
    expect(restored.measures).toHaveLength(score.measures.length)
    expect(restored.measures[0].cells[restored.lanes[0].id]).toHaveLength(16)
  })

  it('throws on invalid JSON', () => {
    expect(() => deserializeScore('not json')).toThrow()
  })

  it('throws on missing required fields', () => {
    expect(() => deserializeScore('{"foo": "bar"}')).toThrow()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/utils/fileIO.test.ts`

Expected: FAIL.

**Step 3: Implement file I/O**

Create `src/utils/fileIO.ts`:
```ts
import type { Score } from '../model/types'

export function serializeScore(score: Score): string {
  return JSON.stringify(score, null, 2)
}

export function deserializeScore(json: string): Score {
  const parsed = JSON.parse(json)
  if (!parsed.title || !parsed.lanes || !parsed.measures) {
    throw new Error('Invalid score file: missing required fields')
  }
  return parsed as Score
}

export function downloadScore(score: Score): void {
  const json = serializeScore(score)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${score.title || 'untitled'}.boombox.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function openScoreFile(): Promise<Score> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.boombox.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        reject(new Error('No file selected'))
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const score = deserializeScore(reader.result as string)
          resolve(score)
        } catch (e) {
          reject(e)
        }
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    }
    input.click()
  })
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/utils/fileIO.test.ts`

Expected: All PASS.

**Step 5: Commit**

```bash
git add src/utils/fileIO.ts src/utils/fileIO.test.ts
git commit -m "Add file I/O utilities for score save/load with tests"
```

---

### Task 5: Cell Component

**Files:**
- Create: `src/components/Cell/Cell.tsx`
- Create: `src/components/Cell/Cell.module.css`
- Create: `src/components/Cell/Cell.test.tsx`

**Step 1: Write failing tests**

Create `src/components/Cell/Cell.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Cell } from './Cell'

describe('Cell', () => {
  it('renders empty cell as dot', () => {
    render(<Cell symbol={null} onClick={vi.fn()} onContextMenu={vi.fn()} />)
    expect(screen.getByText('·')).toBeInTheDocument()
  })

  it('renders cross symbol', () => {
    render(<Cell symbol="cross" onClick={vi.fn()} onContextMenu={vi.fn()} />)
    expect(screen.getByText('✕')).toBeInTheDocument()
  })

  it('renders empty-round symbol', () => {
    render(<Cell symbol="empty-round" onClick={vi.fn()} onContextMenu={vi.fn()} />)
    expect(screen.getByText('○')).toBeInTheDocument()
  })

  it('renders full-round symbol', () => {
    render(<Cell symbol="full-round" onClick={vi.fn()} onContextMenu={vi.fn()} />)
    expect(screen.getByText('●')).toBeInTheDocument()
  })

  it('renders square symbol', () => {
    render(<Cell symbol="square" onClick={vi.fn()} onContextMenu={vi.fn()} />)
    expect(screen.getByText('■')).toBeInTheDocument()
  })

  it('renders diamond symbol', () => {
    render(<Cell symbol="diamond" onClick={vi.fn()} onContextMenu={vi.fn()} />)
    expect(screen.getByText('◆')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Cell symbol={null} onClick={onClick} onContextMenu={vi.fn()} />)
    fireEvent.click(screen.getByText('·'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders label when provided', () => {
    render(<Cell symbol="cross" label="DOWN" onClick={vi.fn()} onContextMenu={vi.fn()} />)
    expect(screen.getByText('DOWN')).toBeInTheDocument()
  })

  it('highlights beat boundaries', () => {
    const { container } = render(
      <Cell symbol={null} onClick={vi.fn()} onContextMenu={vi.fn()} isBeatStart={true} />
    )
    expect(container.firstChild).toHaveClass(/beatStart/)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/components/Cell/Cell.test.tsx`

Expected: FAIL.

**Step 3: Implement Cell component**

Create `src/components/Cell/Cell.module.css`:
```css
.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 36px;
  cursor: pointer;
  user-select: none;
  font-size: 16px;
  border-right: 1px solid #e0e0e0;
  position: relative;
}

.cell:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.beatStart {
  border-left: 2px solid #999;
}

.empty {
  color: #ccc;
  font-size: 12px;
}

.symbol {
  color: #333;
}

.label {
  position: absolute;
  top: -14px;
  font-size: 8px;
  color: #666;
  white-space: nowrap;
}

.roll {
  font-size: 10px;
  color: #333;
  letter-spacing: -2px;
}
```

Create `src/components/Cell/Cell.tsx`:
```tsx
import type { CellSymbol } from '../../model/types'
import styles from './Cell.module.css'

const SYMBOL_DISPLAY: Record<string, string> = {
  cross: '✕',
  'empty-round': '○',
  'full-round': '●',
  square: '■',
  diamond: '◆',
}

interface CellProps {
  symbol: CellSymbol
  label?: string
  isBeatStart?: boolean
  isRoll?: boolean
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

export function Cell({ symbol, label, isBeatStart, isRoll, onClick, onContextMenu }: CellProps) {
  const classNames = [
    styles.cell,
    isBeatStart ? styles.beatStart : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={classNames} onClick={onClick} onContextMenu={onContextMenu}>
      {label && <span className={styles.label}>{label}</span>}
      {isRoll ? (
        <span className={styles.roll}>〰</span>
      ) : symbol ? (
        <span className={styles.symbol}>{SYMBOL_DISPLAY[symbol]}</span>
      ) : (
        <span className={styles.empty}>·</span>
      )}
    </div>
  )
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/components/Cell/Cell.test.tsx`

Expected: All PASS.

**Step 5: Commit**

```bash
git add src/components/Cell/
git commit -m "Add Cell component with symbol rendering, labels, and tests"
```

---

### Task 6: Context Menu Component

**Files:**
- Create: `src/components/ContextMenu/ContextMenu.tsx`
- Create: `src/components/ContextMenu/ContextMenu.module.css`
- Create: `src/components/ContextMenu/ContextMenu.test.tsx`

**Step 1: Write failing tests**

Create `src/components/ContextMenu/ContextMenu.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContextMenu } from './ContextMenu'

describe('ContextMenu', () => {
  const defaultProps = {
    x: 100,
    y: 200,
    onSetSymbol: vi.fn(),
    onSetLabel: vi.fn(),
    onSetTriplet: vi.fn(),
    onSetRoll: vi.fn(),
    onClose: vi.fn(),
  }

  it('renders symbol options', () => {
    render(<ContextMenu {...defaultProps} />)
    expect(screen.getByText('✕ Cross')).toBeInTheDocument()
    expect(screen.getByText('○ Empty round')).toBeInTheDocument()
    expect(screen.getByText('● Full round')).toBeInTheDocument()
    expect(screen.getByText('■ Square')).toBeInTheDocument()
    expect(screen.getByText('◆ Diamond')).toBeInTheDocument()
    expect(screen.getByText('Clear')).toBeInTheDocument()
  })

  it('calls onSetSymbol when symbol clicked', () => {
    render(<ContextMenu {...defaultProps} />)
    fireEvent.click(screen.getByText('✕ Cross'))
    expect(defaultProps.onSetSymbol).toHaveBeenCalledWith('cross')
  })

  it('renders triplet and roll options', () => {
    render(<ContextMenu {...defaultProps} />)
    expect(screen.getByText('Triplet')).toBeInTheDocument()
    expect(screen.getByText('Roll')).toBeInTheDocument()
  })

  it('renders label option', () => {
    render(<ContextMenu {...defaultProps} />)
    expect(screen.getByText('Add label')).toBeInTheDocument()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/components/ContextMenu/ContextMenu.test.tsx`

Expected: FAIL.

**Step 3: Implement ContextMenu component**

Create `src/components/ContextMenu/ContextMenu.module.css`:
```css
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999;
}

.menu {
  position: fixed;
  z-index: 1000;
  background: white;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 160px;
}

.item {
  display: block;
  width: 100%;
  padding: 6px 12px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
}

.item:hover {
  background-color: #f0f0f0;
}

.separator {
  height: 1px;
  background: #e0e0e0;
  margin: 4px 0;
}
```

Create `src/components/ContextMenu/ContextMenu.tsx`:
```tsx
import type { CellSymbol } from '../../model/types'
import styles from './ContextMenu.module.css'

interface ContextMenuProps {
  x: number
  y: number
  onSetSymbol: (symbol: CellSymbol) => void
  onSetLabel: () => void
  onSetTriplet: () => void
  onSetRoll: () => void
  onClose: () => void
}

export function ContextMenu({ x, y, onSetSymbol, onSetLabel, onSetTriplet, onSetRoll, onClose }: ContextMenuProps) {
  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.menu} style={{ left: x, top: y }}>
        <button className={styles.item} onClick={() => onSetSymbol('cross')}>✕ Cross</button>
        <button className={styles.item} onClick={() => onSetSymbol('empty-round')}>○ Empty round</button>
        <button className={styles.item} onClick={() => onSetSymbol('full-round')}>● Full round</button>
        <button className={styles.item} onClick={() => onSetSymbol('square')}>■ Square</button>
        <button className={styles.item} onClick={() => onSetSymbol('diamond')}>◆ Diamond</button>
        <button className={styles.item} onClick={() => onSetSymbol(null)}>Clear</button>
        <div className={styles.separator} />
        <button className={styles.item} onClick={onSetLabel}>Add label</button>
        <div className={styles.separator} />
        <button className={styles.item} onClick={onSetTriplet}>Triplet</button>
        <button className={styles.item} onClick={onSetRoll}>Roll</button>
      </div>
    </>
  )
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/components/ContextMenu/ContextMenu.test.tsx`

Expected: All PASS.

**Step 5: Commit**

```bash
git add src/components/ContextMenu/
git commit -m "Add ContextMenu component for cell actions with tests"
```

---

### Task 7: Lane Header Component

**Files:**
- Create: `src/components/LaneHeader/LaneHeader.tsx`
- Create: `src/components/LaneHeader/LaneHeader.module.css`
- Create: `src/components/LaneHeader/LaneHeader.test.tsx`

**Step 1: Write failing tests**

Create `src/components/LaneHeader/LaneHeader.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LaneHeader } from './LaneHeader'

describe('LaneHeader', () => {
  it('displays lane name', () => {
    render(
      <LaneHeader
        name="Surdo"
        color="#FFB3BA"
        onNameChange={vi.fn()}
        onColorChange={vi.fn()}
        onRemove={vi.fn()}
        canRemove={true}
      />
    )
    expect(screen.getByDisplayValue('Surdo')).toBeInTheDocument()
  })

  it('calls onNameChange when name is edited', () => {
    const onNameChange = vi.fn()
    render(
      <LaneHeader
        name="Surdo"
        color="#FFB3BA"
        onNameChange={onNameChange}
        onColorChange={vi.fn()}
        onRemove={vi.fn()}
        canRemove={true}
      />
    )
    fireEvent.change(screen.getByDisplayValue('Surdo'), { target: { value: 'Caixa' } })
    expect(onNameChange).toHaveBeenCalledWith('Caixa')
  })

  it('disables remove button when canRemove is false', () => {
    render(
      <LaneHeader
        name="Surdo"
        color="#FFB3BA"
        onNameChange={vi.fn()}
        onColorChange={vi.fn()}
        onRemove={vi.fn()}
        canRemove={false}
      />
    )
    expect(screen.getByTitle('Remove lane')).toBeDisabled()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/components/LaneHeader/LaneHeader.test.tsx`

**Step 3: Implement LaneHeader**

Create `src/components/LaneHeader/LaneHeader.module.css`:
```css
.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  min-width: 100px;
  gap: 4px;
  position: sticky;
  left: 0;
  z-index: 10;
}

.nameInput {
  width: 80px;
  border: 1px solid transparent;
  background: transparent;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 4px;
  border-radius: 3px;
}

.nameInput:hover,
.nameInput:focus {
  border-color: #ccc;
  background: white;
  outline: none;
}

.controls {
  display: flex;
  gap: 4px;
  align-items: center;
}

.colorInput {
  width: 20px;
  height: 20px;
  border: none;
  padding: 0;
  cursor: pointer;
  border-radius: 3px;
}

.removeBtn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #999;
  padding: 0 4px;
}

.removeBtn:hover:not(:disabled) {
  color: #e00;
}

.removeBtn:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}
```

Create `src/components/LaneHeader/LaneHeader.tsx`:
```tsx
import styles from './LaneHeader.module.css'

interface LaneHeaderProps {
  name: string
  color: string
  onNameChange: (name: string) => void
  onColorChange: (color: string) => void
  onRemove: () => void
  canRemove: boolean
}

export function LaneHeader({ name, color, onNameChange, onColorChange, onRemove, canRemove }: LaneHeaderProps) {
  return (
    <div className={styles.header} style={{ backgroundColor: color }}>
      <input
        className={styles.nameInput}
        value={name}
        onChange={e => onNameChange(e.target.value)}
      />
      <div className={styles.controls}>
        <input
          className={styles.colorInput}
          type="color"
          value={color}
          onChange={e => onColorChange(e.target.value)}
          title="Lane color"
        />
        <button
          className={styles.removeBtn}
          onClick={onRemove}
          disabled={!canRemove}
          title="Remove lane"
        >
          ×
        </button>
      </div>
    </div>
  )
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/components/LaneHeader/LaneHeader.test.tsx`

Expected: All PASS.

**Step 5: Commit**

```bash
git add src/components/LaneHeader/
git commit -m "Add LaneHeader component with editable name and color picker"
```

---

### Task 8: Measure Header Component

**Files:**
- Create: `src/components/MeasureHeader/MeasureHeader.tsx`
- Create: `src/components/MeasureHeader/MeasureHeader.module.css`
- Create: `src/components/MeasureHeader/MeasureHeader.test.tsx`

**Step 1: Write failing tests**

Create `src/components/MeasureHeader/MeasureHeader.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MeasureHeader } from './MeasureHeader'

describe('MeasureHeader', () => {
  const defaultProps = {
    beats: 4,
    subdivision: 4,
    sectionLabel: '',
    repeat: undefined as { times: number } | undefined,
    onTimeSignatureChange: vi.fn(),
    onSectionLabelChange: vi.fn(),
    onRepeatChange: vi.fn(),
    onRemove: vi.fn(),
    canRemove: true,
  }

  it('displays time signature', () => {
    render(<MeasureHeader {...defaultProps} />)
    expect(screen.getByText('4/4')).toBeInTheDocument()
  })

  it('displays subdivision', () => {
    render(<MeasureHeader {...defaultProps} />)
    expect(screen.getByText('÷4')).toBeInTheDocument()
  })

  it('displays section label when set', () => {
    render(<MeasureHeader {...defaultProps} sectionLabel="INTRO" />)
    expect(screen.getByDisplayValue('INTRO')).toBeInTheDocument()
  })

  it('displays repeat marker when set', () => {
    render(<MeasureHeader {...defaultProps} repeat={{ times: 3 }} />)
    expect(screen.getByText('×3')).toBeInTheDocument()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/components/MeasureHeader/MeasureHeader.test.tsx`

**Step 3: Implement MeasureHeader**

Create `src/components/MeasureHeader/MeasureHeader.module.css`:
```css
.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px;
  border-right: 1px solid #ccc;
  min-height: 50px;
  gap: 2px;
}

.row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.timeSig {
  font-weight: 700;
  font-size: 13px;
}

.subdivision {
  color: #666;
  font-size: 11px;
}

.sectionInput {
  width: 60px;
  border: 1px solid transparent;
  background: transparent;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 1px 3px;
  border-radius: 3px;
}

.sectionInput:hover,
.sectionInput:focus {
  border-color: #ccc;
  background: white;
  outline: none;
}

.repeat {
  font-size: 11px;
  color: #666;
  cursor: pointer;
}

.removeBtn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  color: #999;
  padding: 0;
}

.removeBtn:hover:not(:disabled) {
  color: #e00;
}

.removeBtn:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.select {
  font-size: 11px;
  border: 1px solid #ddd;
  border-radius: 3px;
  padding: 1px 2px;
  background: white;
}
```

Create `src/components/MeasureHeader/MeasureHeader.tsx`:
```tsx
import type { TimeSignature } from '../../model/types'
import styles from './MeasureHeader.module.css'

interface MeasureHeaderProps {
  beats: number
  subdivision: number
  sectionLabel: string
  repeat?: { times: number }
  onTimeSignatureChange: (ts: TimeSignature) => void
  onSectionLabelChange: (label: string) => void
  onRepeatChange: (times: number | null) => void
  onRemove: () => void
  canRemove: boolean
}

export function MeasureHeader({
  beats,
  subdivision,
  sectionLabel,
  repeat,
  onTimeSignatureChange,
  onSectionLabelChange,
  onRepeatChange,
  onRemove,
  canRemove,
}: MeasureHeaderProps) {
  return (
    <div className={styles.header}>
      <input
        className={styles.sectionInput}
        value={sectionLabel}
        onChange={e => onSectionLabelChange(e.target.value)}
        placeholder="section"
      />
      <div className={styles.row}>
        <select
          className={styles.select}
          value={`${beats}/4`}
          onChange={e => {
            const newBeats = parseInt(e.target.value)
            onTimeSignatureChange({ beats: newBeats, subdivision })
          }}
        >
          <option value="2">2/4</option>
          <option value="3">3/4</option>
          <option value="4">4/4</option>
          <option value="5">5/4</option>
          <option value="6">6/4</option>
        </select>
        <span className={styles.timeSig}>{beats}/4</span>
        <select
          className={styles.select}
          value={subdivision}
          onChange={e => {
            const newSub = parseInt(e.target.value)
            onTimeSignatureChange({ beats, subdivision: newSub })
          }}
        >
          <option value="2">÷2</option>
          <option value="3">÷3</option>
          <option value="4">÷4</option>
          <option value="6">÷6</option>
        </select>
        <span className={styles.subdivision}>÷{subdivision}</span>
      </div>
      <div className={styles.row}>
        {repeat && <span className={styles.repeat}>×{repeat.times}</span>}
        <button
          className={styles.removeBtn}
          onClick={onRemove}
          disabled={!canRemove}
          title="Remove measure"
        >
          ×
        </button>
      </div>
    </div>
  )
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/components/MeasureHeader/MeasureHeader.test.tsx`

Expected: All PASS.

**Step 5: Commit**

```bash
git add src/components/MeasureHeader/
git commit -m "Add MeasureHeader component with time signature and section labels"
```

---

### Task 9: Grid Component (Measure Grid)

**Files:**
- Create: `src/components/Grid/Grid.tsx`
- Create: `src/components/Grid/Grid.module.css`
- Create: `src/components/Grid/Grid.test.tsx`

**Step 1: Write failing tests**

Create `src/components/Grid/Grid.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Grid } from './Grid'
import { createMeasure } from '../../model/factory'
import type { Lane } from '../../model/types'

describe('Grid', () => {
  const lanes: Lane[] = [
    { id: 'lane-1', name: 'Surdo', color: '#FFB3BA' },
  ]

  it('renders correct number of cells', () => {
    const measure = createMeasure(['lane-1'], { beats: 4, subdivision: 4 })
    render(
      <Grid
        measure={measure}
        lanes={lanes}
        onCycleCell={vi.fn()}
        onCellContextMenu={vi.fn()}
      />
    )
    // 16 cells, all empty dots
    const dots = screen.getAllByText('·')
    expect(dots).toHaveLength(16)
  })

  it('renders cells for multiple lanes', () => {
    const twoLanes: Lane[] = [
      { id: 'lane-1', name: 'Surdo', color: '#FFB3BA' },
      { id: 'lane-2', name: 'Caixa', color: '#BAFFC9' },
    ]
    const measure = createMeasure(['lane-1', 'lane-2'], { beats: 4, subdivision: 4 })
    render(
      <Grid
        measure={measure}
        lanes={twoLanes}
        onCycleCell={vi.fn()}
        onCellContextMenu={vi.fn()}
      />
    )
    const dots = screen.getAllByText('·')
    expect(dots).toHaveLength(32)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/components/Grid/Grid.test.tsx`

**Step 3: Implement Grid component**

Create `src/components/Grid/Grid.module.css`:
```css
.grid {
  display: flex;
  flex-direction: column;
}

.laneRow {
  display: flex;
  flex-direction: row;
}

.tripletMarker {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  color: #666;
  position: absolute;
  top: -16px;
}

.rollCell {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

Create `src/components/Grid/Grid.tsx`:
```tsx
import type { Measure, Lane } from '../../model/types'
import { Cell } from '../Cell/Cell'
import styles from './Grid.module.css'

interface GridProps {
  measure: Measure
  lanes: Lane[]
  onCycleCell: (laneId: string, cellIndex: number) => void
  onCellContextMenu: (laneId: string, cellIndex: number, e: React.MouseEvent) => void
}

export function Grid({ measure, lanes, onCycleCell, onCellContextMenu }: GridProps) {
  const { subdivision } = measure.timeSignature

  return (
    <div className={styles.grid}>
      {lanes.map(lane => (
        <div
          key={lane.id}
          className={styles.laneRow}
          style={{ backgroundColor: lane.color }}
        >
          {measure.cells[lane.id]?.map((cell, i) => {
            const isBeatStart = i % subdivision === 0
            const isInRoll = measure.cells[lane.id].some(
              (c, ci) => c.roll && ci <= i && ci + c.roll.length > i && ci !== i
            )

            return (
              <Cell
                key={i}
                symbol={isInRoll ? null : cell.symbol}
                label={cell.label}
                isBeatStart={isBeatStart}
                isRoll={isInRoll || !!cell.roll}
                onClick={() => onCycleCell(lane.id, i)}
                onContextMenu={e => onCellContextMenu(lane.id, i, e)}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/components/Grid/Grid.test.tsx`

Expected: All PASS.

**Step 5: Commit**

```bash
git add src/components/Grid/
git commit -m "Add Grid component for rendering measure cells per lane"
```

---

### Task 10: Toolbar Component

**Files:**
- Create: `src/components/Toolbar/Toolbar.tsx`
- Create: `src/components/Toolbar/Toolbar.module.css`
- Create: `src/components/Toolbar/Toolbar.test.tsx`

**Step 1: Write failing tests**

Create `src/components/Toolbar/Toolbar.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toolbar } from './Toolbar'

describe('Toolbar', () => {
  const defaultProps = {
    title: 'My Score',
    isDirty: false,
    onTitleChange: vi.fn(),
    onSave: vi.fn(),
    onLoad: vi.fn(),
    onExportPdf: vi.fn(),
    onExportPng: vi.fn(),
    onAddLane: vi.fn(),
    onNewScore: vi.fn(),
  }

  it('displays score title', () => {
    render(<Toolbar {...defaultProps} />)
    expect(screen.getByDisplayValue('My Score')).toBeInTheDocument()
  })

  it('calls onTitleChange when title edited', () => {
    render(<Toolbar {...defaultProps} />)
    fireEvent.change(screen.getByDisplayValue('My Score'), { target: { value: 'New Title' } })
    expect(defaultProps.onTitleChange).toHaveBeenCalledWith('New Title')
  })

  it('renders save button', () => {
    render(<Toolbar {...defaultProps} />)
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('renders load button', () => {
    render(<Toolbar {...defaultProps} />)
    expect(screen.getByText('Load')).toBeInTheDocument()
  })

  it('renders add lane button', () => {
    render(<Toolbar {...defaultProps} />)
    expect(screen.getByText('+ Lane')).toBeInTheDocument()
  })

  it('shows unsaved indicator when dirty', () => {
    render(<Toolbar {...defaultProps} isDirty={true} />)
    expect(screen.getByText('(unsaved)')).toBeInTheDocument()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/components/Toolbar/Toolbar.test.tsx`

**Step 3: Implement Toolbar**

Create `src/components/Toolbar/Toolbar.module.css`:
```css
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f8f8;
  border-bottom: 1px solid #ddd;
  flex-wrap: wrap;
}

.titleInput {
  font-size: 18px;
  font-weight: 700;
  border: 1px solid transparent;
  background: transparent;
  padding: 4px 8px;
  border-radius: 4px;
  min-width: 200px;
}

.titleInput:hover,
.titleInput:focus {
  border-color: #ccc;
  background: white;
  outline: none;
}

.dirty {
  color: #e60;
  font-size: 12px;
}

.spacer {
  flex: 1;
}

.btn {
  padding: 6px 12px;
  border: 1px solid #ccc;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn:hover {
  background: #f0f0f0;
}

.btnPrimary {
  background: #4a9eff;
  color: white;
  border-color: #3a8eef;
}

.btnPrimary:hover {
  background: #3a8eef;
}
```

Create `src/components/Toolbar/Toolbar.tsx`:
```tsx
import styles from './Toolbar.module.css'

interface ToolbarProps {
  title: string
  isDirty: boolean
  onTitleChange: (title: string) => void
  onSave: () => void
  onLoad: () => void
  onExportPdf: () => void
  onExportPng: () => void
  onAddLane: () => void
  onNewScore: () => void
}

export function Toolbar({
  title,
  isDirty,
  onTitleChange,
  onSave,
  onLoad,
  onExportPdf,
  onExportPng,
  onAddLane,
  onNewScore,
}: ToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <input
        className={styles.titleInput}
        value={title}
        onChange={e => onTitleChange(e.target.value)}
        placeholder="Score title"
      />
      {isDirty && <span className={styles.dirty}>(unsaved)</span>}
      <div className={styles.spacer} />
      <button className={styles.btn} onClick={onNewScore}>New</button>
      <button className={styles.btn} onClick={onLoad}>Load</button>
      <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onSave}>Save</button>
      <button className={styles.btn} onClick={onExportPdf}>PDF</button>
      <button className={styles.btn} onClick={onExportPng}>PNG</button>
      <button className={styles.btn} onClick={onAddLane}>+ Lane</button>
    </div>
  )
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/components/Toolbar/Toolbar.test.tsx`

Expected: All PASS.

**Step 5: Commit**

```bash
git add src/components/Toolbar/
git commit -m "Add Toolbar component with title, file ops, and lane controls"
```

---

### Task 11: Score Component (Main Assembly)

**Files:**
- Create: `src/components/Score/Score.tsx`
- Create: `src/components/Score/Score.module.css`
- Create: `src/components/Score/Score.test.tsx`

**Step 1: Write failing tests**

Create `src/components/Score/Score.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Score } from './Score'
import { createScore } from '../../model/factory'

describe('Score', () => {
  it('renders lane headers', () => {
    const score = createScore()
    render(
      <Score
        score={score}
        onCycleCell={vi.fn()}
        onCellContextMenu={vi.fn()}
        onLaneNameChange={vi.fn()}
        onLaneColorChange={vi.fn()}
        onRemoveLane={vi.fn()}
        onTimeSignatureChange={vi.fn()}
        onSectionLabelChange={vi.fn()}
        onRepeatChange={vi.fn()}
        onRemoveMeasure={vi.fn()}
        onInsertMeasure={vi.fn()}
        onAddMeasure={vi.fn()}
      />
    )
    expect(screen.getByDisplayValue('Instrument 1')).toBeInTheDocument()
  })

  it('renders measure headers', () => {
    const score = createScore()
    render(
      <Score
        score={score}
        onCycleCell={vi.fn()}
        onCellContextMenu={vi.fn()}
        onLaneNameChange={vi.fn()}
        onLaneColorChange={vi.fn()}
        onRemoveLane={vi.fn()}
        onTimeSignatureChange={vi.fn()}
        onSectionLabelChange={vi.fn()}
        onRepeatChange={vi.fn()}
        onRemoveMeasure={vi.fn()}
        onInsertMeasure={vi.fn()}
        onAddMeasure={vi.fn()}
      />
    )
    expect(screen.getByText('4/4')).toBeInTheDocument()
  })

  it('renders grid cells', () => {
    const score = createScore()
    render(
      <Score
        score={score}
        onCycleCell={vi.fn()}
        onCellContextMenu={vi.fn()}
        onLaneNameChange={vi.fn()}
        onLaneColorChange={vi.fn()}
        onRemoveLane={vi.fn()}
        onTimeSignatureChange={vi.fn()}
        onSectionLabelChange={vi.fn()}
        onRepeatChange={vi.fn()}
        onRemoveMeasure={vi.fn()}
        onInsertMeasure={vi.fn()}
        onAddMeasure={vi.fn()}
      />
    )
    const dots = screen.getAllByText('·')
    expect(dots).toHaveLength(16)
  })

  it('renders add measure button', () => {
    const score = createScore()
    render(
      <Score
        score={score}
        onCycleCell={vi.fn()}
        onCellContextMenu={vi.fn()}
        onLaneNameChange={vi.fn()}
        onLaneColorChange={vi.fn()}
        onRemoveLane={vi.fn()}
        onTimeSignatureChange={vi.fn()}
        onSectionLabelChange={vi.fn()}
        onRepeatChange={vi.fn()}
        onRemoveMeasure={vi.fn()}
        onInsertMeasure={vi.fn()}
        onAddMeasure={vi.fn()}
      />
    )
    expect(screen.getByText('+ Measure')).toBeInTheDocument()
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/components/Score/Score.test.tsx`

**Step 3: Implement Score component**

Create `src/components/Score/Score.module.css`:
```css
.scoreWrapper {
  display: flex;
  overflow-x: auto;
  padding: 16px;
}

.laneHeaders {
  display: flex;
  flex-direction: column;
  position: sticky;
  left: 0;
  z-index: 20;
  background: white;
}

.laneHeaderSpacer {
  min-height: 50px;
}

.measuresArea {
  display: flex;
  flex-direction: row;
  gap: 0;
}

.measureColumn {
  display: flex;
  flex-direction: column;
  border-right: 2px solid #aaa;
}

.insertBtn {
  align-self: stretch;
  background: none;
  border: none;
  cursor: pointer;
  color: #ccc;
  font-size: 18px;
  padding: 0 2px;
  display: flex;
  align-items: center;
}

.insertBtn:hover {
  color: #4a9eff;
  background: #f0f8ff;
}

.addMeasureBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border: 2px dashed #ccc;
  background: none;
  cursor: pointer;
  color: #999;
  font-size: 13px;
  border-radius: 4px;
  margin-left: 8px;
  align-self: stretch;
}

.addMeasureBtn:hover {
  border-color: #4a9eff;
  color: #4a9eff;
}

.repeatMarker {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  color: #666;
  padding: 0 2px;
}
```

Create `src/components/Score/Score.tsx`:
```tsx
import type { Score as ScoreType, TimeSignature } from '../../model/types'
import { LaneHeader } from '../LaneHeader/LaneHeader'
import { MeasureHeader } from '../MeasureHeader/MeasureHeader'
import { Grid } from '../Grid/Grid'
import styles from './Score.module.css'

interface ScoreProps {
  score: ScoreType
  onCycleCell: (measureId: string, laneId: string, cellIndex: number) => void
  onCellContextMenu: (measureId: string, laneId: string, cellIndex: number, e: React.MouseEvent) => void
  onLaneNameChange: (laneId: string, name: string) => void
  onLaneColorChange: (laneId: string, color: string) => void
  onRemoveLane: (laneId: string) => void
  onTimeSignatureChange: (measureId: string, ts: TimeSignature) => void
  onSectionLabelChange: (measureId: string, label: string) => void
  onRepeatChange: (measureId: string, times: number | null) => void
  onRemoveMeasure: (measureId: string) => void
  onInsertMeasure: (index: number) => void
  onAddMeasure: () => void
}

export function Score({
  score,
  onCycleCell,
  onCellContextMenu,
  onLaneNameChange,
  onLaneColorChange,
  onRemoveLane,
  onTimeSignatureChange,
  onSectionLabelChange,
  onRepeatChange,
  onRemoveMeasure,
  onInsertMeasure,
  onAddMeasure,
}: ScoreProps) {
  return (
    <div className={styles.scoreWrapper}>
      <div className={styles.laneHeaders}>
        <div className={styles.laneHeaderSpacer} />
        {score.lanes.map(lane => (
          <LaneHeader
            key={lane.id}
            name={lane.name}
            color={lane.color}
            onNameChange={name => onLaneNameChange(lane.id, name)}
            onColorChange={color => onLaneColorChange(lane.id, color)}
            onRemove={() => onRemoveLane(lane.id)}
            canRemove={score.lanes.length > 1}
          />
        ))}
      </div>

      <div className={styles.measuresArea}>
        {score.measures.map((measure, idx) => (
          <div key={measure.id} style={{ display: 'flex' }}>
            {idx > 0 && (
              <button
                className={styles.insertBtn}
                onClick={() => onInsertMeasure(idx)}
                title="Insert measure here"
              >
                +
              </button>
            )}
            {measure.repeat && (
              <div className={styles.repeatMarker}>𝄆</div>
            )}
            <div className={styles.measureColumn}>
              <MeasureHeader
                beats={measure.timeSignature.beats}
                subdivision={measure.timeSignature.subdivision}
                sectionLabel={measure.sectionLabel ?? ''}
                repeat={measure.repeat}
                onTimeSignatureChange={ts => onTimeSignatureChange(measure.id, ts)}
                onSectionLabelChange={label => onSectionLabelChange(measure.id, label)}
                onRepeatChange={times =>
                  onRepeatChange(measure.id, times)
                }
                onRemove={() => onRemoveMeasure(measure.id)}
                canRemove={score.measures.length > 1}
              />
              <Grid
                measure={measure}
                lanes={score.lanes}
                onCycleCell={(laneId, cellIndex) => onCycleCell(measure.id, laneId, cellIndex)}
                onCellContextMenu={(laneId, cellIndex, e) => onCellContextMenu(measure.id, laneId, cellIndex, e)}
              />
            </div>
            {measure.repeat && (
              <div className={styles.repeatMarker}>𝄇</div>
            )}
          </div>
        ))}
      </div>

      <button className={styles.addMeasureBtn} onClick={onAddMeasure}>
        + Measure
      </button>
    </div>
  )
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npx vitest run src/components/Score/Score.test.tsx`

Expected: All PASS.

**Step 5: Commit**

```bash
git add src/components/Score/
git commit -m "Add Score component assembling lane headers, measure headers, and grids"
```

---

### Task 12: App Component (Wire Everything Together)

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css` (global styles)

**Step 1: Implement App component**

Replace `src/App.tsx`:
```tsx
import { useState, useCallback } from 'react'
import { useScore } from './state/useScore'
import { Toolbar } from './components/Toolbar/Toolbar'
import { Score } from './components/Score/Score'
import { ContextMenu } from './components/ContextMenu/ContextMenu'
import { downloadScore, openScoreFile } from './utils/fileIO'
import { exportToPdf, exportToPng } from './utils/export'
import { createScore } from './model/factory'
import type { CellSymbol } from './model/types'
import './App.css'

function App() {
  const {
    score,
    isDirty,
    addLane,
    removeLane,
    addMeasure,
    insertMeasure,
    removeMeasure,
    cycleCell,
    setCellSymbol,
    setCellLabel,
    setTriplet,
    setRoll,
    setSectionLabel,
    setRepeat,
    setTimeSignature,
    updateLane,
    updateTitle,
    loadScore,
    markClean,
  } = useScore()

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    measureId: string
    laneId: string
    cellIndex: number
  } | null>(null)

  const handleSave = useCallback(() => {
    downloadScore(score)
    markClean()
  }, [score, markClean])

  const handleLoad = useCallback(async () => {
    if (isDirty && !window.confirm('You have unsaved changes. Load a new score?')) return
    try {
      const loaded = await openScoreFile()
      loadScore(loaded)
    } catch {
      // user cancelled file picker
    }
  }, [isDirty, loadScore])

  const handleNewScore = useCallback(() => {
    if (isDirty && !window.confirm('You have unsaved changes. Create a new score?')) return
    loadScore(createScore())
  }, [isDirty, loadScore])

  const handleCellContextMenu = useCallback(
    (measureId: string, laneId: string, cellIndex: number, e: React.MouseEvent) => {
      e.preventDefault()
      setContextMenu({ x: e.clientX, y: e.clientY, measureId, laneId, cellIndex })
    },
    []
  )

  const handleSetSymbol = useCallback(
    (symbol: CellSymbol) => {
      if (!contextMenu) return
      setCellSymbol(contextMenu.measureId, contextMenu.laneId, contextMenu.cellIndex, symbol)
      setContextMenu(null)
    },
    [contextMenu, setCellSymbol]
  )

  const handleSetLabel = useCallback(() => {
    if (!contextMenu) return
    const label = window.prompt('Enter label:')
    if (label !== null) {
      setCellLabel(contextMenu.measureId, contextMenu.laneId, contextMenu.cellIndex, label)
    }
    setContextMenu(null)
  }, [contextMenu, setCellLabel])

  const handleSetTriplet = useCallback(() => {
    if (!contextMenu) return
    const measure = score.measures.find(m => m.id === contextMenu.measureId)
    if (!measure) return
    const beatIndex = Math.floor(contextMenu.cellIndex / measure.timeSignature.subdivision)
    setTriplet(contextMenu.measureId, contextMenu.laneId, beatIndex)
    setContextMenu(null)
  }, [contextMenu, score.measures, setTriplet])

  const handleSetRoll = useCallback(() => {
    if (!contextMenu) return
    const lengthStr = window.prompt('Roll length (number of cells):', '2')
    const length = parseInt(lengthStr ?? '')
    if (!isNaN(length) && length > 0) {
      setRoll(contextMenu.measureId, contextMenu.laneId, contextMenu.cellIndex, length)
    }
    setContextMenu(null)
  }, [contextMenu, setRoll])

  const handleAddLane = useCallback(() => {
    const name = window.prompt('Instrument name:', `Instrument ${score.lanes.length + 1}`)
    if (name) addLane(name)
  }, [score.lanes.length, addLane])

  return (
    <div className="app">
      <Toolbar
        title={score.title}
        isDirty={isDirty}
        onTitleChange={updateTitle}
        onSave={handleSave}
        onLoad={handleLoad}
        onExportPdf={() => exportToPdf(score)}
        onExportPng={() => exportToPng()}
        onAddLane={handleAddLane}
        onNewScore={handleNewScore}
      />

      <Score
        score={score}
        onCycleCell={cycleCell}
        onCellContextMenu={handleCellContextMenu}
        onLaneNameChange={(laneId, name) => updateLane(laneId, { name })}
        onLaneColorChange={(laneId, color) => updateLane(laneId, { color })}
        onRemoveLane={removeLane}
        onTimeSignatureChange={setTimeSignature}
        onSectionLabelChange={setSectionLabel}
        onRepeatChange={(measureId, times) =>
          setRepeat(measureId, times ?? 0)
        }
        onRemoveMeasure={removeMeasure}
        onInsertMeasure={insertMeasure}
        onAddMeasure={addMeasure}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onSetSymbol={handleSetSymbol}
          onSetLabel={handleSetLabel}
          onSetTriplet={handleSetTriplet}
          onSetRoll={handleSetRoll}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}

export default App
```

Replace `src/App.css`:
```css
.app {
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

**Step 2: Verify build**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npm run build`

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/App.tsx src/App.css
git commit -m "Wire up App component connecting all components and state"
```

---

### Task 13: PDF/PNG Export Utility

**Files:**
- Create: `src/utils/export.ts`

**Step 1: Implement export utilities**

Create `src/utils/export.ts`:
```ts
import type { Score } from '../model/types'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export async function exportToPng(): Promise<void> {
  const scoreEl = document.querySelector('.app')
  if (!scoreEl) return

  const canvas = await html2canvas(scoreEl as HTMLElement, {
    backgroundColor: 'white',
    scale: 2,
  })

  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = 'score.png'
  a.click()
}

export async function exportToPdf(score: Score): Promise<void> {
  const scoreEl = document.querySelector('.app')
  if (!scoreEl) return

  const canvas = await html2canvas(scoreEl as HTMLElement, {
    backgroundColor: 'white',
    scale: 2,
  })

  const imgData = canvas.toDataURL('image/png')
  const imgWidth = canvas.width
  const imgHeight = canvas.height

  const pdf = new jsPDF({
    orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
    unit: 'px',
    format: [imgWidth, imgHeight],
  })

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
  pdf.save(`${score.title || 'score'}.pdf`)
}
```

**Step 2: Verify build**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npm run build`

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/utils/export.ts
git commit -m "Add PDF and PNG export utilities"
```

---

### Task 14: Global Styles & Index Setup

**Files:**
- Modify: `src/index.css` (reset/global styles)
- Modify: `src/main.tsx` (ensure clean entry point)

**Step 1: Set up global styles**

Replace `src/index.css`:
```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  background: white;
  color: #333;
}
```

**Step 2: Clean up main.tsx**

Ensure `src/main.tsx` is:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Step 3: Verify build and all tests**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npm run build && npm test`

Expected: Build succeeds, all tests pass.

**Step 4: Commit**

```bash
git add src/index.css src/main.tsx
git commit -m "Set up global styles and clean entry point"
```

---

### Task 15: End-to-End Smoke Test

**Files:**
- Create: `src/App.test.tsx`

**Step 1: Write smoke test**

Create `src/App.test.tsx`:
```tsx
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
    expect(screen.getByText('✕')).toBeInTheDocument()
  })

  it('shows unsaved indicator after edit', () => {
    render(<App />)
    const dots = screen.getAllByText('·')
    fireEvent.click(dots[0])
    expect(screen.getByText('(unsaved)')).toBeInTheDocument()
  })
})
```

**Step 2: Run all tests**

Run: `cd /Users/shiva.bernhard@m10s.io/__DEV/PERSO/boombox && npm test`

Expected: All tests pass.

**Step 3: Commit**

```bash
git add src/App.test.tsx
git commit -m "Add end-to-end smoke tests for App component"
```

---

## Dependency Graph

```
Task 1 (Scaffolding) ──┬── Task 2 (Types/Factory)
                        │
                        ├── Task 4 (File I/O)
                        │
                        └── Task 5 (Cell) ──┐
                                            ├── Task 9 (Grid) ──┐
Task 2 ─── Task 3 (useScore hook) ──────────┤                   │
                                            ├── Task 6 (ContextMenu)
                                            │                   │
                                            ├── Task 7 (LaneHeader)
                                            │                   │
                                            └── Task 8 (MeasureHeader)
                                                                │
                                            Task 11 (Score) ────┘
                                                │
                                            Task 12 (App) ── Task 13 (Export) ── Task 14 (Styles) ── Task 15 (Smoke Test)
```

**Parallelizable groups:**
- After Task 1: Tasks 2, 4 can run in parallel
- After Task 2: Tasks 3, 5, 6, 7, 8 can run in parallel
- After Tasks 5-8: Task 9
- After Tasks 3, 9: Task 11
- After Task 11: Task 12
- After Task 12: Tasks 13, 14 in parallel
- Task 15 is last
