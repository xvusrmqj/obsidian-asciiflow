export type GridCellKey = string;

export type GridCell = {
  row: number;
  col: number;
  value: string;
};

export type GridSize = {
  rows: number;
  cols: number;
};

export class Grid {
  private cells: Map<GridCellKey, string> = new Map();
  private size: GridSize;

  constructor(rows = 40, cols = 120) {
    this.size = { rows, cols };
  }

  static key(row: number, col: number) {
    return `${row}:${col}`;
  }

  getSize(): GridSize {
    return { ...this.size };
  }

  resize(rows: number, cols: number) {
    this.size = { rows, cols };
    for (const key of this.cells.keys()) {
      const [r, c] = key.split(":").map(Number);
      if (r >= rows || c >= cols) {
        this.cells.delete(key);
      }
    }
  }

  clear() {
    this.cells.clear();
  }

  getCell(row: number, col: number): string {
    return this.cells.get(Grid.key(row, col)) ?? "";
  }

  setCell(row: number, col: number, value: string) {
    if (row < 0 || col < 0) return;
    if (row >= this.size.rows || col >= this.size.cols) return;
    const key = Grid.key(row, col);
    if (!value || value === " ") {
      this.cells.delete(key);
      return;
    }
    this.cells.set(key, value);
  }

  forEachCell(callback: (cell: GridCell) => void) {
    for (const [key, value] of this.cells.entries()) {
      const [row, col] = key.split(":").map(Number);
      callback({ row, col, value });
    }
  }

  clone(): Grid {
    const cloned = new Grid(this.size.rows, this.size.cols);
    for (const [key, value] of this.cells.entries()) {
      cloned.cells.set(key, value);
    }
    return cloned;
  }

  loadFromGrid(other: Grid) {
    const { rows, cols } = other.getSize();
    this.size = { rows, cols };
    this.cells.clear();
    other.forEachCell(({ row, col, value }) => {
      this.setCell(row, col, value);
    });
  }
}
