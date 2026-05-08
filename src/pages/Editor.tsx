import { useCallback, useState } from 'react'
import { createCell, createMeasure } from '../model/factory'
import { SYMBOL_CYCLE } from '../model/types'
import type { CellSymbol, Measure, Lane, TimeSignature } from '../model/types'
import { Grid } from '../components/Grid/Grid'
import { MeasureHeader } from '../components/MeasureHeader/MeasureHeader'
import { ContextMenu } from '../components/ContextMenu/ContextMenu'
import styles from './Editor.module.css'

const LANE_ID = 'editor-lane'

export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface ContextMenuState {
  x: number
  y: number
  measureId: string
  cellIndex: number
}

export function Editor() {
  const [templateName, setTemplateName] = useState('')
  const [instrumentName, setInstrumentName] = useState('')
  const [measures, setMeasures] = useState<Measure[]>(() => [
    createMeasure([LANE_ID], { beats: 4, subdivision: 4 }),
  ])
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const lane: Lane = { id: LANE_ID, name: instrumentName || 'Instrument', color: '#BAE1FF' }

  // --- Measure management ---

  const addMeasure = useCallback(() => {
    setMeasures(prev => {
      const last = prev[prev.length - 1]
      return [...prev, createMeasure([LANE_ID], last.timeSignature)]
    })
  }, [])

  const insertMeasure = useCallback((index: number) => {
    setMeasures(prev => {
      const ref = prev[Math.max(0, index - 1)]
      const newM = createMeasure([LANE_ID], ref.timeSignature)
      const next = [...prev]
      next.splice(index, 0, newM)
      return next
    })
  }, [])

  const removeMeasure = useCallback((measureId: string) => {
    setMeasures(prev => {
      if (prev.length <= 1) return prev
      return prev.filter(m => m.id !== measureId)
    })
  }, [])

  const setTimeSignature = useCallback((measureId: string, ts: TimeSignature) => {
    setMeasures(prev =>
      prev.map(m => {
        if (m.id !== measureId) return m
        const totalCells = ts.beats * ts.subdivision
        return {
          ...m,
          timeSignature: ts,
          cells: { [LANE_ID]: Array.from({ length: totalCells }, () => createCell()) },
          tripletBeats: undefined,
        }
      }),
    )
  }, [])

  // --- Cell editing ---

  const cycleCell = useCallback((measureId: string, cellIndex: number) => {
    setMeasures(prev =>
      prev.map(m => {
        if (m.id !== measureId) return m
        const cells = [...(m.cells[LANE_ID] ?? [])]
        const current = cells[cellIndex]?.symbol ?? null
        const idx = SYMBOL_CYCLE.indexOf(current)
        const next = SYMBOL_CYCLE[(idx + 1) % SYMBOL_CYCLE.length]
        cells[cellIndex] = { ...cells[cellIndex], symbol: next }
        return { ...m, cells: { ...m.cells, [LANE_ID]: cells } }
      }),
    )
  }, [])

  const setCellSymbol = useCallback((measureId: string, cellIndex: number, symbol: CellSymbol) => {
    setMeasures(prev =>
      prev.map(m => {
        if (m.id !== measureId) return m
        const cells = [...(m.cells[LANE_ID] ?? [])]
        cells[cellIndex] = { ...cells[cellIndex], symbol }
        return { ...m, cells: { ...m.cells, [LANE_ID]: cells } }
      }),
    )
  }, [])

  const setCellLabel = useCallback((measureId: string, cellIndex: number, label: string) => {
    setMeasures(prev =>
      prev.map(m => {
        if (m.id !== measureId) return m
        const cells = [...(m.cells[LANE_ID] ?? [])]
        cells[cellIndex] = { ...cells[cellIndex], label: label || undefined }
        return { ...m, cells: { ...m.cells, [LANE_ID]: cells } }
      }),
    )
  }, [])

  // --- Triplet ---

  const setTriplet = useCallback((measureId: string, beatIndex: number) => {
    setMeasures(prev =>
      prev.map(m => {
        if (m.id !== measureId) return m
        const laneTriplets = m.tripletBeats?.[LANE_ID] ?? []
        const { beats, subdivision } = m.timeSignature
        const hasTriplet = laneTriplets.includes(beatIndex)
        const newTriplets = hasTriplet
          ? laneTriplets.filter(b => b !== beatIndex)
          : [...laneTriplets, beatIndex]

        // Rebuild cells for this lane
        const oldCells = m.cells[LANE_ID] ?? []
        const oldTriplets = laneTriplets
        const newCells: typeof oldCells = []

        // Gather cells per beat from old layout
        let oldOffset = 0
        for (let b = 0; b < beats; b++) {
          const oldBeatSize = oldTriplets.includes(b) ? 3 : subdivision
          const newBeatSize = newTriplets.includes(b) ? 3 : subdivision
          const oldBeatCells = oldCells.slice(oldOffset, oldOffset + oldBeatSize)
          // Map old cells to new size
          for (let i = 0; i < newBeatSize; i++) {
            newCells.push(i < oldBeatCells.length ? oldBeatCells[i] : createCell())
          }
          oldOffset += oldBeatSize
        }

        return {
          ...m,
          cells: { ...m.cells, [LANE_ID]: newCells },
          tripletBeats: { ...m.tripletBeats, [LANE_ID]: newTriplets },
        }
      }),
    )
  }, [])

  // --- Roll ---

  const setRoll = useCallback((measureId: string, cellIndex: number, length: number) => {
    setMeasures(prev =>
      prev.map(m => {
        if (m.id !== measureId) return m
        const cells = [...(m.cells[LANE_ID] ?? [])]
        cells[cellIndex] = { ...cells[cellIndex], roll: { length } }
        return { ...m, cells: { ...m.cells, [LANE_ID]: cells } }
      }),
    )
  }, [])

  const removeRoll = useCallback((measureId: string, cellIndex: number) => {
    setMeasures(prev =>
      prev.map(m => {
        if (m.id !== measureId) return m
        const cells = [...(m.cells[LANE_ID] ?? [])]
        const { roll: _, ...rest } = cells[cellIndex]
        cells[cellIndex] = rest
        return { ...m, cells: { ...m.cells, [LANE_ID]: cells } }
      }),
    )
  }, [])

  // --- Flam ---

  const setFlam = useCallback((measureId: string, cellIndex: number, flam: boolean) => {
    setMeasures(prev =>
      prev.map(m => {
        if (m.id !== measureId) return m
        const cells = [...(m.cells[LANE_ID] ?? [])]
        if (flam) {
          cells[cellIndex] = { ...cells[cellIndex], flam: true }
        } else {
          const { flam: _, ...rest } = cells[cellIndex]
          cells[cellIndex] = rest
        }
        return { ...m, cells: { ...m.cells, [LANE_ID]: cells } }
      }),
    )
  }, [])

  // --- Context menu handlers ---

  const handleCellContextMenu = useCallback(
    (_laneId: string, cellIndex: number, e: React.MouseEvent, measureId: string) => {
      e.preventDefault()
      setContextMenu({ x: e.clientX, y: e.clientY, measureId, cellIndex })
    },
    [],
  )

  const handleSetSymbol = useCallback(
    (symbol: CellSymbol) => {
      if (!contextMenu) return
      setCellSymbol(contextMenu.measureId, contextMenu.cellIndex, symbol)
      setContextMenu(null)
    },
    [contextMenu, setCellSymbol],
  )

  const handleSetLabel = useCallback(() => {
    if (!contextMenu) return
    const label = window.prompt('Cell label:')
    if (label !== null) {
      setCellLabel(contextMenu.measureId, contextMenu.cellIndex, label)
    }
    setContextMenu(null)
  }, [contextMenu, setCellLabel])

  const handleSetTriplet = useCallback(() => {
    if (!contextMenu) return
    const measure = measures.find(m => m.id === contextMenu.measureId)
    if (!measure) return
    const { subdivision, beats } = measure.timeSignature
    const laneTriplets = measure.tripletBeats?.[LANE_ID] ?? []
    let pos = 0
    let beatIndex = 0
    for (let b = 0; b < beats; b++) {
      const beatSize = laneTriplets.includes(b) ? 3 : subdivision
      if (pos + beatSize > contextMenu.cellIndex) { beatIndex = b; break }
      pos += beatSize
    }
    setTriplet(contextMenu.measureId, beatIndex)
    setContextMenu(null)
  }, [contextMenu, measures, setTriplet])

  const handleSetRoll = useCallback(() => {
    if (!contextMenu) return
    const lengthStr = window.prompt('Roll length:')
    if (lengthStr !== null) {
      const length = parseInt(lengthStr, 10)
      if (!isNaN(length) && length > 0) {
        setRoll(contextMenu.measureId, contextMenu.cellIndex, length)
      }
    }
    setContextMenu(null)
  }, [contextMenu, setRoll])

  const handleRemoveRoll = useCallback(() => {
    if (!contextMenu) return
    removeRoll(contextMenu.measureId, contextMenu.cellIndex)
    setContextMenu(null)
  }, [contextMenu, removeRoll])

  const handleSetFlam = useCallback(() => {
    if (!contextMenu) return
    setFlam(contextMenu.measureId, contextMenu.cellIndex, true)
    setContextMenu(null)
  }, [contextMenu, setFlam])

  const handleRemoveFlam = useCallback(() => {
    if (!contextMenu) return
    setFlam(contextMenu.measureId, contextMenu.cellIndex, false)
    setContextMenu(null)
  }, [contextMenu, setFlam])

  // --- Export ---

  function handleExport() {
    const template = {
      _info: 'Boombox template file. Send this to the project maintainer to include it in the app.',
      name: templateName,
      instrument: instrumentName,
      measures: measures.map(m => ({
        beats: m.timeSignature.beats,
        subdivision: m.timeSignature.subdivision,
        cells: (m.cells[LANE_ID] ?? []).map(c => {
          const cell: Record<string, unknown> = { symbol: c.symbol }
          if (c.label) cell.label = c.label
          if (c.flam) cell.flam = true
          if (c.roll) cell.roll = { length: c.roll.length }
          return cell
        }),
        tripletBeats: m.tripletBeats?.[LANE_ID] ?? [],
      })),
    }
    const json = JSON.stringify(template, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const tSlug = slug(templateName) || 'template'
    const iSlug = slug(instrumentName)
    const stem = iSlug ? `${tSlug}-${iSlug}` : tSlug
    a.download = `${stem}.template.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // --- Compute context menu state for ContextMenu props ---
  const contextMeasure = contextMenu
    ? measures.find(m => m.id === contextMenu.measureId)
    : null
  const contextLaneTriplets = contextMeasure?.tripletBeats?.[LANE_ID] ?? []
  const contextCell = contextMeasure
    ? (contextMeasure.cells[LANE_ID] ?? [])[contextMenu!.cellIndex]
    : null

  let contextBeatIndex = 0
  if (contextMenu && contextMeasure) {
    const { beats, subdivision } = contextMeasure.timeSignature
    let pos = 0
    for (let b = 0; b < beats; b++) {
      const beatSize = contextLaneTriplets.includes(b) ? 3 : subdivision
      if (pos + beatSize > contextMenu.cellIndex) { contextBeatIndex = b; break }
      pos += beatSize
    }
  }

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <input
          className={styles.nameInput}
          type="text"
          value={templateName}
          onChange={e => setTemplateName(e.target.value)}
          placeholder="Template name"
          aria-label="Template name"
        />
        <input
          className={styles.nameInput}
          type="text"
          value={instrumentName}
          onChange={e => setInstrumentName(e.target.value)}
          placeholder="Instrument name"
          aria-label="Instrument name"
        />
        <div className={styles.spacer} />
        <button className={styles.exportBtn} onClick={handleExport}>
          Export
        </button>
        <a href="./" className={styles.backLink}>
          &larr; Back to Boombox
        </a>
      </div>

      <div className={styles.content}>
        <div className={styles.measuresRow}>
          {measures.map((measure, index) => (
            <div key={measure.id} style={{ display: 'flex' }}>
              {index > 0 && (
                <button
                  className={styles.insertBtn}
                  onClick={() => insertMeasure(index)}
                  title="Insert measure"
                >
                  +
                </button>
              )}
              <div className={styles.measureColumn}>
                <MeasureHeader
                  measureNumber={index + 1}
                  totalMeasures={measures.length}
                  beats={measure.timeSignature.beats}
                  subdivision={measure.timeSignature.subdivision}
                  onTimeSignatureChange={ts => setTimeSignature(measure.id, ts)}
                  onRemove={() => {
                    if (window.confirm(`Delete measure ${index + 1}, confirm?`)) {
                      removeMeasure(measure.id)
                    }
                  }}
                  canRemove={measures.length > 1}
                />
                <Grid
                  measure={measure}
                  lanes={[lane]}
                  onCycleCell={(_laneId, cellIndex) => cycleCell(measure.id, cellIndex)}
                  onCellContextMenu={(laneId, cellIndex, e) =>
                    handleCellContextMenu(laneId, cellIndex, e, measure.id)
                  }
                />
              </div>
            </div>
          ))}

          <button
            className={styles.addMeasureBtn}
            onClick={addMeasure}
            title="Add a measure"
          >
            + Measure
          </button>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          hasTriplet={contextLaneTriplets.includes(contextBeatIndex)}
          hasRoll={!!contextCell?.roll}
          hasFlam={!!contextCell?.flam}
          hasSymbol={!!contextCell?.symbol}
          onSetSymbol={handleSetSymbol}
          onSetLabel={handleSetLabel}
          onSetTriplet={handleSetTriplet}
          onSetRoll={handleSetRoll}
          onRemoveRoll={handleRemoveRoll}
          onSetFlam={handleSetFlam}
          onRemoveFlam={handleRemoveFlam}
          onOpenTemplates={() => {}}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
