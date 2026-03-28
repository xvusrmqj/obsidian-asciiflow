export type ToolId = "box" | "line" | "arrow" | "freeform" | "text" | "select";

export type ToolPointerState = {
  startRow: number;
  startCol: number;
  row: number;
  col: number;
  isDragging: boolean;
};
