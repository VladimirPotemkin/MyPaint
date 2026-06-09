import { useRef, useCallback } from 'react';
import { useEditorStore, editorStoreApi } from '@/entities/document/model/store';
import { applyCommand } from '@/entities/document/model/commands';
import { UpdateShapesCommand } from '@/entities/document/model/commands/UpdateShapesCommand';
import type { Shape } from '@/entities/document/model/types';

type ColorTarget = 'fill' | 'stroke';

// Вспомогательная функция: возвращает '#mixed' если цвета разные
function deriveColor(ids: string[], shapes: Record<string, Shape>, key: ColorTarget): string {
  const colors = [...new Set(ids.map((id) => shapes[id]?.[key]).filter(Boolean))];
  return colors.length === 1 ? (colors[0] as string) : '#mixed';
}

export function useShapeColor() {
  const selection = useEditorStore((s) => s.selection);
  const shapes = useEditorStore((s) => s.document.shapes);
  const activeFill = useEditorStore((s) => s.activeFill);
  const activeStroke = useEditorStore((s) => s.activeStroke);
  const setActiveColors = useEditorStore((s) => s.setActiveColors);

  // группы пропускаем — у них fill прозрачный и не рендерится на детях
  const nonGroupIds = selection.filter((id) => shapes[id]?.type !== 'group');
  const hasSelection = nonGroupIds.length > 0;

  // если есть выделение — берём цвет фигур, иначе — активный цвет инструмента
  const fillColor = hasSelection ? deriveColor(nonGroupIds, shapes, 'fill') : activeFill;
  const strokeColor = hasSelection ? deriveColor(nonGroupIds, shapes, 'stroke') : activeStroke;

  // снимок ПЕРЕД изменением — вызывается при открытии picker'а
  const snapshotRef = useRef<Record<string, string>>({});
  const snapshotCurrentColors = useCallback(
    (target: ColorTarget) => {
      const s = editorStoreApi.getState().document.shapes;
      snapshotRef.current = Object.fromEntries(
        nonGroupIds.map((id) => [id, (s[id]?.[target] as string) ?? 'transparent']),
      );
    },
    [nonGroupIds],
  );

  // live preview — пишет напрямую в store, БЕЗ истории
  const previewColor = useCallback(
    (color: string, target: ColorTarget) => {
      nonGroupIds.forEach((id) => {
        editorStoreApi.getState().updateShape(id, { [target]: color });
      });
    },
    [nonGroupIds],
  );

  // commit — одна запись в историю + обновить активный цвет
  const commitColor = useCallback(
    (color: string, target: ColorTarget) => {
      if (hasSelection) {
        const currentShapes = editorStoreApi.getState().document.shapes;
        const entries = nonGroupIds.map((id) => {
          const shape = currentShapes[id];
          const needsWidth = target === 'stroke' && (shape?.strokeWidth ?? 0) === 0;
          return {
            id,
            before: {
              [target]: snapshotRef.current[id] ?? 'transparent',
              ...(needsWidth ? { strokeWidth: 0 } : {}),
            },
            after: {
              [target]: color,
              ...(needsWidth ? { strokeWidth: 1 } : {}),
            },
          };
        });
        applyCommand(new UpdateShapesCommand(entries), editorStoreApi);
      }
      setActiveColors(target === 'fill' ? { fill: color } : { stroke: color });
    },
    [hasSelection, nonGroupIds, setActiveColors],
  );

  return { fillColor, strokeColor, snapshotCurrentColors, previewColor, commitColor };
}
