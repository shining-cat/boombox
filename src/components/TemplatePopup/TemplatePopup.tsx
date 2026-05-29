import { useState, useMemo } from 'react'
import type { RhythmTemplate } from '../../model/templates'
import styles from './TemplatePopup.module.css'

interface TemplatePopupProps {
  templates: RhythmTemplate[]
  laneName: string
  targetBeats: number
  targetSubdivision: number
  onSelect: (template: RhythmTemplate) => void
  onClose: () => void
}

interface TemplateGroup {
  name: string
  templates: RhythmTemplate[]
}

function hasMismatch(
  template: RhythmTemplate,
  targetBeats: number,
  targetSubdivision: number
): boolean {
  return template.measures.some(
    (m) => m.beats !== targetBeats || m.subdivision !== targetSubdivision
  )
}

function matchesLane(instrument: string, laneName: string): boolean {
  return instrument.toLowerCase().includes(laneName.toLowerCase())
}

export default function TemplatePopup({
  templates,
  laneName,
  targetBeats,
  targetSubdivision,
  onSelect,
  onClose,
}: TemplatePopupProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const groups = useMemo<TemplateGroup[]>(() => {
    const map = new Map<string, RhythmTemplate[]>()
    for (const t of templates) {
      const list = map.get(t.name) ?? []
      list.push(t)
      map.set(t.name, list)
    }
    return Array.from(map.entries()).map(([name, temps]) => {
      // Sort matching instruments to the top
      const sorted = [...temps].sort((a, b) => {
        const aMatch = matchesLane(a.instrument, laneName) ? 0 : 1
        const bMatch = matchesLane(b.instrument, laneName) ? 0 : 1
        return aMatch - bMatch
      })
      return { name, templates: sorted }
    })
  }, [templates, laneName])

  function toggleGroup(name: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  function handleSelect(template: RhythmTemplate) {
    if (hasMismatch(template, targetBeats, targetSubdivision)) {
      const confirmed = window.confirm(
        'This template has a different time signature and will overwrite the current measure structure. Continue?'
      )
      if (!confirmed) return
    }
    onSelect(template)
  }

  function handleGroupClick(group: TemplateGroup) {
    toggleGroup(group.name)
  }

  // Check if any template in a group has a mismatch
  function groupHasMismatch(group: TemplateGroup): boolean {
    return group.templates.some((t) =>
      hasMismatch(t, targetBeats, targetSubdivision)
    )
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Insert a template</h2>
          <button className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>
        <div className={styles.content}>
          {groups.map((group) => {
            const expanded = expandedGroups.has(group.name)
            const groupMismatch = groupHasMismatch(group)

            return (
              <div key={group.name} className={styles.group}>
                <button
                  className={`${styles.groupHeader} ${groupMismatch ? styles.mismatch : ''}`}
                  onClick={() => handleGroupClick(group)}
                >
                  <span className={styles.groupArrow}>
                    {expanded ? '\u25BE' : '\u25B8'}
                  </span>
                  <span className={styles.groupName}>{group.name}</span>
                  <span className={styles.groupCount}>
                    ({group.templates.length}{' '}
                    {group.templates.length === 1
                      ? 'instrument'
                      : 'instruments'}
                    )
                  </span>
                  {groupMismatch && (
                    <span
                      className={styles.warningIcon}
                      title="This template has a different time signature. Applying it will overwrite the current measure structure."
                    >
                      \u26A0
                    </span>
                  )}
                </button>

                {expanded && (
                  <ul className={styles.instrumentList}>
                    {group.templates.map((template) => {
                      const isMatch = matchesLane(template.instrument, laneName)
                      const isMismatch = hasMismatch(
                        template,
                        targetBeats,
                        targetSubdivision
                      )

                      return (
                        <li key={template.instrument}>
                          <button
                            className={`${styles.instrumentItem} ${isMismatch ? styles.instrumentMismatch : ''}`}
                            onClick={() => handleSelect(template)}
                          >
                            {isMatch && (
                              <span className={styles.bullet}>●</span>
                            )}
                            <span
                              className={isMatch ? styles.highlighted : ''}
                            >
                              {template.instrument}
                            </span>
                            {isMismatch && (
                              <span
                                className={styles.warningIcon}
                                title="This template has a different time signature. Applying it will overwrite the current measure structure."
                              >
                                \u26A0
                              </span>
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
        <div className={styles.footer}>
          <a href="#/editor" target="_blank" rel="noopener noreferrer">
            Create a new template
          </a>
        </div>
      </div>
    </>
  )
}
