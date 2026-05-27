import type { StoreApi } from 'zustand';
import type { EditorStore } from './store';

export interface Command {
  readonly name: string;
  execute(api: StoreApi<EditorStore>): void;
  undo(api: StoreApi<EditorStore>): void;
}

// Этапы 0–8: просто выполняем. Этап 9: добавим past/future стек поверх.
export function applyCommand(cmd: Command, api: StoreApi<EditorStore>): void {
  cmd.execute(api);
}
