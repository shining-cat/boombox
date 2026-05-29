import { useEffect, useState } from 'react'
import { loadTemplates } from '../model/templates'
import { generateShowcaseScore } from '../model/showcase'
import type { Score } from '../model/types'
import App from '../App'

export function Showcase() {
  const [score, setScore] = useState<Score | null>(null)

  useEffect(() => {
    loadTemplates()
      .then(t => setScore(generateShowcaseScore(t)))
      .catch(() => {})
  }, [])

  if (!score) {
    return <div style={{ padding: 20 }}>Loading library showcase…</div>
  }

  return <App initialScore={score} />
}
