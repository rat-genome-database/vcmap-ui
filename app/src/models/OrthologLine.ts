import { GeneDatatrack } from './DatatrackSection';
import Gene from './Gene';
import { SVGShape, VCMapSVGElement } from "./VCMapSVGElement";

type OrthologLineParams = {
  backboneGene: Gene;
  offBackboneGene: Gene;
  backboneGeneDatatrack?: GeneDatatrack;
  offBackboneGeneDatatrack?: GeneDatatrack;
};

export type OrthologPair = {
  backboneGene: Gene;
  offBackboneGene: Gene;
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

  backboneGene: Gene;
  offBackboneGene: Gene;
  backboneGeneDatatrack: GeneDatatrack | null = null;
  offBackboneGeneDatatrack: GeneDatatrack | null = null;

  constructor(params: OrthologLineParams)
  {
    this.backboneGene = params.backboneGene;
    this.offBackboneGene = params.offBackboneGene;
    this.backboneGeneDatatrack = params.backboneGeneDatatrack ?? null;
    this.offBackboneGeneDatatrack = params.offBackboneGeneDatatrack ?? null;
  }

  public setBackboneSVGPosition(x1: number, y1: number)
  {
    this.posX1 = x1;
    this.posY1 = y1;
  }

  public setOffBackboneSVGPositions(x2: number, y2: number)
  {
    this.posX2 = x2;
    this.posY2 = y2;
  }
}