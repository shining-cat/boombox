# Boombox

A tool for writing and sharing non-melodic percussion scores.

## [Open Boombox](https://shining-cat.github.io/boombox/)

---

## What is this?

Boombox lets you write percussion scores for drums, djembe, cajon, batucada, or any non-melodic percussion instrument. It runs entirely in your browser — no account, no install, nothing stored on a server.

You build your score by clicking cells on a grid, where each row is an instrument (lane) and each column is a pulse. Export to PDF or PNG to print or share, or save as a `.boombox.json` file to keep editing later.

## Features

- **Lanes** for each instrument, with custom names, colors, and per-lane GM percussion sound + mute
- **Measures and lines** with configurable time signatures (pulses per measure, cells per pulse)
- **Sections and repeats** to structure your score (intro 2x, verse 4x, etc.) — every measure has an editable banner, named sections unlock length and repeat-count controls
- **Triplets, rolls, and flams** (grace note + main hit) for percussion ornaments
- **Repinique double-strokes** — `✕✕` and `●●` symbols for two equal hits inside one cell
- **Rhythm templates** — preset patterns (Clave, Afoxe, Samba Reggae, Bondan, etc.) you can insert into any measure
- **Playable pulse lane** — a metronome lane with its own GM sound, useful for practice
- **Playback** with per-lane mute, tempo control (40-300 BPM), loop toggle, and live measure highlighting
- **Export** to PDF, PNG, or MIDI (experimental)
- **Save/Load** as `.boombox.json` files — your scores stay on your machine

## How to use

1. Click any cell to cycle through symbols (cross, circle, dot, etc.)
2. Right-click a cell for more options: pick a symbol (including the double `✕✕` / `●●`), add a triplet, roll, flam, label, or insert a rhythm template
3. Add measures, lines, and lanes using the "+" buttons
4. Click a section banner above any measure to name it; once named, edit its length and repeat count inline
5. Save your work — Boombox never saves anything on its own

For the full guide, click **Help** in the toolbar.

## Rhythm templates

Boombox comes with a library of preset rhythm patterns. You can also create your own using the [template editor](https://shining-cat.github.io/boombox/#/editor), then submit them to eventually be included inside the tool's library.

### Submitting a template

When you click **Export** in the template editor, you get a file named `{template-slug}-{instrument-slug}.template.json` derived from the Template name and Instrument name fields. The JSON inside the file also carries those fields, but **the filename is the source of truth** — that's what the maintainer uses to identify your template when adding it to the library.

If you later rename the file (e.g. to organise a batch), the `name` and `instrument` fields inside the JSON may end up out of sync with the filename. That's fine: just make sure the filename clearly describes the template + instrument, in the same `template-slug-instrument-slug` shape the export produces.

Submit templates by opening an issue or pull request on the [GitHub repo](https://github.com/shining-cat/boombox).

## License

GPL-3.0 — see [LICENSE](LICENSE).
