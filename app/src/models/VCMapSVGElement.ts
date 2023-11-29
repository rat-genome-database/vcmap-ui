import { IHoverableData } from "./HoveredData";

export interface VCMapSVGElement extends IHoverableData
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

/**
 * FIXME: In future implementation, would it be possible to represent very drawn SVG element as this? Basically instead of 
 *   SyntenySection, DatatrackSection, OrthologLine, etc we just have VCMapSVGEl. Could maybe store any sort of data we'd need
 *   click as a generic type...
 * 
 *   E.g.
 *   export class VCMapSVGEl<T> implements VCMapSVGElement {
 *     data: T = null;
 *     ...
 *   }
 */
// export class VCMapSVGEl implements VCMapSVGElement {
//   posX1: number = 0;
//   posX2: number = 0;
//   posY1: number = 0;
//   posY2: number = 0;
//   height: number = 0;
//   width: number = 0;
//   shape: SVGShape = 'rect';
//   representation: string = 'gene';
//   elementColor: string = 'red';

//   isHovered: boolean = false;
//   isSelected: boolean = false;

//   start: number = 0;
//   stop: number = 0;
//   name: string = "";
// }

export type SVGShape = 'rect' | 'line';