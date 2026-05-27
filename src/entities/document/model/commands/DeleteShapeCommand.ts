import type { StoreApi } from "zustand";
import type { Shape } from "../types";
import type { EditorStore } from "../store";
import type { Command } from "../commands";

export class DeleteShapeCommand implements Command {
  readonly name = 'DeleteShape';
  private readonly id: string;
  private snapshot: Shape | null = null;

  constructor(id: string) {
    this.id = id;
  }

  execute(api: StoreApi<EditorStore>): void {
    this.snapshot = api.getState().document.shapes[this.id];
    api.getState().removeShape(this.id);
    api.getState().clearSelection();
  }

  undo(api: StoreApi<EditorStore>): void {
    if (this.snapshot) {
      api.getState().addShape(this.snapshot);
      api.getState().setSelection([this.snapshot.id]);
    }
    
  }
}
