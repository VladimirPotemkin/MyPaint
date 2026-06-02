import type { StoreApi } from 'zustand';
import type { EditorStore } from '../store';
import type { Command } from '../commands';
import type { GroupShape, Shape } from '../types';

export class UngroupCommand implements Command {
  readonly name = 'Ungroup';

  private readonly groupId: string;
  private groupSnapshot: GroupShape | null = null;
  private childSnapshots: Record<string, Shape> = {};
  private prevRootChildIds: string[] = [];

  constructor(groupId: string) {
    this.groupId = groupId;
  }

  execute(api: StoreApi<EditorStore>): void {
    const { document } = api.getState();
    const group = document.shapes[this.groupId] as GroupShape;
    if (!group || group?.type !== 'group') return;

    // Save for undo
    this.groupSnapshot = { ...group };
    this.prevRootChildIds = [...document.rootChildIds];
    for (const id of group.childIds) {
      this.childSnapshots[id] = { ...document.shapes[id] };
    }

    // Convert children from local back to world coords; visual position unchanged
    const updatedChildren: Record<string, Shape> = {};
    for (const id of group.childIds) {
      const child = document.shapes[id];
      if (!child) continue;
      updatedChildren[id] = {
        ...child,
        parentId: null,
        x: child.x + group.x,
        y: child.y + group.y,
      };
    }

    // Replace the group's slot in rootChildIds with its children (preserving order)
    const groupIndex = document.rootChildIds.indexOf(this.groupId);
    const newRootIds = [
      ...document.rootChildIds.slice(0, groupIndex),
      ...group.childIds,
      ...document.rootChildIds.slice(groupIndex + 1),
    ];

    const { [this.groupId]: _removed, ...shapesWithoutGroup } = document.shapes;

    api.setState(() => ({
      document: { shapes: { ...shapesWithoutGroup, ...updatedChildren }, rootChildIds: newRootIds },
      selection: [...group.childIds],
    }));
  }

  undo(api: StoreApi<EditorStore>): void {
    const snapshot = this.groupSnapshot;
    if (!snapshot) return;
    api.setState((s) => ({
      document: {
        shapes: { ...s.document.shapes, ...this.childSnapshots, [this.groupId]: snapshot },
        rootChildIds: this.prevRootChildIds,
      },
      selection: [this.groupId],
    }));
  }
}
