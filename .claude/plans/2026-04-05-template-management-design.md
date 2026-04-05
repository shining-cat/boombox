# Template Management & Organization — Design Document

## Goal

1. Move templates out of the context menu into a dedicated popup for better organization
2. Add instrument-specific template variants (same rhythm, different instruments)
3. Create a template editor page so non-developers can create templates
4. Migrate template data from hardcoded TypeScript to an external JSON file

## Template Data Model

Templates move from `src/model/templates.ts` (hardcoded) to `public/templates.json` (fetched at startup).

Each template uses the full cell data model (not the simplified `x..x` pattern string):

```json
{
  "_info": "Boombox template file. Send this to the project maintainer to include it in the app.",
  "name": "Funk",
  "instrument": "Surdo",
  "measures": [
    {
      "beats": 4,
      "subdivision": 4,
      "cells": [{"symbol": "full-round"}, {"symbol": null}, ...],
      "tripletBeats": []
    },
    {
      "beats": 4,
      "subdivision": 4,
      "cells": [{"symbol": "cross"}, ...],
      "tripletBeats": []
    }
  ]
}
```

`templates.json` is an array of these objects. The old `src/model/templates.ts` is removed.

## Template Popup in Main Tool

### Opening
- Context menu still shows "Insert a template"
- Clicking it closes the context menu and opens a dedicated popup
- The popup remembers which lane/cell was right-clicked

### Layout
```
┌──────────────────────────────────────────┐
│  Insert a template                   ✕   │
├──────────────────────────────────────────┤
│  ▸ Samba Reggae (3 instruments)          │
│  ▾ 3-2 Clave (2 instruments)            │
│     ● Surdo   ← highlighted match       │
│       General                            │
│  ▸ Afoxe (1 instrument)                 │
│  ▸ Funk (1 instrument)    ⚠ (orange)    │
└──────────────────────────────────────────┘
```

### Behavior
- Rhythms grouped by name, collapsible
- Instrument variants listed under each rhythm
- Lane name matching: case-insensitive partial match highlights the best variant
- Single-variant rhythms: clicking the rhythm name directly applies it
- If a rhythm has only one variant, no need to expand

### Time Signature Mismatch Handling
- If a template's time signature differs from the target measure(s): show the template in orange with a ⚠ warning icon
- Hover tooltip: "This template has a different time signature. Applying it will overwrite the current measure structure."
- On click: confirmation popup before applying
- On confirm: overwrite the target measure(s)' time signature, cells, and triplets
- If the template spans more measures than exist from the clicked cell onward: auto-add missing measures

### Applying a Template
- Overwrites cells in the target lane only, starting from the clicked cell's measure
- Other lanes in the affected measures are untouched
- Multi-measure templates continue into subsequent measures, auto-adding if needed

## Template Editor

### Location
Separate page at `/boombox/editor` (same GitHub Pages deployment, same React app with routing).

### UI
A stripped-down version of the main tool:
- **Template name** input at the top
- **Instrument name** input (becomes the lane name)
- **Single lane, single line**
- **Full editing capabilities**: all symbols (click cycle + right-click menu), triplets, rolls, cell labels
- **Time signature controls**: same as main tool
- **Add measures**: for multi-measure templates
- **No sections, repeats, or multiple lanes/lines**
- **Export button**: downloads a `.template.json` file

### Exported Format
Same as the template data model above, with `_info` field explaining what to do with the file.

## Contribution Flow

1. Teacher opens `/boombox/editor`
2. Creates template (name, instrument, cells)
3. Clicks "Export" → downloads `.template.json`
4. Sends file to maintainer (email, message, etc.)
5. Maintainer pastes template into `public/templates.json`
6. Commit, push → GitHub Actions deploys → template is live

## Migration

The existing 6 templates (3-2 Clave, Afoxe, Rumba, Tambourim, Samba Reggae, Funk) are migrated to the new format with `"instrument": "General"` and placed in `public/templates.json`. The old `src/model/templates.ts` is removed.

## New/Modified Files

### New
- `public/templates.json` — template data
- `src/components/TemplatePopup/TemplatePopup.tsx` — template picker popup
- `src/components/TemplatePopup/TemplatePopup.module.css` — styles
- `src/pages/Editor.tsx` — template editor page
- `src/pages/Editor.module.css` — editor styles

### Modified
- `src/model/templates.ts` — removed (replaced by JSON file)
- `src/components/ContextMenu/ContextMenu.tsx` — "Insert a template" opens popup instead of inline sub-menu
- `src/App.tsx` — routing, template popup state, template loading
- Template application logic in `src/state/useScore.ts` — updated for new format (cell arrays instead of pattern strings), time signature overwriting, auto-adding measures
