# Boombox — Design Document

**Date:** 2026-04-02
**Author:** Shiva Bernhard
**License:** GPL-3.0

## Purpose

A web app for writing and reading Brazilian drum band scores. No playback, no animation — focused on notation clarity and ease of use for non-musicians.

## Core Concepts

### Score Layout
- Horizontal grid: lanes (instruments) as rows, time flows left-to-right
- Scrolls horizontally for longer pieces
- Lane headers (instrument names) are sticky on the left

### Lanes
- Each lane represents one instrument (e.g. Surdo, Caixa, Tambourim)
- Pastel background color per lane for visual distinction (user-configurable)
- Default: 1 lane. User can add/remove lanes
- Lane name is editable

### Measures
- User can add measures at the end or insert between existing ones
- Adding a measure adds it across all lanes
- Each measure has:
  - **Time signature** (e.g. 4/4) — applies to all lanes
  - **Subdivision** (e.g. 4 for sixteenth notes, 3 for triplets) — determines how many cells per beat
  - A 4/4 measure with subdivision 4 = 16 cells; with subdivision 3 = 12 cells
- This supports alternating binary and ternary rhythms per measure

### Cells
- Every sub-pulse position is shown (empty dot or symbol)
- User clicks to cycle through symbols: cross, empty-round, full-round, square, diamond
- Symbols have no enforced meaning — users assign their own conventions
- Right-click / long-press opens context menu for specific symbol selection, labels, triplet, or roll

### Special Notations

**Triplets:**
- 3 evenly spaced notes in the time of one beat (where normally 2 or 4 would fit)
- Normal subdivision cells for that beat are replaced by 3 cells
- "TRI" label with bracket displayed above the triplet group

**Rolls:**
- A wiggly/wavy line spanning multiple cells
- Replaces individual cell symbols for its duration
- User marks start cell and specifies length

### Labels & Annotations
- **Section labels**: span across all lanes above a measure (e.g. "INTRO", "CHORUS")
- **Note/cell labels**: tied to a specific cell (e.g. "DOWN", "LEFT")
- **Lane labels**: instrument name in the lane header
- **Repeat/loop markers**: dedicated visual symbols at measure boundaries, with optional count (e.g. "x3")

## Data Model

```
Score
  title: string
  author: string
  tempo: number (BPM, display only)
  lanes: Lane[]
    id: string
    name: string
    color: string (pastel background)
  measures: Measure[]
    id: string
    timeSignature: { beats: number, subdivision: number }
    sectionLabel?: string
    repeat?: { times: number }
    cells: Map<laneId, Cell[]>
      Cell
        symbol: "cross" | "empty-round" | "full-round" | "square" | "diamond" | null
        label?: string
        triplet?: boolean (start of a 3-cell triplet group)
        roll?: { length: number }
```

## UI Components

```
+-------------------------------------------------------+
| Toolbar: [Title] [Save] [Load] [Export PDF] [+ Lane]  |
+------+-----------+-----------+-----------+------------+
|      | "INTRO"               |           |            |
|      +-----------+-----------+           |            |
|      | 4/4 div4  | 4/4 div3  | 4/4 div4  |            |
| Lane +-----------+-----------+-----------+ [+ measure]|
| names| Surdo     | . X . X   | . X . X   |            |
|(color| (pink)    | . . . .   | . . . .   |            |
| bg)  +-----------+-----------+-----------+            |
|      | Caixa     | X . X .   | X . X .   |            |
|      | (blue)    | . . . .   | . . . .   |            |
+------+-----------+-----------+-----------+------------+
```

### Toolbar
- Score title (editable inline)
- Save: downloads `.boombox.json` file
- Load: file picker for `.boombox.json` files
- Export: PDF or PNG render of current score
- Add Lane button

### Interactions
- **Click a cell**: cycles through symbols (null -> cross -> empty-round -> ...)
- **Right-click / long-press**: context menu (set specific symbol, add label, start triplet, start roll)
- **Between measures**: small "+" button to insert a measure
- **Measure header**: click to edit time signature, subdivision, section label, repeat markers

## File Operations

### Save (JSON)
- Downloads a `.boombox.json` file containing the full score
- File name defaults to score title

### Load (JSON)
- File picker to open a `.boombox.json` file
- Prompts if there is unsaved work before replacing

### Export (PDF/PNG)
- Faithful rendering of the on-screen grid
- Same colors, symbols, labels, repeat markers
- PDF paginates at measure boundaries (never splits a measure)

### New Score
- 1 lane, 1 measure, 4/4 time, subdivision 4
- Prompts if there is unsaved work

## Tech Stack

- **React 18 + TypeScript**
- **Vite** (build tool)
- **CSS Modules** (scoped styling)
- **jsPDF + html2canvas** (PDF/PNG export)
- **uuid** (unique IDs)
- **GitHub Pages** (hosting via GitHub Actions)
- **GPL-3.0** license

## Project Structure

```
boombox/
  src/
    components/
      Toolbar/
      Score/
      LaneHeader/
      MeasureHeader/
      Grid/
      Cell/
      ContextMenu/
    model/
      types.ts
    state/
      useScore.ts
    utils/
      fileIO.ts
      export.ts
    App.tsx
    main.tsx
  public/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  LICENSE
```

## Deployment

- Static site on GitHub Pages
- GitHub Actions workflow: build and deploy on push to `main`
- No backend, no accounts, no server

## Target Users

- Brazilian drum band members with little to no music notation experience
- Primary use: writing scores during/after rehearsals, sharing with band members
- Accessible from desktop and mobile (mobile not a priority but considered)
