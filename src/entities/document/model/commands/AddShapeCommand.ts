import type { Command } from '../commands';
import type { Shape } from '../types';
import type { StoreApi } from 'zustand';
import type { EditorStore } from '../store';

export class AddShapeCommand implements Command {
  readonly name = 'AddShape';
  private readonly shape: Shape;

  constructor(shape: Shape) {
    this.shape = shape;
  }

  execute(api: StoreApi<EditorStore>): void {
    api.getState().addShape(this.shape);
    api.getState().setSelection([this.shape.id]);
  }

  undo(api: StoreApi<EditorStore>): void {
    api.getState().removeShape(this.shape.id);
  }
}
