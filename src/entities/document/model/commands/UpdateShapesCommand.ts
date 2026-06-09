import type { StoreApi } from 'zustand';
import type { Command } from '../commands';
import type { EditorStore } from '../store';
import type { Shape } from '../types';

type StylePatch = Partial<Pick<Shape, 'fill' | 'stroke' | 'strokeWidth' | 'opacity'>>;

type UpdateEntry = {
  id: string;
  before: StylePatch;
  after: StylePatch;
};

export class UpdateShapesCommand implements Command {
  readonly name = 'UpdateShapes';
  private readonly entries: UpdateEntry[];
  constructor(entries: UpdateEntry[]) {
    this.entries = entries;
  }

  execute(api: StoreApi<EditorStore>): void {
    this.entries.forEach(({ id, after }) => {
      api.getState().updateShape(id, after);
    });
  }
  undo(api: StoreApi<EditorStore>): void {
    this.entries.forEach(({ id, before }) => {
      api.getState().updateShape(id, before);
    });
  }
}
