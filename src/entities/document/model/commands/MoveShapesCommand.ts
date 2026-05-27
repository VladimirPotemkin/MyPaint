import type { StoreApi } from "zustand";
import type { Command } from "../commands";
import type { EditorStore } from "../store";

export class MoveShapesCommand implements Command {
  readonly name = 'MoveShapes';
  private readonly moves: Array<{ id: string; fromX: number; fromY: number; toX: number; toY: number }>;

  constructor(moves: Array<{ id: string; fromX: number; fromY: number; toX: number; toY: number }>) {
    this.moves = moves;
  }
  execute(api: StoreApi<EditorStore>) { 
    this.moves.forEach(({id, toX, toY}) => {
        api.getState().updateShape(id, {x: toX, y: toY});
    });
    api.getState().setSelection(this.moves.map(({id}) => id));
  }
  undo(api: StoreApi<EditorStore>) {
    this.moves.forEach(({id, fromX, fromY}) => {
        api.getState().updateShape(id, {x: fromX, y: fromY});
    });
    api.getState().setSelection(this.moves.map(({id}) => id));
  }
}