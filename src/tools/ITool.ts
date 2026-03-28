import { ToolPointerState } from "./ToolTypes";
import { ToolContext } from "./ToolContext";

export interface ITool {
  id: string;
  onPointerDown(state: ToolPointerState, ctx: ToolContext): void;
  onPointerMove(state: ToolPointerState, ctx: ToolContext): void;
  onPointerUp(state: ToolPointerState, ctx: ToolContext): void;
}
