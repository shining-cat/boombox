import { useCallback, useState } from 'react'
import { useScore } from './state/useScore'
import { Toolbar } from './components/Toolbar/Toolbar'
import { Score } from './components/Score/Score'
import { ContextMenu } from './components/ContextMenu/ContextMenu'
import { downloadScore, openScoreFile } from './utils/fileIO'
import { createScore } from './model/factory'
import { exportToPdf, exportToPng } from './utils/export'
import type { CellSymbol } from './model/types'
import './App.css'

interface ContextMenuState {
  x: number
  y: number
  measureId: string
  laneId: string
  cellIndex: number
}

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
    setSectionLength,
    setRepeat,
    setTimeSignature,
    updateLane,
    updateTitle,
    loadScore,
    markClean,
  } = useScore()

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const handleSave = useCallback(() => {
    downloadScore(score)
    markClean()
  }, [score, markClean])

  const handleLoad = useCallback(async () => {
    if (isDirty && !window.confirm('You have unsaved changes. Continue?')) return
    try {
      const loaded = await openScoreFile()
      loadScore(loaded)
    } catch {
      // user cancelled or invalid file
    }
  }, [isDirty, loadScore])

  const handleNewScore = useCallback(() => {
    if (isDirty && !window.confirm('You have unsaved changes. Create a new score?')) return
    loadScore(createScore())
  }, [isDirty, loadScore])

  const handleAddLane = useCallback(() => {
    const name = window.prompt('Instrument name:')
    if (name) addLane(name)
  }, [addLane])

  const handleExportPdf = useCallback(() => {
    exportToPdf(score)
  }, [score])

  const handleExportPng = useCallback(() => {
    exportToPng()
  }, [])

  const handleCellContextMenu = useCallback(
    (measureId: string, laneId: string, cellIndex: number, event: React.MouseEvent) => {
      event.preventDefault()
      setContextMenu({ x: event.clientX, y: event.clientY, measureId, laneId, cellIndex })
    },
    [],
  )

  const handleSetSymbol = useCallback(
    (symbol: CellSymbol) => {
      if (!contextMenu) return
      setCellSymbol(contextMenu.measureId, contextMenu.laneId, contextMenu.cellIndex, symbol)
      setContextMenu(null)
    },
    [contextMenu, setCellSymbol],
  )

  const handleSetLabel = useCallback(() => {
    if (!contextMenu) return
    const label = window.prompt('Cell label:')
    if (label !== null) {
      setCellLabel(contextMenu.measureId, contextMenu.laneId, contextMenu.cellIndex, label)
    }
    setContextMenu(null)
  }, [contextMenu, setCellLabel])

  const handleSetTriplet = useCallback(() => {
    if (!contextMenu) return
    const measure = score.measures.find((m) => m.id === contextMenu.measureId)
    if (!measure) return
    const { subdivision, beats } = measure.timeSignature
    const laneTriplets = measure.tripletBeats?.[contextMenu.laneId] ?? []
    // Find which beat this cell index falls in (variable-length beats)
    let pos = 0
    let beatIndex = 0
    for (let b = 0; b < beats; b++) {
      const beatSize = laneTriplets.includes(b) ? 3 : subdivision
      if (pos + beatSize > contextMenu.cellIndex) { beatIndex = b; break }
      pos += beatSize
    }
    setTriplet(contextMenu.measureId, contextMenu.laneId, beatIndex)
    setContextMenu(null)
  }, [contextMenu, score.measures, setTriplet])

  const handleSetRoll = useCallback(() => {
    if (!contextMenu) return
    const lengthStr = window.prompt('Roll length:')
    if (lengthStr !== null) {
      const length = parseInt(lengthStr, 10)
      if (!isNaN(length) && length > 0) {
        setRoll(contextMenu.measureId, contextMenu.laneId, contextMenu.cellIndex, length)
      }
    }
    setContextMenu(null)
  }, [contextMenu, setRoll])

  const handleRepeatChange = useCallback(
    (measureId: string, times: number | null) => {
      setRepeat(measureId, times ?? 0)
    },
    [setRepeat],
  )

  return (
    <div className="app">
      <Toolbar
        title={score.title}
        isDirty={isDirty}
        onTitleChange={updateTitle}
        onSave={handleSave}
        onLoad={handleLoad}
        onExportPdf={handleExportPdf}
        onExportPng={handleExportPng}
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
        onSectionLengthChange={setSectionLength}
        onRepeatChange={handleRepeatChange}
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
