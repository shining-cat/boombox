import type { Score } from '../model/types'

export function serializeScore(score: Score): string {
  return JSON.stringify(score, null, 2)
}

export function deserializeScore(json: string): Score {
  const parsed = JSON.parse(json)
  // Migrate old format: measures -> lines
  if (parsed.measures && !parsed.lines) {
    parsed.lines = [parsed.measures]
    delete parsed.measures
  }
  if (!parsed.title || !parsed.lanes || !parsed.lines) {
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
