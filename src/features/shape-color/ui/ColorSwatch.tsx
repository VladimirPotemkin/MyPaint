import type { LucideIcon } from 'lucide-react';
import { Palette } from 'lucide-react';

type Props = {
  color: string;
  label: string;
  isOpen: boolean;
  onClick: () => void;
  icon?: LucideIcon; // ← необязательный, по умолчанию Palette
};

export function ColorSwatch({
  color,
  label,
  isOpen,
  onClick,
  icon: Icon = Palette,
}: Readonly<Props>) {
  const isMixed = color === '#mixed';

  return (
    <button
      type="button"
      className={`toolbar__button color-swatch${isOpen ? ' color-swatch--open' : ''}`}
      onClick={onClick}
      aria-label={`${label}: ${isMixed ? 'mixed' : color}`}
      aria-pressed={isOpen}
      title={`${label} color`}
    >
      <Icon />
      <span
        className="color-swatch__preview"
        style={{
          background: isMixed ? 'linear-gradient(135deg, #f00 50%, #00f 50%)' : color,
        }}
      />
    </button>
  );
}
