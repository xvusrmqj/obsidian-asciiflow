import React, { useEffect, useRef, useState } from "react";
import { Grid } from "../model/Grid";
import { gridFromText, gridToText } from "../model/Serializer";
import { CanvasRenderer, CanvasRendererOptions } from "../renderer/CanvasRenderer";
import { InputHandler } from "../input/InputHandler";
import { ToolManager } from "../tools/ToolManager";
import { ToolId, ToolPointerState } from "../tools/ToolTypes";

export type AsciiFlowAppProps = {
  initialText: string;
  onSave: (text: string) => void;
  onCancel: () => void;
};

const tools = [
  { id: "box", label: "Box" },
  { id: "select", label: "Select" },
  { id: "arrow", label: "Arrow" },
  { id: "line", label: "Line" }
];

export function AsciiFlowApp({ initialText, onSave, onCancel }: AsciiFlowAppProps) {
  const [activeTool, setActiveTool] = useState<ToolId>("box");
  const [grid] = useState(() => gridFromText(initialText || "", 40, 120));
  const [cursor, setCursor] = useState({ row: 0, col: 0 });
  const [freeformChar, setFreeformChar] = useState("*");
  const [textBuffer, setTextBuffer] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const inputRef = useRef<InputHandler | null>(null);
  const toolManagerRef = useRef<ToolManager | null>(null);
  const activeToolRef = useRef<ToolId>(activeTool);
  const pointerStateRef = useRef<ToolPointerState>({
    startRow: 0,
    startCol: 0,
    row: 0,
    col: 0,
    isDragging: false
  });

  // Keep the ref in sync so pointer handlers always see the latest tool
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  // grid is mutated in-place by tools, so we can't rely on useMemo with a stable reference.
  // Always read the current grid state when Save is clicked.
  const getTextSnapshot = () => gridToText(grid);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const options: CanvasRendererOptions = {
      cellWidth: 12,
      cellHeight: 18,
      fontFamily: "var(--font-monospace)",
      fontSize: 14,
      showGrid: true
    };

    const renderer = new CanvasRenderer(
      canvas,
      grid,
      options,
      {
        background: getComputedStyle(document.body).getPropertyValue("--background-primary") || "#1e1e1e",
        foreground: getComputedStyle(document.body).getPropertyValue("--text-normal") || "#e0e0e0",
        grid: getComputedStyle(document.body).getPropertyValue("--background-modifier-border") || "#333"
      }
    );

    rendererRef.current = renderer;
    toolManagerRef.current = new ToolManager(grid, () => renderer.render());

    // Wire select tool highlight to renderer
    const selectTool = toolManagerRef.current.getSelectTool();
    selectTool.setRenderHighlight((sel) => {
      renderer.setSelection(sel);
    });
    selectTool.setClearHighlight(() => {
      renderer.setSelection(null);
    });

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      renderer.resize(rect.width, rect.height);
      renderer.render();
    };

    resize();
    window.addEventListener("resize", resize);

    inputRef.current = new InputHandler(
      canvas,
      { cellWidth: options.cellWidth, cellHeight: options.cellHeight },
      (row, col) => {
        setCursor({ row, col });
        const state = pointerStateRef.current;
        state.startRow = row;
        state.startCol = col;
        state.row = row;
        state.col = col;
        state.isDragging = true;
        toolManagerRef.current?.setActiveTool(activeToolRef.current);
        toolManagerRef.current?.handlePointerDown({ ...state });
      },
      (row, col) => {
        setCursor({ row, col });
        const state = pointerStateRef.current;
        state.row = row;
        state.col = col;
        toolManagerRef.current?.handlePointerMove({ ...state });
      },
      (row, col) => {
        const state = pointerStateRef.current;
        state.row = row;
        state.col = col;
        state.isDragging = false;
        toolManagerRef.current?.handlePointerUp({ ...state });
      }
    );

    const handleKey = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          toolManagerRef.current?.redo();
        } else {
          toolManagerRef.current?.undo();
        }
      }

      // Select tool shortcuts
      const sel = toolManagerRef.current?.getSelectTool();
      if (sel && sel.getSelection()) {
        if (event.key === "Delete" || event.key === "Backspace") {
          event.preventDefault();
          sel.deleteSelection({
            grid,
            setCell: (r, c, v) => grid.setCell(r, c, v),
            getCell: (r, c) => grid.getCell(r, c),
            render: () => renderer.render(),
          });
        }
        if (event.ctrlKey && event.key.toLowerCase() === "c") {
          event.preventDefault();
          sel.copy({
            grid,
            setCell: (r, c, v) => grid.setCell(r, c, v),
            getCell: (r, c) => grid.getCell(r, c),
            render: () => renderer.render(),
          });
        }
        if (event.ctrlKey && event.key.toLowerCase() === "x") {
          event.preventDefault();
          sel.cut({
            grid,
            setCell: (r, c, v) => grid.setCell(r, c, v),
            getCell: (r, c) => grid.getCell(r, c),
            render: () => renderer.render(),
          });
        }
      }
      if (event.ctrlKey && event.key.toLowerCase() === "v") {
        event.preventDefault();
        sel?.paste({
          grid,
          setCell: (r, c, v) => grid.setCell(r, c, v),
          getCell: (r, c) => grid.getCell(r, c),
          render: () => renderer.render(),
        });
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", handleKey);
      inputRef.current?.detach();
    };
  }, [grid]);

  useEffect(() => {
    toolManagerRef.current?.setFreeformChar(freeformChar);
  }, [freeformChar]);

  useEffect(() => {
    toolManagerRef.current?.setTextBuffer(textBuffer);
  }, [textBuffer]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.altKey) {
        const map: Record<string, ToolId> = {
          "1": "box",
          "2": "select",
          "3": "freeform",
          "4": "arrow",
          "5": "line",
          "6": "text"
        };
        const next = map[event.key];
        if (next) {
          event.preventDefault();
          setActiveTool(next);
          toolManagerRef.current?.setActiveTool(next);
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="asciiflow-app">
      <div className="asciiflow-toolbar">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={tool.id === activeTool ? "active" : undefined}
            onClick={() => setActiveTool(tool.id as ToolId)}
          >
            {tool.label}
          </button>
        ))}
        <button
          className={activeTool === "text" ? "active" : undefined}
          onClick={() => setActiveTool("text")}
        >
          Text
        </button>
        <input
          type="text"
          placeholder="Text"
          value={textBuffer}
          onChange={(event) => {
            setTextBuffer(event.target.value);
            toolManagerRef.current?.setTextBuffer(event.target.value);
          }}
          style={{ width: 160 }}
        />
        <button
          className={activeTool === "freeform" ? "active" : undefined}
          onClick={() => setActiveTool("freeform")}
        >
          Freeform
        </button>
        <input
          type="text"
          placeholder="Char"
          value={freeformChar}
          maxLength={1}
          onChange={(event) => {
            const next = event.target.value || "*";
            setFreeformChar(next);
            toolManagerRef.current?.setFreeformChar(next);
          }}
          style={{ width: 40, textAlign: "center" }}
        />
        <div style={{ flex: 1 }} />
        <button onClick={() => toolManagerRef.current?.undo()}>Undo</button>
        <button onClick={() => toolManagerRef.current?.redo()}>Redo</button>
        <button onClick={() => onSave(getTextSnapshot())}>Save</button>
        <button onClick={onCancel}>Cancel</button>
      </div>

      <div className="asciiflow-canvas-container">
        <canvas ref={canvasRef} />
      </div>

      <div className="asciiflow-status">
        Active tool: {activeTool} | Cursor: {cursor.row},{cursor.col} | Grid: {grid.getSize().rows}x{grid.getSize().cols}
      </div>
    </div>
  );
}
