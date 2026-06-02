import { applyCommand } from '@/entities/document/model/commands';
import { GroupShapesCommand } from '@/entities/document/model/commands/GroupShapesCommand';
import { UngroupCommand } from '@/entities/document/model/commands/UngroupCommand';
import { editorStoreApi } from '@/entities/document/model/store';

export function groupSelectedShapes(): void {
  const { selection, document: doc } = editorStoreApi.getState();
  const rootSelected = selection.filter((id) => doc.rootChildIds.includes(id));
  if (rootSelected.length < 2) return;
  applyCommand(new GroupShapesCommand(rootSelected), editorStoreApi);
}

export function ungroupSelectedShape(): void {
  const { selection, document: doc } = editorStoreApi.getState();
  if (selection.length !== 1) return;
  const shape = doc.shapes[selection[0]];
  if (shape?.type !== 'group') return;
  applyCommand(new UngroupCommand(selection[0]), editorStoreApi);
}
