import { screenToCell } from "./CoordinateMapper";

export type InputHandlerOptions = {
  cellWidth: number;
  cellHeight: number;
};

export type InputState = {
  pointerDown: boolean;
  lastRow: number;
  lastCol: number;
};

export class InputHandler {
  private canvas: HTMLCanvasElement;
  private options: InputHandlerOptions;
  private onCellClick: (row: number, col: number, ctrlKey: boolean) => void;
  private onCellDrag: (row: number, col: number, ctrlKey: boolean) => void;
  private onPointerUp: (row: number, col: number, ctrlKey: boolean) => void;
  private state: InputState = { pointerDown: false, lastRow: -1, lastCol: -1 };

  constructor(
    canvas: HTMLCanvasElement,
    options: InputHandlerOptions,
    onCellClick: (row: number, col: number, ctrlKey: boolean) => void,
    onCellDrag: (row: number, col: number, ctrlKey: boolean) => void,
    onPointerUp: (row: number, col: number, ctrlKey: boolean) => void
  ) {
    this.canvas = canvas;
    this.options = options;
    this.onCellClick = onCellClick;
    this.onCellDrag = onCellDrag;
    this.onPointerUp = onPointerUp;

    this.attach();
  }

  updateOptions(options: InputHandlerOptions) {
    this.options = options;
  }

  detach() {
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerup", this.handlePointerUp);
  }

  private attach() {
    this.canvas.addEventListener("pointerdown", this.handlePointerDown);
    this.canvas.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerup", this.handlePointerUp);
  }

  private handlePointerDown = (event: PointerEvent) => {
    this.canvas.setPointerCapture?.(event.pointerId);
    this.state.pointerDown = true;
    const { row, col } = this.getCellFromEvent(event);
    this.state.lastRow = row;
    this.state.lastCol = col;
    this.onCellClick(row, col, event.ctrlKey);
  };

  private handlePointerMove = (event: PointerEvent) => {
    if (!this.state.pointerDown) return;
    const { row, col } = this.getCellFromEvent(event);
    if (row === this.state.lastRow && col === this.state.lastCol) return;
    this.state.lastRow = row;
    this.state.lastCol = col;
    this.onCellDrag(row, col, event.ctrlKey);
  };

  private handlePointerUp = (event: PointerEvent) => {
    if (!this.state.pointerDown) return;
    this.state.pointerDown = false;
    this.onPointerUp(this.state.lastRow, this.state.lastCol, event.ctrlKey);
  };

  private getCellFromEvent(event: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return screenToCell(event.clientX - rect.left, event.clientY - rect.top, {
      cellWidth: this.options.cellWidth,
      cellHeight: this.options.cellHeight,
      panX: 0,
      panY: 0,
      zoom: 1
    });
  }
}
