import type { Measure, Score } from '../model/types'

export interface FlattenedMeasure {
  measure: Measure
  visualIndex: number
}

export function flattenMeasures(score: Score): FlattenedMeasure[] {
  const result: FlattenedMeasure[] = []
  let visualOffset = 0

  for (const line of score.lines) {
    const sections: { startIndex: number; length: number; repeatTimes: number }[] = []
    for (let i = 0; i < line.length; i++) {
      const m = line[i]
      if (m.sectionLabel) {
        sections.push({
          startIndex: i,
          length: Math.min(m.sectionLength ?? 1, line.length - i),
          repeatTimes: m.repeat?.times ?? 1,
        })
      }
    }

    const measureSectionMap = new Map<number, typeof sections[0]>()
    for (const sec of sections) {
      for (let j = sec.startIndex; j < sec.startIndex + sec.length; j++) {
        measureSectionMap.set(j, sec)
      }
    }

    let i = 0
    while (i < line.length) {
      const sec = measureSectionMap.get(i)
      if (sec && sec.startIndex === i) {
        for (let rep = 0; rep < sec.repeatTimes; rep++) {
          for (let j = sec.startIndex; j < sec.startIndex + sec.length; j++) {
            result.push({ measure: line[j], visualIndex: visualOffset + j })
          }
        }
        i = sec.startIndex + sec.length
      } else if (!measureSectionMap.has(i)) {
        result.push({ measure: line[i], visualIndex: visualOffset + i })
        i++
      } else {
        i++
      }
    }

    visualOffset += line.length
  }
  return result
}
