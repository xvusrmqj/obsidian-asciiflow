import { Grid } from "../model/Grid";

export class HistoryManager {
  private past: Grid[] = [];
  private future: Grid[] = [];
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  push(state: Grid) {
    this.past.push(state.clone());
    if (this.past.length > this.maxSize) {
      this.past.shift();
    }
    this.future = [];
  }

  undo(current: Grid): Grid | null {
    if (this.past.length === 0) return null;
    const prev = this.past.pop();
    if (!prev) return null;
    this.future.push(current.clone());
    return prev;
  }

  redo(current: Grid): Grid | null {
    if (this.future.length === 0) return null;
    const next = this.future.pop();
    if (!next) return null;
    this.past.push(current.clone());
    return next;
  }

  clear() {
    this.past = [];
    this.future = [];
  }
}
