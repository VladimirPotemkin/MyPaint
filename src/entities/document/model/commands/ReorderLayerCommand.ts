import type { StoreApi } from 'zustand';
import type { Command } from '../commands';
import type { EditorStore } from '../store';

export class ReorderLayerCommand implements Command {
  readonly name = 'ReorderLayer';
  private readonly fromIds: string[];
  private readonly toIds: string[];

  constructor(fromIds: string[], toIds: string[]) {
    this.fromIds = fromIds;
    this.toIds = toIds;
  }

  execute(api: StoreApi<EditorStore>): void {
    api.getState().setRootChildIds(this.toIds);
  }

  undo(api: StoreApi<EditorStore>): void {
    api.getState().setRootChildIds(this.fromIds);
  }
}
