import type { StoreApi } from 'zustand';
import type { Command } from '../commands';
import type { EditorStore } from '../store';

type RotateEntry = {
  id: string;
  fromRotation: number;
  toRotation: number;
  fromX: number;
  toX: number;
  fromY: number;
  toY: number;
};

export class RotateShapesCommand implements Command {
  readonly name = 'RotateShapes';
  private readonly entries: RotateEntry[];

  constructor(entries: RotateEntry[]) {
    this.entries = entries;
  }

  execute(api: StoreApi<EditorStore>) {
    this.entries.forEach(({ id, toRotation, toX, toY }) => {
      api.getState().updateShape(id, { rotation: toRotation, x: toX, y: toY });
    });
    api.getState().setSelection(this.entries.map(({ id }) => id));
  }

  undo(api: StoreApi<EditorStore>) {
    this.entries.forEach(({ id, fromRotation, fromX, fromY }) => {
      api.getState().updateShape(id, { rotation: fromRotation, x: fromX, y: fromY });
    });
    api.getState().setSelection(this.entries.map(({ id }) => id));
  }
}
