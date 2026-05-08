import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { slug, Editor } from './Editor'

describe('slug()', () => {
  it('lowercases and joins words with hyphens', () => {
    expect(slug('Cow Bell')).toBe('cow-bell')
  })

  it('strips non-alphanumeric except hyphens, then collapses runs', () => {
    expect(slug('Clave  (3-2)')).toBe('clave-3-2')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slug('  Clave  ')).toBe('clave')
  })

  it('returns empty string for empty input', () => {
    expect(slug('')).toBe('')
  })

  it('returns empty string when input has only non-alphanumeric chars', () => {
    expect(slug('   ')).toBe('')
    expect(slug('---')).toBe('')
  })
})

async function exportWith(template: string, instrument: string): Promise<string> {
  let captured = ''
  const originalCreate = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = originalCreate(tag) as HTMLElement
    if (tag === 'a') {
      ;(el as HTMLAnchorElement).click = () => {
        captured = (el as HTMLAnchorElement).download
      }
    }
    return el
  })
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

  render(
    <MemoryRouter>
      <Editor />
    </MemoryRouter>,
  )

  const templateInput = screen.getByLabelText('Template name')
  const instrumentInput = screen.getByLabelText('Instrument name')
  if (template) await userEvent.type(templateInput, template)
  if (instrument) await userEvent.type(instrumentInput, instrument)
  await userEvent.click(screen.getByRole('button', { name: /export/i }))

  vi.restoreAllMocks()
  return captured
}

describe('Editor — export filename', () => {
  it('combines template + instrument with slug', async () => {
    expect(await exportWith('Clave 3-2', 'Cow Bell')).toBe(
      'clave-3-2-cow-bell.template.json',
    )
  })

  it('omits instrument segment when instrument is empty', async () => {
    expect(await exportWith('Clave', '')).toBe('clave.template.json')
  })

  it('uses "template" fallback when template is empty', async () => {
    expect(await exportWith('', 'Cow Bell')).toBe('template-cow-bell.template.json')
  })

  it('uses pure fallback when both are empty', async () => {
    expect(await exportWith('', '')).toBe('template.template.json')
  })

  it('strips parentheses and collapses spaces', async () => {
    expect(await exportWith('Clave (3-2)', 'Cow Bell')).toBe(
      'clave-3-2-cow-bell.template.json',
    )
  })
})
