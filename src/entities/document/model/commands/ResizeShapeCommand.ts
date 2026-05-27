import type { Shape } from '../types';
import type { Command } from "../commands";
import type { StoreApi } from "zustand";
import type { EditorStore } from "../store";

type Sizes = Pick<Shape, 'x' | 'y' | 'width' | 'height'>;

export class ResizeShapeCommand implements Command {
  readonly name = 'ResizeShape';
  private readonly id: string
  private readonly original: Sizes  
  private readonly next: Sizes
  constructor(
  id: string,
  original: Sizes,
  next: Sizes,
) {
  this.id = id;
  this.original = original;
  this.next = next;
}
execute(api: StoreApi<EditorStore>) {
    api.getState().updateShape(this.id, this.next);
}
undo(api: StoreApi<EditorStore>) {
    api.getState().updateShape(this.id, this.original);
}
}