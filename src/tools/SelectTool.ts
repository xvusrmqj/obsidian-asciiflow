import { Grid } from "../model/Grid";
import { gridFromText, gridToText } from "../model/Serializer";
import { ITool } from "./ITool";
import { ToolContext } from "./ToolContext";
import { ToolPointerState } from "./ToolTypes";

export type Selection = {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
};

export type DragPreview = {
  grid: Grid;
  targetRow: number;
  targetCol: number;
  sourceSelection: Selection;
  copyMode: boolean;
};

export class SelectTool implements ITool {
  id = "select";
  private selection: Selection | null = null;
  private renderHighlight: ((sel: Selection) => void) | null = null;
  private clearHighlight: (() => void) | null = null;
  private renderDragPreview: ((preview: DragPreview | null) => void) | null = null;
  private draggingSelection = false;
  private draggingMoved = false;
  private dragOffset: { row: number; col: number } | null = null;
  private dragSourceSelection: Selection | null = null;
  private dragClipboard: Grid | null = null;
  private dragCopyMode = false;

  /** Register a callback to draw the selection highlight overlay. */
  setRenderHighlight(fn: (sel: Selection) => void) {
    this.renderHighlight = fn;
  }

  setClearHighlight(fn: () => void) {
    this.clearHighlight = fn;
  }

  /** Register a callback to draw the drag preview overlay. */
  setRenderDragPreview(fn: (preview: DragPreview | null) => void) {
    this.renderDragPreview = fn;
  }

  getSelection(): Selection | null {
    return this.selection;
  }

  onPointerDown(state: ToolPointerState, ctx: ToolContext) {
    if (this.selection && this.isInsideSelection(state.row, state.col, this.normalized())) {
      this.draggingSelection = true;
      this.draggingMoved = false;
      this.dragCopyMode = state.ctrlKey;
      const normalized = this.normalized();
      this.dragSourceSelection = normalized;
      this.dragOffset = {
        row: state.row - normalized.startRow,
        col: state.col - normalized.startCol,
      };
      this.dragClipboard = this.captureSelection(ctx, normalized);
      this.drawHighlight();
      ctx.render();
      return;
    }

    this.draggingSelection = false;
    this.draggingMoved = false;
    this.dragOffset = null;
    this.dragSourceSelection = null;
    this.dragClipboard = null;
    this.dragCopyMode = false;

    this.selection = {
      startRow: state.row,
      startCol: state.col,
      endRow: state.row,
      endCol: state.col,
    };
    this.drawHighlight();
    ctx.render();
  }

  onPointerMove(state: ToolPointerState, ctx: ToolContext) {
    if (!state.isDragging) return;
    if (!this.selection) return;
    if (this.draggingSelection && this.dragOffset) {
      // Update copy mode dynamically based on current ctrlKey state
      this.dragCopyMode = state.ctrlKey;
      this.draggingMoved = true;
      const size = this.getSelectionSize(this.selection);
      const startRow = state.row - this.dragOffset.row;
      const startCol = state.col - this.dragOffset.col;
      this.selection.startRow = startRow;
      this.selection.startCol = startCol;
      this.selection.endRow = startRow + size.rows - 1;
      this.selection.endCol = startCol + size.cols - 1;
      // Show drag preview via renderer overlay (no grid mutation)
      this.showDragPreview();
      this.drawHighlight();
      ctx.render();
      return;
    }

    this.selection.endRow = state.row;
    this.selection.endCol = state.col;
    this.drawHighlight();
    ctx.render();
  }

  onPointerUp(state: ToolPointerState, ctx: ToolContext) {
    // Clear drag preview overlay
    this.clearDragPreview();

    if (!this.selection) return;
    if (this.draggingSelection && this.dragClipboard && this.dragSourceSelection) {
      if (!this.draggingMoved) {
        this.resetDragState();
        this.drawHighlight();
        ctx.render();
        return;
      }
      const target = this.normalized();
      if (!this.dragCopyMode) {
        this.clearRegion(ctx, this.dragSourceSelection);
      }
      this.pasteGrid(ctx, this.dragClipboard, target.startRow, target.startCol);
      this.resetDragState();
      this.drawHighlight();
      ctx.render();
      return;
    }

    this.selection.endRow = state.row;
    this.selection.endCol = state.col;
    this.drawHighlight();
    ctx.render();
  }

  /** Copy the selected region and return the text for system clipboard. */
  copy(ctx: ToolContext): string | null {
    if (!this.selection) return null;
    const captured = this.captureSelection(ctx, this.normalized());
    return gridToText(captured);
  }

  /** Copy then clear the selected region, return text for system clipboard. */
  cut(ctx: ToolContext): string | null {
    const text = this.copy(ctx);
    if (text !== null) {
      this.deleteSelection(ctx);
    }
    return text;
  }

  /** Paste text at the current selection start (or 0,0). */
  paste(text: string, ctx: ToolContext) {
    const externalGrid = gridFromText(text, 1, 1);
    const targetRow = this.selection ? this.normalized().startRow : 0;
    const targetCol = this.selection ? this.normalized().startCol : 0;
    externalGrid.forEachCell(({ row, col, value }) => {
      ctx.setCell(targetRow + row, targetCol + col, value);
    });
    ctx.render();
  }

  /** Clear all cells inside the selection. */
  deleteSelection(ctx: ToolContext) {
    if (!this.selection) return;
    this.clearRegion(ctx, this.normalized());
    ctx.render();
  }

  /** Return the selection with start <= end in both axes. */
  normalized(): Selection {
    const s = this.selection!;
    return {
      startRow: Math.min(s.startRow, s.endRow),
      startCol: Math.min(s.startCol, s.endCol),
      endRow: Math.max(s.startRow, s.endRow),
      endCol: Math.max(s.startCol, s.endCol),
    };
  }

  clearSelection() {
    this.selection = null;
    if (this.clearHighlight) this.clearHighlight();
  }

  private drawHighlight() {
    if (this.selection && this.renderHighlight) {
      this.renderHighlight(this.normalized());
    }
  }

  private showDragPreview() {
    if (!this.dragClipboard || !this.dragSourceSelection || !this.renderDragPreview) return;
    const target = this.normalized();
    this.renderDragPreview({
      grid: this.dragClipboard,
      targetRow: target.startRow,
      targetCol: target.startCol,
      sourceSelection: this.dragSourceSelection,
      copyMode: this.dragCopyMode,
    });
  }

  private clearDragPreview() {
    if (this.renderDragPreview) {
      this.renderDragPreview(null);
    }
  }

  private resetDragState() {
    this.draggingSelection = false;
    this.draggingMoved = false;
    this.dragOffset = null;
    this.dragSourceSelection = null;
    this.dragClipboard = null;
    this.dragCopyMode = false;
  }

  private isInsideSelection(row: number, col: number, sel: Selection) {
    return row >= sel.startRow && row <= sel.endRow && col >= sel.startCol && col <= sel.endCol;
  }

  private getSelectionSize(sel: Selection) {
    const normalized = {
      startRow: Math.min(sel.startRow, sel.endRow),
      startCol: Math.min(sel.startCol, sel.endCol),
      endRow: Math.max(sel.startRow, sel.endRow),
      endCol: Math.max(sel.startCol, sel.endCol),
    };
    return {
      rows: normalized.endRow - normalized.startRow + 1,
      cols: normalized.endCol - normalized.startCol + 1,
    };
  }

  private captureSelection(ctx: ToolContext, sel: Selection) {
    const { startRow, startCol, endRow, endCol } = sel;
    const rows = endRow - startRow + 1;
    const cols = endCol - startCol + 1;
    const grid = new Grid(rows, cols);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = ctx.getCell(startRow + r, startCol + c);
        if (val) grid.setCell(r, c, val);
      }
    }
    return grid;
  }

  private clearRegion(ctx: ToolContext, sel: Selection) {
    const { startRow, startCol, endRow, endCol } = sel;
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        ctx.setCell(r, c, "");
      }
    }
  }

  private pasteGrid(ctx: ToolContext, grid: Grid, targetRow: number, targetCol: number) {
    grid.forEachCell(({ row, col, value }) => {
      ctx.setCell(targetRow + row, targetCol + col, value);
    });
  }
}
