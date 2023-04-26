import { GeneDatatrack } from './DatatrackSection';
import Gene from './Gene';
import { SVGShape, VCMapSVGElement } from "./VCMapSVGElement";

type OrthologLineParams = {
  startGene: Gene;
  endGene: Gene;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  startGeneDatatrack?: GeneDatatrack;
  endGeneDatatrack?: GeneDatatrack;
};

export default class OrthologLine implements VCMapSVGElement
{
  posX1: number = 0;
  posX2: number = 0;
  posY1: number = 0;
  posY2: number = 0;
  height: number = 0;
  width: number = 0;
  shape: SVGShape = 'rect';
  representation: string = '';
  isHovered: boolean = false;
  isSelected: boolean = false;
  elementColor: string = '';

  startGene: Gene;
  endGene: Gene;
  startGeneDatatrack: GeneDatatrack | null = null;
  endGeneDatatrack: GeneDatatrack | null = null;

  chainedOrthologLines: OrthologLine[] = []; // Other ortholog lines that are "chained" to this one

  constructor(params: OrthologLineParams)
  {
    this.startGene = params.startGene;
    this.endGene = params.endGene;
    this.posX1 = params.x1;
    this.posX2 = params.x2;
    this.posY1 = params.y1;
    this.posY2 = params.y2;
    this.startGeneDatatrack = params.startGeneDatatrack ?? null;
    this.endGeneDatatrack = params.endGeneDatatrack ?? null;

    // Associate this line with its gene datatracks if possible
    this.startGeneDatatrack?.lines.push(this);
    this.endGeneDatatrack?.lines.push(this);
  }
}