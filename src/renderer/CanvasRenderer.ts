import { Grid } from "../model/Grid";
import { charWidth } from "../model/CharWidth";
import { DragPreview } from "../tools/SelectTool";

export type CanvasTheme = {
  background: string;
  foreground: string;
  grid: string;
};

export type CanvasRendererOptions = {
  cellWidth: number;
  cellHeight: number;
  fontFamily: string;
  fontSize: number;
  showGrid: boolean;
};

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private grid: Grid;
  private options: CanvasRendererOptions;
  private theme: CanvasTheme;
  private panX = 0;
  private panY = 0;
  private zoom = 1;
  private selection: { startRow: number; startCol: number; endRow: number; endCol: number } | null = null;
  private textCursor: { row: number; col: number } | null = null;
  private dragPreview: DragPreview | null = null;

  constructor(canvas: HTMLCanvasElement, grid: Grid, options: CanvasRendererOptions, theme: CanvasTheme) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not available");

    this.canvas = canvas;
    this.ctx = ctx;
    this.grid = grid;
    this.options = options;
    this.theme = theme;

    this.applyFont();
  }

  setGrid(grid: Grid) {
    this.grid = grid;
  }

  setTheme(theme: CanvasTheme) {
    this.theme = theme;
  }

  setOptions(options: Partial<CanvasRendererOptions>) {
    this.options = { ...this.options, ...options };
    this.applyFont();
  }

  setPan(x: number, y: number) {
    this.panX = x;
    this.panY = y;
  }

  setZoom(zoom: number) {
    this.zoom = Math.max(0.2, Math.min(3, zoom));
  }

  getPan() {
    return { x: this.panX, y: this.panY };
  }

  getZoom() {
    return this.zoom;
  }

  resize(width: number, height: number) {
    this.canvas.width = Math.floor(width * window.devicePixelRatio);
    this.canvas.height = Math.floor(height * window.devicePixelRatio);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  render() {
    const { cellWidth, cellHeight, showGrid } = this.options;
    const ctx = this.ctx;
    const canvasWidth = this.canvas.width / window.devicePixelRatio;
    const canvasHeight = this.canvas.height / window.devicePixelRatio;

    ctx.save();
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = this.theme.background || "#1e1e1e";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);

    if (showGrid) {
      ctx.strokeStyle = this.theme.grid || "#333";
      ctx.lineWidth = 1;
      ctx.beginPath();

      const cols = Math.ceil(canvasWidth / (cellWidth * this.zoom));
      const rows = Math.ceil(canvasHeight / (cellHeight * this.zoom));

      for (let c = 0; c <= cols; c += 1) {
        const x = c * cellWidth;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rows * cellHeight);
      }

      for (let r = 0; r <= rows; r += 1) {
        const y = r * cellHeight;
        ctx.moveTo(0, y);
        ctx.lineTo(cols * cellWidth, y);
      }

      ctx.stroke();
    }

    ctx.fillStyle = this.theme.foreground || "#e0e0e0";
    const { rows, cols } = this.grid.getSize();

    this.grid.forEachCell(({ row, col, value }) => {
      if (row >= rows || col >= cols) return;
      const x = col * cellWidth + 2;
      const y = row * cellHeight + cellHeight - 4;
      ctx.fillText(value, x, y);
      const width = charWidth(value);
      if (width > 1) {
        for (let i = 1; i < width; i += 1) {
          ctx.clearRect(x + i * cellWidth - 1, y - cellHeight + 2, cellWidth, cellHeight);
        }
      }
    });

    // Draw selection highlight
    if (this.selection) {
      const { startRow, startCol, endRow, endCol } = this.selection;
      const x = startCol * cellWidth;
      const y = startRow * cellHeight;
      const w = (endCol - startCol + 1) * cellWidth;
      const h = (endRow - startRow + 1) * cellHeight;
      ctx.fillStyle = "rgba(100, 150, 255, 0.2)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(100, 150, 255, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);
    }

    // Draw drag preview overlay
    if (this.dragPreview) {
      const { grid: previewGrid, targetRow, targetCol, sourceSelection, copyMode } = this.dragPreview;
      // Dim the source region (move mode only)
      if (!copyMode) {
        const sx = sourceSelection.startCol * cellWidth;
        const sy = sourceSelection.startRow * cellHeight;
        const sw = (sourceSelection.endCol - sourceSelection.startCol + 1) * cellWidth;
        const sh = (sourceSelection.endRow - sourceSelection.startRow + 1) * cellHeight;
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(sx, sy, sw, sh);
      }
      // Draw preview characters at target position
      ctx.fillStyle = this.theme.foreground || "#e0e0e0";
      previewGrid.forEachCell(({ row, col, value }) => {
        const x = (targetCol + col) * cellWidth + 2;
        const y = (targetRow + row) * cellHeight + cellHeight - 4;
        ctx.fillText(value, x, y);
      });
      // Draw preview border
      const { rows: pRows, cols: pCols } = previewGrid.getSize();
      const px = targetCol * cellWidth;
      const py = targetRow * cellHeight;
      const pw = pCols * cellWidth;
      const ph = pRows * cellHeight;
      ctx.strokeStyle = copyMode ? "rgba(100, 255, 100, 0.7)" : "rgba(100, 150, 255, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(px, py, pw, ph);
      ctx.setLineDash([]);
    }

    // Draw text cursor (blinking line)
    if (this.textCursor) {
      const { row, col } = this.textCursor;
      const x = col * cellWidth;
      const y = row * cellHeight;
      ctx.fillStyle = this.theme.foreground || "#e0e0e0";
      ctx.fillRect(x, y, 2, cellHeight);
    }

    ctx.restore();
  }

  setSelection(sel: { startRow: number; startCol: number; endRow: number; endCol: number } | null) {
    this.selection = sel;
  }

  setDragPreview(preview: DragPreview | null) {
    this.dragPreview = preview;
  }

  setTextCursor(cursor: { row: number; col: number } | null) {
    this.textCursor = cursor;
  }

  private applyFont() {
    const { fontFamily, fontSize } = this.options;
    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.textBaseline = "alphabetic";
  }
}
