import { useCallback, useEffect, useState } from 'react'
import { useScore } from './state/useScore'
import { Toolbar } from './components/Toolbar/Toolbar'
import { Score } from './components/Score/Score'
import { ContextMenu } from './components/ContextMenu/ContextMenu'
import TemplatePopup from './components/TemplatePopup/TemplatePopup'
import { MidiExportModal } from './components/MidiExportModal/MidiExportModal'
import { useTransport } from './audio/useTransport'
import { downloadScore, openScoreFile } from './utils/fileIO'
import { createScore } from './model/factory'
import { exportToPdf, exportToPng } from './utils/export'
import { loadTemplates } from './model/templates'
import type { CellSymbol, Score as ScoreModel } from './model/types'
import type { RhythmTemplate } from './model/templates'
import './App.css'

interface AppProps {
  initialScore?: ScoreModel
}

interface ContextMenuState {
  x: number
  y: number
  lineIndex: number
  measureId: string
  laneId: string
  cellIndex: number
}

function App({ initialScore }: AppProps = {}) {
  const {
    score,
    isDirty,
    addLane,
    removeLane,
    addMeasure,
    insertMeasure,
    removeMeasure,
    addLine,
    cycleCell,
    setCellSymbol,
    setCellLabel,
    setTriplet,
    setRoll,
    splitRollAtCell,
    removeRollContaining,
    setFlam,
    setSectionLabel,
    setSectionLength,
    setRepeat,
    setTimeSignature,
    applyTemplate,
    updateLane,
    updateTitle,
    loadScore,
    markClean,
  } = useScore()

  const [showPulse, setShowPulse] = useState(false)
  const transport = useTransport(score, showPulse)

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [showMidiExport, setShowMidiExport] = useState(false)
  const [templates, setTemplates] = useState<RhythmTemplate[]>([])
  const [templatePopup, setTemplatePopup] = useState<{ lineIndex: number; measureIndex: number; laneId: string; laneName: string; beats: number; subdivision: number } | null>(null)

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  useEffect(() => {
    const base = "Shining-cat's Boombox"
    document.title = score.title && score.title !== 'Untitled Score'
      ? `${score.title} - ${base}`
      : base
  }, [score.title])

  useEffect(() => {
    loadTemplates().then(setTemplates).catch(() => {})
  }, [])

  useEffect(() => {
    if (initialScore) loadScore(initialScore)
  }, [initialScore, loadScore])

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
    (lineIndex: number, measureId: string, laneId: string, cellIndex: number, event: React.MouseEvent) => {
      event.preventDefault()
      setContextMenu({ x: event.clientX, y: event.clientY, lineIndex, measureId, laneId, cellIndex })
    },
    [],
  )

  const handleSetSymbol = useCallback(
    (symbol: CellSymbol) => {
      if (!contextMenu) return
      setCellSymbol(contextMenu.lineIndex, contextMenu.measureId, contextMenu.laneId, contextMenu.cellIndex, symbol)
      setContextMenu(null)
    },
    [contextMenu, setCellSymbol],
  )

  const handleSetLabel = useCallback(() => {
    if (!contextMenu) return
    const label = window.prompt('Cell label:')
    if (label !== null) {
      setCellLabel(contextMenu.lineIndex, contextMenu.measureId, contextMenu.laneId, contextMenu.cellIndex, label)
    }
    setContextMenu(null)
  }, [contextMenu, setCellLabel])

  const handleSetTriplet = useCallback(() => {
    if (!contextMenu) return
    const measure = score.lines[contextMenu.lineIndex].find((m) => m.id === contextMenu.measureId)
    if (!measure) return
    const { subdivision, beats } = measure.timeSignature
    const laneTriplets = measure.tripletBeats?.[contextMenu.laneId] ?? []
    let pos = 0
    let beatIndex = 0
    for (let b = 0; b < beats; b++) {
      const beatSize = laneTriplets.includes(b) ? 3 : subdivision
      if (pos + beatSize > contextMenu.cellIndex) { beatIndex = b; break }
      pos += beatSize
    }
    setTriplet(contextMenu.lineIndex, contextMenu.measureId, contextMenu.laneId, beatIndex)
    setContextMenu(null)
  }, [contextMenu, score.lines, setTriplet])

  const handleSetRoll = useCallback(() => {
    if (!contextMenu) return
    const lengthStr = window.prompt('Roll length:')
    if (lengthStr !== null) {
      const length = parseInt(lengthStr, 10)
      if (!isNaN(length) && length > 0) {
        setRoll(contextMenu.lineIndex, contextMenu.measureId, contextMenu.laneId, contextMenu.cellIndex, length)
      }
    }
    setContextMenu(null)
  }, [contextMenu, setRoll])

  const handleRemoveRoll = useCallback(() => {
    if (!contextMenu) return
    removeRollContaining(contextMenu.lineIndex, contextMenu.measureId, contextMenu.laneId, contextMenu.cellIndex)
    setContextMenu(null)
  }, [contextMenu, removeRollContaining])

  const handleSetFlam = useCallback(() => {
    if (!contextMenu) return
    setFlam(contextMenu.lineIndex, contextMenu.measureId, contextMenu.laneId, contextMenu.cellIndex, true)
    setContextMenu(null)
  }, [contextMenu, setFlam])

  const handleRemoveFlam = useCallback(() => {
    if (!contextMenu) return
    setFlam(contextMenu.lineIndex, contextMenu.measureId, contextMenu.laneId, contextMenu.cellIndex, false)
    setContextMenu(null)
  }, [contextMenu, setFlam])

  const handleApplyTemplate = useCallback(
    (template: RhythmTemplate) => {
      if (!templatePopup) return
      applyTemplate(templatePopup.lineIndex, templatePopup.measureIndex, templatePopup.laneId, template)
      setTemplatePopup(null)
    },
    [templatePopup, applyTemplate],
  )

  const handleOpenTemplates = useCallback(() => {
    if (!contextMenu) return
    const line = score.lines[contextMenu.lineIndex]
    const measureIndex = line.findIndex(m => m.id === contextMenu.measureId)
    if (measureIndex === -1) return
    const measure = line[measureIndex]
    const lane = score.lanes.find(l => l.id === contextMenu.laneId)
    setContextMenu(null)
    setTemplatePopup({
      lineIndex: contextMenu.lineIndex,
      measureIndex,
      laneId: contextMenu.laneId,
      laneName: lane?.name ?? '',
      beats: measure.timeSignature.beats,
      subdivision: measure.timeSignature.subdivision,
    })
  }, [contextMenu, score.lines, score.lanes])

  const handleRepeatChange = useCallback(
    (lineIndex: number, measureId: string, times: number | null) => {
      setRepeat(lineIndex, measureId, times ?? 0)
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
        onExportMidi={() => setShowMidiExport(true)}
        onNewScore={handleNewScore}
        transportState={transport.state}
        tempo={transport.tempo}
        onPlay={transport.play}
        onPause={transport.pause}
        onResume={transport.resume}
        onStop={transport.stop}
        onTempoChange={transport.setTempo}
        looping={transport.looping}
        onToggleLoop={transport.toggleLoop}
      />
      <Score
        score={score}
        onCycleCell={cycleCell}
        onSplitRoll={splitRollAtCell}
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
        onAddLane={handleAddLane}
        onAddLine={addLine}
        onToggleMute={transport.toggleMute}
        onInstrumentChange={(laneId, note) => updateLane(laneId, { gmNote: note })}
        onTogglePulse={() => setShowPulse(p => !p)}
        pulseNote={transport.pulseNote}
        onPulseInstrumentChange={transport.setPulseNote}
        showPulse={showPulse}
        highlightMeasureIndex={transport.currentMeasureIndex}
        mutedLaneIds={transport.mutedLanes}
      />
      {contextMenu && (() => {
        const measure = score.lines[contextMenu.lineIndex]?.find(m => m.id === contextMenu.measureId)
        const cells = measure?.cells[contextMenu.laneId] ?? []
        const cell = cells[contextMenu.cellIndex]
        const laneTriplets = measure?.tripletBeats?.[contextMenu.laneId] ?? []
        const { beats, subdivision } = measure?.timeSignature ?? { beats: 0, subdivision: 0 }
        let beatIndex = 0
        let pos = 0
        for (let b = 0; b < beats; b++) {
          const beatSize = laneTriplets.includes(b) ? 3 : subdivision
          if (pos + beatSize > contextMenu.cellIndex) { beatIndex = b; break }
          pos += beatSize
        }
        return (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            hasTriplet={laneTriplets.includes(beatIndex)}
            hasRoll={!!cell?.roll}
            inRoll={cells.some(
              (c, ci) =>
                c.roll &&
                ci <= contextMenu.cellIndex &&
                ci + c.roll.length > contextMenu.cellIndex &&
                ci !== contextMenu.cellIndex,
            )}
            hasFlam={!!cell?.flam}
            hasSymbol={!!cell?.symbol}
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
        )
      })()}
      {templatePopup && (
        <TemplatePopup
          templates={templates}
          laneName={templatePopup.laneName}
          targetBeats={templatePopup.beats}
          targetSubdivision={templatePopup.subdivision}
          onSelect={handleApplyTemplate}
          onClose={() => setTemplatePopup(null)}
        />
      )}
      {showMidiExport && (
        <MidiExportModal score={score} onClose={() => setShowMidiExport(false)} />
      )}
      <footer className="footer">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="footer-logo" />
        <span className="footer-text">
          <a href="https://github.com/shining-cat" target="_blank" rel="noopener noreferrer">@Shining-cat</a>
          {' · '}GPL-3.0
        </span>
      </footer>
    </div>
  )
}

export default App
