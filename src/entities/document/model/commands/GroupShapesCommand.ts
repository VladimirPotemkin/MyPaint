import type { StoreApi } from 'zustand';
import type { EditorStore } from '../store';
import type { Command } from '../commands';
import type { GroupShape, Shape } from '../types';

export class GroupShapesCommand implements Command {
  readonly name = 'GroupShapes';

  private readonly groupId: string;
  private readonly childIds: string[];
  private childSnapshots: Record<string, Shape> = {};
  private prevRootChildIds: string[] = [];

  constructor(childIds: string[]) {
    this.childIds = [...childIds];
    this.groupId = crypto.randomUUID();
  }

  execute(api: StoreApi<EditorStore>): void {
    const { document } = api.getState();
    const shapes = document.shapes;

    // YAGNI: axis-aligned bbox — min/max across all selected shapes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const id of this.childIds) {
      const s = shapes[id];
      if (!s) continue;
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x + s.width);
      maxY = Math.max(maxY, s.y + s.height);
    }

    // Save for undo
    this.prevRootChildIds = [...document.rootChildIds];
    for (const id of this.childIds) {
      this.childSnapshots[id] = { ...shapes[id] };
    }

    const groupShape: GroupShape = {
      id: this.groupId,
      type: 'group',
      name: 'Group',
      parentId: null,
      x: minX, y: minY,
      width: maxX - minX, height: maxY - minY,
      rotation: 0,
      fill: 'transparent', stroke: 'transparent', strokeWidth: 0,
      opacity: 1, visible: true, locked: false,
      childIds: [...this.childIds],
    };
    // Convert children from world coords to local (group-relative)
    const updatedChildren: Record<string, Shape> = {};
    for (const id of this.childIds) {
      updatedChildren[id] = { ...shapes[id], parentId: this.groupId, x: shapes[id].x - minX, y: shapes[id].y - minY };
    }

    // Insert group where the first child was; remove children from root
    const insertAt = document.rootChildIds.indexOf(this.childIds[0]);
    const newRootIds = document.rootChildIds.filter((id) => !this.childIds.includes(id));
    newRootIds.splice(Math.max(0, insertAt), 0, this.groupId);

    api.setState((s) => ({
      document: {
        shapes: { ...s.document.shapes, ...updatedChildren, [this.groupId]: groupShape },
        rootChildIds: newRootIds,
      },
      selection: [this.groupId],
    }));
  }

  undo(api: StoreApi<EditorStore>): void {
    const { [this.groupId]: _removed, ...shapesWithoutGroup } = api.getState().document.shapes;
    api.setState(() => ({
      document: {
        shapes: { ...shapesWithoutGroup, ...this.childSnapshots },
        rootChildIds: this.prevRootChildIds,
      },
      selection: [...this.childIds],
    }));
  }
}
