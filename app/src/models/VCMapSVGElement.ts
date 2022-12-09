export interface VCMapSVGElement
{
  posX1: number;
  posX2: number;
  posY1: number;
  posY2: number;
  height: number;
  width: number;
  shape: SVGShape;
  representation: string;  // 'gene' or 'synteny', etc
  elementColor: string;

  isHovered: boolean;
  isSelected: boolean;
}

export type SVGShape = 'rect' | 'line';