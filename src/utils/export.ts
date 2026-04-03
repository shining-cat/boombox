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
