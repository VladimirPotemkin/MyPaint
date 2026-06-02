/** Physical key codes — layout-independent (use instead of e.key). */
export const Key = {
  Backspace: 'Backspace',
  Delete: 'Delete',
  Space: 'Space',
  BracketLeft: 'BracketLeft',
  BracketRight: 'BracketRight',
  KeyG: 'KeyG',
  KeyZ: 'KeyZ',
  KeyY: 'KeyY',
  KeyV: 'KeyV',
  KeyR: 'KeyR',
  KeyE: 'KeyE',
} as const;

export type KeyCode = (typeof Key)[keyof typeof Key];

export function isModKey(e: KeyboardEvent): boolean {
  return e.ctrlKey || e.metaKey;
}

export function isEditableTarget(e: KeyboardEvent): boolean {
  const el = e.target;
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

export function matchesCode(e: KeyboardEvent, code: KeyCode): boolean {
  return e.code === code;
}
