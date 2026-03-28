import { Grid } from "../model/Grid";

export type ToolContext = {
  grid: Grid;
  setCell: (row: number, col: number, value: string) => void;
  getCell: (row: number, col: number) => string;
  render: () => void;
};
