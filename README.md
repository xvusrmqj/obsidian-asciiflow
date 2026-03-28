# Obsidian ASCIIFlow

[中文文档](README.zh.md)

An [Obsidian](https://obsidian.md) plugin that embeds an ASCIIFlow-style ASCII art editor directly into Markdown code blocks. Draw boxes, lines, arrows, freehand shapes, and text — with full undo/redo history.

## Features

- 🖊️ **6 Drawing Tools** — Select, Box, Line, Arrow, Text, Freeform
- 📦 **Box Drawing** — Rectangles using Unicode box-drawing characters (`┌ ┐ └ ┘ ─ │`)
- 📏 **Lines & Arrows** — Straight lines, L-shaped paths, and arrow connectors
- ⌨️ **Text Input** — Direct typing with IME composition and fullwidth character (CJK) support
- ✋ **Freeform Drawing** — Click or drag to place custom characters
- ✂️ **Select & Edit** — Rectangular selection with copy/cut/paste and drag-to-move
- ↩️ **Undo/Redo** — Up to 100 history states (`Ctrl+Z` / `Ctrl+Shift+Z`)
- 🎨 **Theme Aware** — Automatically adapts to Obsidian's light and dark themes
- 🔍 **Zoom & Pan** — Canvas zoom and pan support

## Usage

Use an `asciiflow` code block in any Obsidian Markdown file:

<pre>
```asciiflow
┌──────────┐
│  Hello   │
│  World   │
└──────────┘
```
</pre>

- **Preview mode**: The code block renders as ASCII art with an "Edit" button
- **Edit mode**: Opens a full-featured visual editor in a modal (90vw × 90vh). Changes are saved back to the code block automatically

## Tools

| Tool | Interaction | Description |
|------|-------------|-------------|
| **Select** | Click & drag | Select a region, then copy/cut/paste/delete or drag to move |
| **Box** | Click & drag | Draw a rectangle from one corner to the opposite |
| **Line** | Click & drag | Draw horizontal, vertical, or L-shaped lines |
| **Arrow** | Click & drag | Like the Line tool, with an arrowhead at the end (`► ◄ ▼ ▲`) |
| **Text** | Click to place cursor | Type freely at the cursor position |
| **Freeform** | Click & drag | Paint with `*` characters |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+C` | Copy selection |
| `Ctrl+X` | Cut selection |
| `Ctrl+V` | Paste |
| `Escape` | Exit text input mode |

## Installation

### From Obsidian Community Plugins (Recommended)

1. Open Obsidian Settings → Community Plugins
2. Disable **Safe Mode** if enabled
3. Click **Browse** and search for **ASCIIFlow**
4. Click **Install**, then **Enable**

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [Release](../../releases)
2. Create the folder `.obsidian/plugins/asciiflow/` in your Obsidian vault
3. Copy the downloaded files into that folder
4. Enable **ASCIIFlow** in Obsidian Settings → Community Plugins

### Build from Source

```bash
# Clone the repository
git clone https://github.com/xvusrmqj/obsidian-asciiflow.git
cd obsidian-asciiflow

# Install dependencies
npm install

# Development (watch mode)
npm run dev

# Production build
npm run build
```

## Architecture

```
src/
├── main.tsx              # Plugin entry point, registers code block processor
├── ui/
│   └── AsciiFlowApp.tsx  # React main component (toolbar + canvas)
├── tools/
│   ├── ITool.ts          # Tool interface
│   ├── ToolManager.ts    # Tool lifecycle & event dispatch
│   ├── ToolContext.ts    # Tool context (grid access, render trigger)
│   ├── SelectTool.ts     # Selection tool
│   ├── BoxTool.ts        # Box drawing tool
│   ├── LineTool.ts       # Line drawing tool
│   ├── ArrowTool.ts      # Arrow drawing tool
│   ├── TextTool.ts       # Text input tool
│   ├── FreeformTool.ts   # Freeform drawing tool
│   └── HistoryManager.ts # Undo/redo history (100 states)
├── model/
│   ├── Grid.ts           # Sparse grid data model (Map-based)
│   ├── Serializer.ts     # Text ↔ Grid serialization
│   └── CharWidth.ts      # Fullwidth/halfwidth character detection
├── renderer/
│   └── CanvasRenderer.ts # Canvas 2D renderer
└── input/
    ├── InputHandler.ts   # Pointer event handling
    └── CoordinateMapper.ts # Screen → Grid coordinate mapping
```

**Layered design**: UI → Tools → Renderer → Model → Input

- **UI Layer**: React component manages toolbar state and canvas interactions
- **Tools Layer**: Each tool mutates the grid via `ToolContext` and calls `render()` to refresh
- **Renderer Layer**: Canvas 2D API renders grid cells, selections, cursor, and overlays
- **Model Layer**: Sparse grid (`Map<string, string>`), default 40×120, with fullwidth character support
- **Input Layer**: Converts screen coordinates to grid coordinates, handles zoom and pan

## Tech Stack

- **TypeScript** (strict mode) + **React 18**
- **Canvas 2D API** for rendering
- **esbuild** for bundling
- **Obsidian API** ≥ 1.5.0

## License

MIT
