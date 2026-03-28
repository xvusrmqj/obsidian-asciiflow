import { Grid } from "../model/Grid";
import { ToolContext } from "./ToolContext";
import { ITool } from "./ITool";
import { ArrowTool } from "./ArrowTool";
import { BoxTool } from "./BoxTool";
import { FreeformTool } from "./FreeformTool";
import { HistoryManager } from "./HistoryManager";
import { LineTool } from "./LineTool";
import { SelectTool } from "./SelectTool";
import { TextTool } from "./TextTool";
import { ToolId, ToolPointerState } from "./ToolTypes";

export class ToolManager {
  private tools: Map<ToolId, ITool> = new Map();
  private activeTool: ITool;
  private ctx: ToolContext;
  private history = new HistoryManager();

  constructor(grid: Grid, render: () => void) {
    this.ctx = {
      grid,
      setCell: (row, col, value) => grid.setCell(row, col, value),
      getCell: (row, col) => grid.getCell(row, col),
      render
    };

    this.tools.set("box", new BoxTool());
    this.tools.set("line", new LineTool());
    this.tools.set("arrow", new ArrowTool());
    this.tools.set("freeform", new FreeformTool());
    this.tools.set("text", new TextTool());
    this.tools.set("select", new SelectTool());

    this.activeTool = this.tools.get("box")!;
  }

  getSelectTool(): SelectTool {
    return this.tools.get("select") as SelectTool;
  }

  setActiveTool(id: ToolId) {
    const tool = this.tools.get(id);
    if (tool) this.activeTool = tool;
  }

  getActiveToolId(): ToolId {
    return this.activeTool.id as ToolId;
  }

  handlePointerDown(state: ToolPointerState) {
    this.history.push(this.ctx.grid);
    this.activeTool.onPointerDown(state, this.ctx);
  }

  handlePointerMove(state: ToolPointerState) {
    this.activeTool.onPointerMove(state, this.ctx);
  }

  handlePointerUp(state: ToolPointerState) {
    this.activeTool.onPointerUp(state, this.ctx);
  }

  undo() {
    const prev = this.history.undo(this.ctx.grid);
    if (prev) {
      this.ctx.grid.loadFromGrid(prev);
      this.ctx.render();
    }
  }

  redo() {
    const next = this.history.redo(this.ctx.grid);
    if (next) {
      this.ctx.grid.loadFromGrid(next);
      this.ctx.render();
    }
  }

  setFreeformChar(ch: string) {
    const tool = this.tools.get("freeform") as FreeformTool | undefined;
    tool?.setChar(ch);
  }

  setTextBuffer(text: string) {
    const tool = this.tools.get("text") as TextTool | undefined;
    tool?.setBuffer(text);
  }
}
