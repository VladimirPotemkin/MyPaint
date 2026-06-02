import type { StoreApi } from 'zustand';
import type { EditorStore } from './store';
import { HISTORY_LIMIT } from '@/shared/config/constants';

export interface Command {
  readonly name: string;
  execute(api: StoreApi<EditorStore>): void;
  undo(api: StoreApi<EditorStore>): void;
}

export function applyCommand(cmd: Command, api: StoreApi<EditorStore>): void {
  cmd.execute(api);
  const { past } = api.getState();
  const newPast = [...past, cmd].slice(-HISTORY_LIMIT);
  api.setState({ past: newPast, future: [], canUndo: true, canRedo: false });
}
