import { Grid } from "../model/Grid";
import { ITool } from "./ITool";
import { ToolContext } from "./ToolContext";
import { ToolPointerState } from "./ToolTypes";

export class BoxTool implements ITool {
  id = "box";
  private baseGrid: Grid | null = null;

  onPointerDown(state: ToolPointerState, ctx: ToolContext) {
    this.baseGrid = ctx.grid.clone();
    this.drawBox(state, ctx);
  }

  onPointerMove(state: ToolPointerState, ctx: ToolContext) {
    if (!state.isDragging) return;
    this.drawBox(state, ctx);
  }

  onPointerUp(state: ToolPointerState, ctx: ToolContext) {
    this.drawBox(state, ctx);
    this.baseGrid = null;
  }

  private drawBox(state: ToolPointerState, ctx: ToolContext) {
    if (this.baseGrid) {
      ctx.grid.loadFromGrid(this.baseGrid);
    }
    const startRow = Math.min(state.startRow, state.row);
    const endRow = Math.max(state.startRow, state.row);
    const startCol = Math.min(state.startCol, state.col);
    const endCol = Math.max(state.startCol, state.col);

    for (let c = startCol + 1; c < endCol; c += 1) {
      ctx.setCell(startRow, c, "─");
      ctx.setCell(endRow, c, "─");
    }

    for (let r = startRow + 1; r < endRow; r += 1) {
      ctx.setCell(r, startCol, "│");
      ctx.setCell(r, endCol, "│");
    }

    ctx.setCell(startRow, startCol, "┌");
    ctx.setCell(startRow, endCol, "┐");
    ctx.setCell(endRow, startCol, "└");
    ctx.setCell(endRow, endCol, "┘");

    ctx.render();
  }
}
