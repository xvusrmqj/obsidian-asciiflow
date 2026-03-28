import { Grid } from "./Grid";
import { charWidth } from "./CharWidth";

export function gridFromText(text: string, minRows = 40, minCols = 120): Grid {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const rows = Math.max(lines.length, minRows, 1);
  const cols = Math.max(...lines.map((line) => line.length), minCols, 1);
  const grid = new Grid(rows, cols);

  lines.forEach((line, row) => {
    let col = 0;
    for (const ch of Array.from(line)) {
      if (ch !== " ") {
        grid.setCell(row, col, ch);
      }
      col += charWidth(ch);
    }
  });

  return grid;
}

export function gridToText(grid: Grid): string {
  const { rows, cols } = grid.getSize();
  const lines: string[] = [];

  for (let r = 0; r < rows; r += 1) {
    let line = "";
    for (let c = 0; c < cols; c += 1) {
      const ch = grid.getCell(r, c) || " ";
      line += ch;
    }
    lines.push(line.replace(/\s+$/g, ""));
  }

  return lines.join("\n").replace(/\n+$/g, "");
}
