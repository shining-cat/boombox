import type { CellSymbol } from './types'

export type DoubleSymbol = 'double-cross' | 'double-full-round'

export function isDoubleSymbol(s: CellSymbol): s is DoubleSymbol {
  return s === 'double-cross' || s === 'double-full-round'
}

export const FLAM_LEAD_SECONDS = 0.030
export const FLAM_VELOCITY_RATIO = 0.5

export function shouldEmitFlam(cell: {
  symbol: CellSymbol
  flam?: boolean
  roll?: { length: number }
}): boolean {
  return Boolean(cell.flam && cell.symbol && !cell.roll)
}

export interface PercussionInstrument {
  note: number
  name: string
  group: string
}

export interface VelocityPreset {
  label: string
  value: number
}

export const VELOCITY_PRESETS: VelocityPreset[] = [
  { label: 'Ghost', value: 30 },
  { label: 'Piano', value: 60 },
  { label: 'Mezzo', value: 90 },
  { label: 'Forte', value: 110 },
  { label: 'Accent', value: 127 },
]

export const DEFAULT_SYMBOL_VELOCITIES: Record<string, number> = {
  cross: 127,
  'double-cross': 127,
  'full-round': 110,
  'double-full-round': 110,
  'cross-circle': 127,
  square: 90,
  diamond: 90,
  'empty-round': 60,
  dot: 30,
}

export const GM_PERCUSSION: PercussionInstrument[] = [
  // Kicks
  { note: 35, name: 'Acoustic Bass Drum', group: 'Kicks' },
  { note: 36, name: 'Bass Drum 1', group: 'Kicks' },
  // Snares
  { note: 37, name: 'Side Stick', group: 'Snares' },
  { note: 38, name: 'Acoustic Snare', group: 'Snares' },
  { note: 39, name: 'Hand Clap', group: 'Snares' },
  { note: 40, name: 'Electric Snare', group: 'Snares' },
  // Toms
  { note: 41, name: 'Low Floor Tom', group: 'Toms' },
  { note: 43, name: 'High Floor Tom', group: 'Toms' },
  { note: 45, name: 'Low Tom', group: 'Toms' },
  { note: 47, name: 'Low-Mid Tom', group: 'Toms' },
  { note: 48, name: 'Hi-Mid Tom', group: 'Toms' },
  { note: 50, name: 'High Tom', group: 'Toms' },
  // Hi-Hats
  { note: 42, name: 'Closed Hi-Hat', group: 'Hi-Hats' },
  { note: 44, name: 'Pedal Hi-Hat', group: 'Hi-Hats' },
  { note: 46, name: 'Open Hi-Hat', group: 'Hi-Hats' },
  // Cymbals
  { note: 49, name: 'Crash Cymbal 1', group: 'Cymbals' },
  { note: 51, name: 'Ride Cymbal 1', group: 'Cymbals' },
  { note: 52, name: 'Chinese Cymbal', group: 'Cymbals' },
  { note: 53, name: 'Ride Bell', group: 'Cymbals' },
  { note: 55, name: 'Splash Cymbal', group: 'Cymbals' },
  { note: 57, name: 'Crash Cymbal 2', group: 'Cymbals' },
  { note: 59, name: 'Ride Cymbal 2', group: 'Cymbals' },
  // Latin
  { note: 54, name: 'Tambourine', group: 'Latin' },
  { note: 56, name: 'Cowbell', group: 'Latin' },
  { note: 58, name: 'Vibraslap', group: 'Latin' },
  { note: 60, name: 'Hi Bongo', group: 'Latin' },
  { note: 61, name: 'Low Bongo', group: 'Latin' },
  { note: 62, name: 'Mute Hi Conga', group: 'Latin' },
  { note: 63, name: 'Open Hi Conga', group: 'Latin' },
  { note: 64, name: 'Low Conga', group: 'Latin' },
  { note: 65, name: 'High Timbale', group: 'Latin' },
  { note: 66, name: 'Low Timbale', group: 'Latin' },
  { note: 67, name: 'High Agogo', group: 'Latin' },
  { note: 68, name: 'Low Agogo', group: 'Latin' },
  { note: 69, name: 'Cabasa', group: 'Latin' },
  { note: 70, name: 'Maracas', group: 'Latin' },
  { note: 73, name: 'Short Guiro', group: 'Latin' },
  { note: 74, name: 'Long Guiro', group: 'Latin' },
  { note: 75, name: 'Claves', group: 'Latin' },
  { note: 76, name: 'Hi Wood Block', group: 'Latin' },
  { note: 77, name: 'Low Wood Block', group: 'Latin' },
  // Effects
  { note: 71, name: 'Short Whistle', group: 'Effects' },
  { note: 72, name: 'Long Whistle', group: 'Effects' },
  { note: 78, name: 'Mute Cuica', group: 'Effects' },
  { note: 79, name: 'Open Cuica', group: 'Effects' },
  { note: 80, name: 'Mute Triangle', group: 'Effects' },
  { note: 81, name: 'Open Triangle', group: 'Effects' },
  { note: 82, name: 'Shaker', group: 'Effects' },
]

export const INSTRUMENT_GROUPS = [...new Set(GM_PERCUSSION.map(i => i.group))]

const AUTO_DETECT_RULES: { pattern: RegExp; note: number }[] = [
  { pattern: /surdo|bass|kick/i, note: 36 },
  { pattern: /caixa|snare/i, note: 38 },
  { pattern: /hi[- ]?hat|hihat|chimbal/i, note: 42 },
  { pattern: /agogo/i, note: 67 },
  { pattern: /tambo[u]?rim/i, note: 56 },
  { pattern: /shaker|ganz[aã]/i, note: 82 },
  { pattern: /clav[eé]/i, note: 75 },
  { pattern: /bongo/i, note: 60 },
  { pattern: /conga/i, note: 63 },
  { pattern: /timbale/i, note: 65 },
  { pattern: /cowbell/i, note: 56 },
  { pattern: /crash/i, note: 49 },
  { pattern: /ride/i, note: 51 },
  { pattern: /tom/i, note: 45 },
  { pattern: /clap/i, note: 39 },
  { pattern: /triangle/i, note: 81 },
  { pattern: /tambourine/i, note: 54 },
  { pattern: /wood/i, note: 76 },
  { pattern: /cuica/i, note: 79 },
  { pattern: /cabasa/i, note: 69 },
  { pattern: /maraca/i, note: 70 },
]

export function autoDetectInstrument(laneName: string): number {
  for (const rule of AUTO_DETECT_RULES) {
    if (rule.pattern.test(laneName)) return rule.note
  }
  return 38 // Default: Acoustic Snare
}
