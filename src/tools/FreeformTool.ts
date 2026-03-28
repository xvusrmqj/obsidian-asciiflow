import { ITool } from "./ITool";
import { ToolContext } from "./ToolContext";
import { ToolPointerState } from "./ToolTypes";

export class FreeformTool implements ITool {
  id = "freeform";
  private currentChar = "*";

  setChar(ch: string) {
    this.currentChar = ch;
  }

  onPointerDown(state: ToolPointerState, ctx: ToolContext) {
    ctx.setCell(state.row, state.col, this.currentChar);
    ctx.render();
  }

  onPointerMove(state: ToolPointerState, ctx: ToolContext) {
    if (!state.isDragging) return;
    ctx.setCell(state.row, state.col, this.currentChar);
    ctx.render();
  }

  onPointerUp(state: ToolPointerState, ctx: ToolContext) {
    ctx.setCell(state.row, state.col, this.currentChar);
    ctx.render();
  }
}
