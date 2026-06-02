import { EDITOR_SCHEMA_VERSION } from '@/shared/config/constants';
import type { EditorDocument, ViewportState } from '@/entities/document/model/types';

export const STORAGE_KEY = 'lightweight-figma-doc';

export type SavedState = {
  version: number;
  document: EditorDocument;
  viewport: ViewportState;
  grid: { enabled: boolean; size: number; snapToGrid: boolean };
};

export function isValidSavedState(data: unknown): data is SavedState {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // Проверка version
  if (obj.version !== EDITOR_SCHEMA_VERSION) {
    return false;
  }

  // Проверка document
  if (typeof obj.document !== 'object' || obj.document === null) {
    return false;
  }

  const doc = obj.document as Record<string, unknown>;
  if (!('shapes' in doc) || !('rootChildIds' in doc)) {
    return false;
  }

  // Проверка viewport
  if (typeof obj.viewport !== 'object' || obj.viewport === null) {
    return false;
  }

  const viewport = obj.viewport as Record<string, unknown>;
  if (
    typeof viewport.panX !== 'number' ||
    typeof viewport.panY !== 'number' ||
    typeof viewport.zoom !== 'number'
  ) {
    return false;
  }

  // Проверка grid
  if (typeof obj.grid !== 'object' || obj.grid === null) {
    return false;
  }

  const grid = obj.grid as Record<string, unknown>;
  if (
    typeof grid.enabled !== 'boolean' ||
    typeof grid.size !== 'number' ||
    typeof grid.snapToGrid !== 'boolean'
  ) {
    return false;
  }

  return true;
}

export function serialize(
  document: EditorDocument,
  viewport: ViewportState,
  grid: SavedState['grid'],
): string {
  const saved: SavedState = { version: EDITOR_SCHEMA_VERSION, document, viewport, grid };
  return JSON.stringify(saved);
}

export function deserialize(json: string): SavedState | null {
  try {
    const data: unknown = JSON.parse(json);
    return isValidSavedState(data) ? data : null;
  } catch {
    console.error('Failed to parse saved state');
    return null;
  }
}
