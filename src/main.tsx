import { MarkdownPostProcessorContext, Modal, Plugin } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { AsciiFlowApp } from "./ui/AsciiFlowApp";

class AsciiFlowModal extends Modal {
  private root: Root | null = null;
  private initialText: string;
  private onSave: (text: string) => Promise<void>;

  constructor(app: Plugin["app"], initialText: string, onSave: (text: string) => Promise<void>) {
    super(app);
    this.initialText = initialText;
    this.onSave = onSave;
  }

  onOpen() {
    this.modalEl.addClass("asciiflow-modal");
    const content = this.contentEl;
    this.root = createRoot(content);
    this.root.render(
      <AsciiFlowApp
        initialText={this.initialText}
        onSave={(text) => {
          this.onSave(text).then(() => this.close());
        }}
        onCancel={() => this.close()}
      />
    );
  }

  onClose() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}

export default class AsciiFlowPlugin extends Plugin {
  async onload() {
    this.registerMarkdownCodeBlockProcessor(
      "asciiflow",
      (source, el, ctx) => this.renderAsciiFlowBlock(source, el, ctx)
    );
  }

  private renderAsciiFlowBlock(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    const container = el.createDiv({ cls: "asciiflow-preview" });
    const pre = container.createEl("pre");
    pre.setText(source || "");

    const button = container.createEl("button", {
      cls: "asciiflow-edit-button",
      text: "Edit"
    });

    button.addEventListener("click", () => {
      const modal = new AsciiFlowModal(this.app, source, async (updated) => {
        await this.replaceCodeBlockContent(ctx, container, updated);
      });
      modal.open();
    });
  }

  private async replaceCodeBlockContent(
    ctx: MarkdownPostProcessorContext,
    blockEl: HTMLElement,
    newContent: string
  ): Promise<void> {
    const file = ctx.sourcePath ? this.app.vault.getAbstractFileByPath(ctx.sourcePath) : null;
    if (!file || !(file as any).path) {
      console.warn("AsciiFlow: no file found for path", ctx.sourcePath);
      return;
    }

    try {
      // Read section info BEFORE any async operation to avoid stale context
      const section = ctx.getSectionInfo(blockEl);
      const start = section?.lineStart ?? -1;
      const end = section?.lineEnd ?? -1;

      if (start < 0 || end < 0) {
        console.warn("AsciiFlow: could not get section info", { start, end });
        return;
      }

      const text = await this.app.vault.read(file as any);
      const lines = text.split("\n");
      const before = lines.slice(0, start);
      const after = lines.slice(end + 1);

      const replacement = ["```asciiflow", newContent, "```"];
      const updated = [...before, ...replacement, ...after].join("\n");
      await this.app.vault.modify(file as any, updated);
    } catch (err) {
      console.error("AsciiFlow: save failed", err);
    }
  }
}
