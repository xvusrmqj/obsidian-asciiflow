import { Grid } from "../model/Grid";
import { ITool } from "./ITool";
import { ToolContext } from "./ToolContext";
import { ToolPointerState } from "./ToolTypes";

export class LineTool implements ITool {
  id = "line";
  private baseGrid: Grid | null = null;

  onPointerDown(state: ToolPointerState, ctx: ToolContext) {
    this.baseGrid = ctx.grid.clone();
    this.drawLine(state, ctx);
  }

  onPointerMove(state: ToolPointerState, ctx: ToolContext) {
    if (!state.isDragging) return;
    this.drawLine(state, ctx);
  }

  onPointerUp(state: ToolPointerState, ctx: ToolContext) {
    this.drawLine(state, ctx);
    this.baseGrid = null;
  }

  private drawLine(state: ToolPointerState, ctx: ToolContext) {
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
      ctx.render();
      return;
    }

    if (startCol === endCol) {
      const min = Math.min(startRow, endRow);
      const max = Math.max(startRow, endRow);
      for (let r = min; r <= max; r += 1) {
        ctx.setCell(r, startCol, "│");
      }
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
    ctx.render();
  }
}
