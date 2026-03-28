import { Grid } from "../model/Grid";
import { ITool } from "./ITool";
import { ToolContext } from "./ToolContext";
import { ToolPointerState } from "./ToolTypes";

export type Selection = {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
};

export class SelectTool implements ITool {
  id = "select";
  private selection: Selection | null = null;
  private clipboard: Grid | null = null;
  private renderHighlight: ((sel: Selection) => void) | null = null;
  private clearHighlight: (() => void) | null = null;

  /** Register a callback to draw the selection highlight overlay. */
  setRenderHighlight(fn: (sel: Selection) => void) {
    this.renderHighlight = fn;
  }

  setClearHighlight(fn: () => void) {
    this.clearHighlight = fn;
  }

  getSelection(): Selection | null {
    return this.selection;
  }

  onPointerDown(state: ToolPointerState, ctx: ToolContext) {
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
    this.selection.endRow = state.row;
    this.selection.endCol = state.col;
    this.drawHighlight();
    ctx.render();
  }

  onPointerUp(state: ToolPointerState, ctx: ToolContext) {
    if (!this.selection) return;
    this.selection.endRow = state.row;
    this.selection.endCol = state.col;
    this.drawHighlight();
    ctx.render();
  }

  /** Copy the selected region into the internal clipboard. */
  copy(ctx: ToolContext) {
    if (!this.selection) return;
    const { startRow, startCol, endRow, endCol } = this.normalized();
    const rows = endRow - startRow + 1;
    const cols = endCol - startCol + 1;
    this.clipboard = new Grid(rows, cols);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = ctx.getCell(startRow + r, startCol + c);
        if (val) this.clipboard.setCell(r, c, val);
      }
    }
  }

  /** Copy then clear the selected region. */
  cut(ctx: ToolContext) {
    this.copy(ctx);
    this.deleteSelection(ctx);
  }

  /** Paste the clipboard at the current selection start (or 0,0). */
  paste(ctx: ToolContext) {
    if (!this.clipboard) return;
    const { rows, cols } = this.clipboard.getSize();
    const targetRow = this.selection ? this.normalized().startRow : 0;
    const targetCol = this.selection ? this.normalized().startCol : 0;
    this.clipboard.forEachCell(({ row, col, value }) => {
      ctx.setCell(targetRow + row, targetCol + col, value);
    });
    ctx.render();
  }

  /** Clear all cells inside the selection. */
  deleteSelection(ctx: ToolContext) {
    if (!this.selection) return;
    const { startRow, startCol, endRow, endCol } = this.normalized();
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        ctx.setCell(r, c, "");
      }
    }
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
}
