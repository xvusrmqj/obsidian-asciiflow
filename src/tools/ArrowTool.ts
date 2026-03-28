import { Grid } from "../model/Grid";
import { ITool } from "./ITool";
import { ToolContext } from "./ToolContext";
import { ToolPointerState } from "./ToolTypes";

export class ArrowTool implements ITool {
  id = "arrow";
  private baseGrid: Grid | null = null;

  onPointerDown(state: ToolPointerState, ctx: ToolContext) {
    this.baseGrid = ctx.grid.clone();
    this.drawArrow(state, ctx);
  }

  onPointerMove(state: ToolPointerState, ctx: ToolContext) {
    if (!state.isDragging) return;
    this.drawArrow(state, ctx);
  }

  onPointerUp(state: ToolPointerState, ctx: ToolContext) {
    this.drawArrow(state, ctx);
    this.baseGrid = null;
  }

  private drawArrow(state: ToolPointerState, ctx: ToolContext) {
    if (this.baseGrid) {
      ctx.grid.loadFromGrid(this.baseGrid);
    }
    const startRow = state.startRow;
    const startCol = state.startCol;
    const endRow = state.row;
    const endCol = state.col;

    if (startRow === endRow) {
      const min = Math.min(startCol, endCol);
      const max = Math.max(startCol, endCol);
      for (let c = min; c <= max; c += 1) {
        ctx.setCell(startRow, c, "─");
      }
      ctx.setCell(startRow, endCol, endCol > startCol ? "►" : "◄");
      ctx.render();
      return;
    }

    if (startCol === endCol) {
      const min = Math.min(startRow, endRow);
      const max = Math.max(startRow, endRow);
      for (let r = min; r <= max; r += 1) {
        ctx.setCell(r, startCol, "│");
      }
      ctx.setCell(endRow, startCol, endRow > startRow ? "▼" : "▲");
      ctx.render();
      return;
    }

    const horizontalFirst =
      Math.abs(endCol - startCol) >= Math.abs(endRow - startRow);

    if (horizontalFirst) {
      const minCol = Math.min(startCol, endCol);
      const maxCol = Math.max(startCol, endCol);
      for (let c = minCol; c <= maxCol; c += 1) {
        ctx.setCell(startRow, c, "─");
      }
      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);
      for (let r = minRow; r <= maxRow; r += 1) {
        ctx.setCell(r, endCol, "│");
      }

      const corner =
        endCol > startCol && endRow > startRow
          ? "┐"
          : endCol > startCol && endRow < startRow
          ? "┘"
          : endCol < startCol && endRow > startRow
          ? "┌"
          : "└";
      ctx.setCell(startRow, endCol, corner);
      ctx.setCell(endRow, endCol, endRow > startRow ? "▼" : "▲");
      ctx.render();
      return;
    }

    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    for (let r = minRow; r <= maxRow; r += 1) {
      ctx.setCell(r, startCol, "│");
    }
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    for (let c = minCol; c <= maxCol; c += 1) {
      ctx.setCell(endRow, c, "─");
    }

    const corner =
      endRow > startRow && endCol > startCol
        ? "└"
        : endRow > startRow && endCol < startCol
        ? "┘"
        : endRow < startRow && endCol > startCol
        ? "┌"
        : "┐";
    ctx.setCell(endRow, startCol, corner);
    ctx.setCell(endRow, endCol, endCol > startCol ? "►" : "◄");
    ctx.render();
  }
}
