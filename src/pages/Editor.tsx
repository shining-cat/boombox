import { useCallback, useEffect, useState } from 'react'
import { useScore } from '../state/useScore'
import { useTransport } from '../audio/useTransport'
import { loadTemplates } from '../model/templates'
import type { CellSymbol, TimeSignature } from '../model/types'
import type { RhythmTemplate } from '../model/templates'
import { Grid } from '../components/Grid/Grid'
import { MeasureHeader } from '../components/MeasureHeader/MeasureHeader'
import { ContextMenu } from '../components/ContextMenu/ContextMenu'
import { PlaybackControls } from '../components/PlaybackControls/PlaybackControls'
import TemplatePopup from '../components/TemplatePopup/TemplatePopup'
import styles from './Editor.module.css'

const LINE_INDEX = 0

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

interface TemplatePopupState {
  measureIndex: number
  beats: number
  subdivision: number
}

export function Editor() {
  const {
    score,
    cycleCell,
    setCellSymbol,
    setCellLabel,
    setTriplet,
    setRoll,
    splitRollAtCell,
    removeRollContaining,
    setFlam,
    setTimeSignature,
    addMeasure,
    insertMeasure,
    removeMeasure,
    applyTemplate,
    updateLane,
  } = useScore()

  // Single hardcoded lane; id is stable for the component's lifetime.
  const laneId = score.lanes[0].id

  const [templateName, setTemplateName] = useState('')
  const [instrumentName, setInstrumentName] = useState('')
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [templates, setTemplates] = useState<RhythmTemplate[]>([])
  const [templatePopup, setTemplatePopup] = useState<TemplatePopupState | null>(null)

  const transport = useTransport(score, false)

  useEffect(() => {
    loadTemplates().then(setTemplates).catch(() => {})
  }, [])

  // Sync instrument name to the score lane so autoDetectInstrument picks the right GM note.
  useEffect(() => {
    if (instrumentName) {
      updateLane(laneId, { name: instrumentName })
    }
  }, [instrumentName, laneId, updateLane])

  const measures = score.lines[LINE_INDEX]
  const lane = score.lanes[0]

  // --- Measure wrappers ---

  const handleAddMeasure = useCallback(() => addMeasure(LINE_INDEX), [addMeasure])

  const handleInsertMeasure = useCallback(
    (index: number) => insertMeasure(LINE_INDEX, index),
    [insertMeasure],
  )

  const handleRemoveMeasure = useCallback(
    (measureId: string) => removeMeasure(LINE_INDEX, measureId),
    [removeMeasure],
  )

  const handleSetTimeSignature = useCallback(
    (measureId: string, ts: TimeSignature) => setTimeSignature(LINE_INDEX, measureId, ts),
    [setTimeSignature],
  )

  // --- Cell wrappers ---

  const handleCycleCell = useCallback(
    (measureId: string, cellIndex: number) =>
      cycleCell(LINE_INDEX, measureId, laneId, cellIndex),
    [cycleCell, laneId],
  )

  const handleSplitRoll = useCallback(
    (measureId: string, cellIndex: number) =>
      splitRollAtCell(LINE_INDEX, measureId, laneId, cellIndex),
    [splitRollAtCell, laneId],
  )

  // --- Context menu ---

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
      setCellSymbol(LINE_INDEX, contextMenu.measureId, laneId, contextMenu.cellIndex, symbol)
      setContextMenu(null)
    },
    [contextMenu, setCellSymbol, laneId],
  )

  const handleSetLabel = useCallback(() => {
    if (!contextMenu) return
    const label = window.prompt('Cell label:')
    if (label !== null) {
      setCellLabel(LINE_INDEX, contextMenu.measureId, laneId, contextMenu.cellIndex, label)
    }
    setContextMenu(null)
  }, [contextMenu, setCellLabel, laneId])

  const handleSetTriplet = useCallback(() => {
    if (!contextMenu) return
    const measure = measures.find((m) => m.id === contextMenu.measureId)
    if (!measure) return
    const { subdivision, beats } = measure.timeSignature
    const laneTriplets = measure.tripletBeats?.[laneId] ?? []
    let pos = 0
    let beatIndex = 0
    for (let b = 0; b < beats; b++) {
      const beatSize = laneTriplets.includes(b) ? 3 : subdivision
      if (pos + beatSize > contextMenu.cellIndex) { beatIndex = b; break }
      pos += beatSize
    }
    setTriplet(LINE_INDEX, contextMenu.measureId, laneId, beatIndex)
    setContextMenu(null)
  }, [contextMenu, measures, setTriplet, laneId])

  const handleSetRoll = useCallback(() => {
    if (!contextMenu) return
    const lengthStr = window.prompt('Roll length:')
    if (lengthStr !== null) {
      const length = parseInt(lengthStr, 10)
      if (!isNaN(length) && length > 0) {
        setRoll(LINE_INDEX, contextMenu.measureId, laneId, contextMenu.cellIndex, length)
      }
    }
    setContextMenu(null)
  }, [contextMenu, setRoll, laneId])

  const handleRemoveRoll = useCallback(() => {
    if (!contextMenu) return
    removeRollContaining(LINE_INDEX, contextMenu.measureId, laneId, contextMenu.cellIndex)
    setContextMenu(null)
  }, [contextMenu, removeRollContaining, laneId])

  const handleSetFlam = useCallback(() => {
    if (!contextMenu) return
    setFlam(LINE_INDEX, contextMenu.measureId, laneId, contextMenu.cellIndex, true)
    setContextMenu(null)
  }, [contextMenu, setFlam, laneId])

  const handleRemoveFlam = useCallback(() => {
    if (!contextMenu) return
    setFlam(LINE_INDEX, contextMenu.measureId, laneId, contextMenu.cellIndex, false)
    setContextMenu(null)
  }, [contextMenu, setFlam, laneId])

  // --- Template insert ---

  const handleOpenTemplates = useCallback(() => {
    if (!contextMenu) return
    const measureIndex = measures.findIndex((m) => m.id === contextMenu.measureId)
    if (measureIndex === -1) return
    const measure = measures[measureIndex]
    setContextMenu(null)
    setTemplatePopup({
      measureIndex,
      beats: measure.timeSignature.beats,
      subdivision: measure.timeSignature.subdivision,
    })
  }, [contextMenu, measures])

  const handleApplyTemplate = useCallback(
    (template: RhythmTemplate) => {
      if (!templatePopup) return
      applyTemplate(LINE_INDEX, templatePopup.measureIndex, laneId, template)
      setTemplatePopup(null)
    },
    [templatePopup, applyTemplate, laneId],
  )

  // --- Export ---

  function handleExport() {
    const template = {
      _info: 'Boombox template file. Send this to the project maintainer to include it in the app.',
      name: templateName,
      instrument: instrumentName,
      measures: measures.map((m) => ({
        beats: m.timeSignature.beats,
        subdivision: m.timeSignature.subdivision,
        cells: (m.cells[laneId] ?? []).map((c) => {
          const cell: Record<string, unknown> = { symbol: c.symbol }
          if (c.label) cell.label = c.label
          if (c.flam) cell.flam = true
          if (c.roll) cell.roll = { length: c.roll.length }
          return cell
        }),
        tripletBeats: m.tripletBeats?.[laneId] ?? [],
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

  // --- Derived state for ContextMenu props ---

  const contextMeasure = contextMenu
    ? measures.find((m) => m.id === contextMenu.measureId)
    : null
  const contextLaneTriplets = contextMeasure?.tripletBeats?.[laneId] ?? []
  const contextCell = contextMeasure
    ? (contextMeasure.cells[laneId] ?? [])[contextMenu!.cellIndex]
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
        <PlaybackControls
          state={transport.state}
          tempo={transport.tempo}
          looping={transport.looping}
          onPlay={transport.play}
          onPause={transport.pause}
          onResume={transport.resume}
          onStop={transport.stop}
          onTempoChange={transport.setTempo}
          onToggleLoop={transport.toggleLoop}
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
                  onClick={() => handleInsertMeasure(index)}
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
                  onTimeSignatureChange={ts => handleSetTimeSignature(measure.id, ts)}
                  onRemove={() => {
                    if (window.confirm(`Delete measure ${index + 1}, confirm?`)) {
                      handleRemoveMeasure(measure.id)
                    }
                  }}
                  canRemove={measures.length > 1}
                />
                <Grid
                  measure={measure}
                  lanes={[lane]}
                  onCycleCell={(_laneId, cellIndex) => handleCycleCell(measure.id, cellIndex)}
                  onSplitRoll={(_laneId, cellIndex) => handleSplitRoll(measure.id, cellIndex)}
                  onCellContextMenu={(laneIdArg, cellIndex, e) =>
                    handleCellContextMenu(laneIdArg, cellIndex, e, measure.id)
                  }
                />
              </div>
            </div>
          ))}

          <button
            className={styles.addMeasureBtn}
            onClick={handleAddMeasure}
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
          inRoll={
            contextMeasure
              ? (contextMeasure.cells[laneId] ?? []).some(
                  (c, ci) =>
                    c.roll &&
                    ci <= contextMenu.cellIndex &&
                    ci + c.roll.length > contextMenu.cellIndex &&
                    ci !== contextMenu.cellIndex,
                )
              : false
          }
          hasFlam={!!contextCell?.flam}
          hasSymbol={!!contextCell?.symbol}
          onSetSymbol={handleSetSymbol}
          onSetLabel={handleSetLabel}
          onSetTriplet={handleSetTriplet}
          onSetRoll={handleSetRoll}
          onRemoveRoll={handleRemoveRoll}
          onSetFlam={handleSetFlam}
          onRemoveFlam={handleRemoveFlam}
          onOpenTemplates={handleOpenTemplates}
          onClose={() => setContextMenu(null)}
        />
      )}

      {templatePopup && (
        <TemplatePopup
          templates={templates}
          laneName={instrumentName}
          targetBeats={templatePopup.beats}
          targetSubdivision={templatePopup.subdivision}
          onSelect={handleApplyTemplate}
          onClose={() => setTemplatePopup(null)}
        />
      )}
    </div>
  )
}
