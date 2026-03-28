import { ITool } from "./ITool";
import { ToolContext } from "./ToolContext";
import { ToolPointerState } from "./ToolTypes";

export class TextTool implements ITool {
  id = "text";
  private buffer = "";

  onPointerDown(state: ToolPointerState, ctx: ToolContext) {
    if (this.buffer.length === 0) return;
    for (let i = 0; i < this.buffer.length; i += 1) {
      ctx.setCell(state.row, state.col + i, this.buffer[i]);
    }
    this.buffer = "";
    ctx.render();
  }

  onPointerMove(): void {}

  onPointerUp(): void {}

  setBuffer(text: string) {
    this.buffer = text;
  }
}
