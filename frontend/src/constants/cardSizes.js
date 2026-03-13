/**
 * Standard card size tiers for Dashpad.
 * Users can still freely resize/move cards — these are the *default* sizes
 * used when placing tools, and a shared reference for development.
 *
 * Grid cell = 32px, so multiply w/h by 32 to get pixel dimensions.
 *
 * ┌──────┬──────────┬───────────────┬─────────────────────────────────────────┐
 * │ Tier │  w × h   │  ~px          │ Typical use                             │
 * ├──────┼──────────┼───────────────┼─────────────────────────────────────────┤
 * │  S   │  8 × 10  │  256 × 320   │ Simple single-purpose tools             │
 * │      │          │               │ e.g. Metronome, Tip Calculator, QR code │
 * ├──────┼──────────┼───────────────┼─────────────────────────────────────────┤
 * │  M   │ 12 × 14  │  384 × 448   │ Most utility/reference tools            │
 * │      │          │               │ e.g. Notepad, Todo, Chord Explorer      │
 * ├──────┼──────────┼───────────────┼─────────────────────────────────────────┤
 * │  L   │ 14 × 16  │  448 × 512   │ Rich tools, editors, charts             │
 * │      │          │               │ e.g. Desmos, Monaco, Markets            │
 * ├──────┼──────────┼───────────────┼─────────────────────────────────────────┤
 * │  XL  │ 16 × 20  │  512 × 640   │ Full-featured apps, file viewers        │
 * │      │          │               │ e.g. Google Drive, Stem Splitter        │
 * └──────┴──────────┴───────────────┴─────────────────────────────────────────┘
 */

export const CARD_SIZES = {
  S:  { w: 8,  h: 10 },
  M:  { w: 12, h: 14 },
  L:  { w: 14, h: 16 },
  XL: { w: 16, h: 20 },
}

/**
 * Reference map — which size tier each tool currently uses.
 * Update this when adding new tools or adjusting defaultSize in manifests.
 *
 * S  — small, single-purpose
 * M  — medium, most tools
 * L  — large, rich/interactive
 * XL — extra large, full-featured apps
 */
export const TOOL_SIZE_TIERS = {
  // ── Math & Science ───────────────────────────────
  'calculator':       'S',
  'katex':            'M',
  'stat-tables':      'M',
  'matrix-calc':      'M',
  'formula-bank':     'M',
  'desmos':           'L',
  'geogebra':         'L',
  'periodic-table':   'L',

  // ── Music ─────────────────────────────────────────
  'metronome':        'S',
  'key-bpm-detector': 'S',
  'scale-explorer':   'S',
  'chord-explorer':   'M',
  'circle-of-fifths': 'M',
  'stem-splitter':    'M',
  'spotify':          'M',
  'apple-music':      'M',
  'soundcloud':       'M',

  // ── Files & Media ─────────────────────────────────
  'qr-code':               'S',
  'uuid-generator':        'S',
  'number-converter':      'S',
  'random-number-generator': 'S',
  'tip-calculator':        'S',
  'loan-calculator':       'S',
  'days-counter':          'M',
  'word-counter':          'M',
  'case-converter':        'M',
  'regex-tester':          'M',
  'media-downloader':      'M',
  'pdf-splitter':          'M',
  'pdf-merger':            'M',
  'handwriting-converter': 'M',
  'file-converter':        'L',
  'bg-remover':            'L',

  // ── Productivity ──────────────────────────────────
  'pomodoro-timer':   'S',
  'notepad':          'M',
  'todo':             'M',
  'habit-tracker':    'M',
  'citation-generator': 'M',
  'translator':       'M',
  'weather':          'M',
  'calendar':         'L',

  // ── Developer ─────────────────────────────────────
  'ip-lookup':        'S',
  'color-tool':       'M',
  'mermaid':          'L',
  'monaco':           'L',
  'falstad':          'L',

  // ── Finance ───────────────────────────────────────
  'forex':            'L',
  'markets':          'L',
  'stock-chart':      'L',

  // ── Games ─────────────────────────────────────────
  'chess-puzzle':     'L',
  'chess-vs-computer': 'L',

  // ── Extra Large ───────────────────────────────────
  'google-drive':     'XL',
  'ai-writer':        'XL',
  'audio-extractor':  'XL',
}
