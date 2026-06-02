import type { ActiveTool } from '@/entities/document/model/types';

export const DRAWABLE_TOOLS = ['rect', 'ellipse', 'triangle', 'star'] as const;
export type DrawableTool = (typeof DRAWABLE_TOOLS)[number];

export const DRAWABLE_SHAPE_DEFAULTS: Record<DrawableTool, { name: string; fill: string }> = {
  rect: { name: 'Rectangle', fill: '#4f8ef7' },
  ellipse: { name: 'Ellipse', fill: '#ff3b30' },
  triangle: { name: 'Triangle', fill: '#22c55e' },
  star: { name: 'Star', fill: '#facc15' },
};

export function isDrawableTool(tool: ActiveTool): tool is DrawableTool {
  return (DRAWABLE_TOOLS as readonly string[]).includes(tool);
}
