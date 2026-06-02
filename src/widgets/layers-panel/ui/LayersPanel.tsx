import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { applyCommand } from '@/entities/document/model/commands';
import { ReorderLayerCommand } from '@/entities/document/model/commands/ReorderLayerCommand';
import { editorStoreApi, useEditorStore } from '@/entities/document/model/store';
import { buildLayerTree } from '@/entities/layer/buildLayerTree';
import type { LayerTreeNode } from '@/entities/layer/buildLayerTree';

type LayerRowProps = Readonly<{
  layer: LayerTreeNode;
  depth: number;
  selectedIds: string[];
  onSelect: (id: string, additive: boolean) => void;
  onCheckedChange: (id: string, checked: boolean) => void;
  onToggleVisible: (id: string, visible: boolean) => void;
  onToggleLocked: (id: string, locked: boolean) => void;
  dragAttributes?: ReturnType<typeof useSortable>['attributes'];
  dragListeners?: ReturnType<typeof useSortable>['listeners'];
  sortable?: boolean;
}>;

function LayerRow({
  layer,
  depth,
  selectedIds,
  onSelect,
  onCheckedChange,
  onToggleVisible,
  onToggleLocked,
  dragAttributes,
  dragListeners,
  sortable = false,
}: LayerRowProps) {
  const selected = selectedIds.includes(layer.id);

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '24px 24px 1fr 44px 44px',
          alignItems: 'center',
          gap: 4,
          minHeight: 32,
          padding: '4px 8px',
          paddingLeft: 8 + depth * 16,
          borderRadius: 4,
          background: selected ? 'var(--color-selection)' : 'transparent',
          color: layer.visible ? 'var(--color-text)' : 'var(--color-text-muted)',
          cursor: 'default',
        }}
      >
        <button
          type="button"
          aria-label="Drag layer"
          disabled={!sortable}
          {...dragAttributes}
          {...dragListeners}
          onClick={(event) => event.stopPropagation()}
          style={{
            cursor: sortable ? 'grab' : 'default',
            color: 'var(--color-text-muted)',
          }}
        >
          ::
        </button>
        <input
          type="checkbox"
          checked={selected}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => onCheckedChange(layer.id, event.currentTarget.checked)}
        />
        <button
          type="button"
          onClick={(event) => onSelect(layer.id, event.shiftKey)}
          title={layer.name}
          style={{
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: selected ? 600 : 400,
            textAlign: 'left',
          }}
        >
          {layer.name}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleVisible(layer.id, layer.visible);
          }}
          style={{ color: layer.visible ? 'var(--color-text)' : 'var(--color-text-muted)' }}
        >
          {layer.visible ? 'Hide' : 'Show'}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleLocked(layer.id, layer.locked);
          }}
          style={{ color: layer.locked ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
        >
          {layer.locked ? 'Unlock' : 'Lock'}
        </button>
      </div>
      {layer.children
        .slice()
        .reverse()
        .map((child) => (
          <LayerRow
            key={child.id}
            layer={child}
            depth={depth + 1}
            selectedIds={selectedIds}
            onSelect={onSelect}
            onCheckedChange={onCheckedChange}
            onToggleVisible={onToggleVisible}
            onToggleLocked={onToggleLocked}
          />
        ))}
    </div>
  );
}

function SortableLayerRow(
  props: Readonly<Omit<LayerRowProps, 'dragAttributes' | 'dragListeners'>>,
) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.layer.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
      }}
    >
      <LayerRow {...props} dragAttributes={attributes} dragListeners={listeners} sortable />
    </div>
  );
}

export function LayersPanel() {
  const doc = useEditorStore((s) => s.document);
  const selection = useEditorStore((s) => s.selection);
  const setSelection = useEditorStore((s) => s.setSelection);
  const updateShape = useEditorStore((s) => s.updateShape);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // buildLayerTree вернёт bottom-to-top, мы реверсируем для отображения
  const layers = [...buildLayerTree(doc)].reverse();
  const layerIds = layers.map((layer) => layer.id);

  const selectLayer = (id: string, additive: boolean) => {
    if (!additive) {
      setSelection([id]);
      return;
    }

    setSelection(
      selection.includes(id)
        ? selection.filter((selectedId) => selectedId !== id)
        : [...selection, id],
    );
  };

  const setLayerChecked = (id: string, checked: boolean) => {
    if (checked) {
      setSelection(selection.includes(id) ? selection : [...selection, id]);
      return;
    }

    setSelection(selection.filter((selectedId) => selectedId !== id));
  };

  const toggleVisible = (id: string, visible: boolean) => {
    updateShape(id, { visible: !visible });
  };

  const toggleLocked = (id: string, locked: boolean) => {
    updateShape(id, { locked: !locked });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = layerIds.indexOf(String(active.id));
    const newIndex = layerIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const nextDisplayIds = arrayMove(layerIds, oldIndex, newIndex);
    applyCommand(
      new ReorderLayerCommand([...doc.rootChildIds], nextDisplayIds.toReversed()),
      editorStoreApi,
    );
  };

  return (
    <aside
      style={{
        width: 'var(--panel-width)',
        height: '100%',
        padding: 8,
        paddingTop: 'calc(var(--toolbar-height) + 8px)',
        borderLeft: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        overflowY: 'auto',
      }}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={layerIds} strategy={verticalListSortingStrategy}>
          {layers.map((layer) => (
            <SortableLayerRow
              key={layer.id}
              layer={layer}
              depth={0}
              selectedIds={selection}
              onSelect={selectLayer}
              onCheckedChange={setLayerChecked}
              onToggleVisible={toggleVisible}
              onToggleLocked={toggleLocked}
            />
          ))}
        </SortableContext>
      </DndContext>
    </aside>
  );
}
