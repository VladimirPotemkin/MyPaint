import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HexColorPicker } from 'react-colorful';

type Props = {
  color: string; // текущий цвет (hex или '#mixed')
  anchorRect: DOMRect; // положение кнопки-свотча
  onChange: (color: string) => void; // live preview
  onClose: (finalColor: string) => void; // вызывается при закрытии
};

export function ColorPickerPopover({ color, anchorRect, onChange, onClose }: Props) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const latestColor = useRef(color);

  // всегда держим актуальный цвет в ref
  latestColor.current = color;

  // click outside → закрыть
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) {
        onClose(latestColor.current);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown, { capture: true });
    return () => document.removeEventListener('pointerdown', handlePointerDown, { capture: true });
  }, [onClose]);

  // закрыть по Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(latestColor.current);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const style: React.CSSProperties = {
    position: 'fixed',
    top: anchorRect.bottom + 8,
    left: anchorRect.left,
    zIndex: 2000,
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    padding: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  };

  const pickerColor = color === '#mixed' || !color.startsWith('#') ? '#000000' : color;

  return createPortal(
    <div ref={pickerRef} style={style} aria-label="Color picker">
      <HexColorPicker color={pickerColor} onChange={onChange} />
    </div>,
    document.body,
  );
}
