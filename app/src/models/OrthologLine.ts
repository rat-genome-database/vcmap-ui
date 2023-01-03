import { GeneDatatrack } from './DatatrackSection';
import { SVGShape, VCMapSVGElement } from "./VCMapSVGElement";

interface OrthologLineParams
{
  backboneGene: GeneDatatrack;
  comparativeGene: GeneDatatrack;
}

export default class OrthologLine implements VCMapSVGElement
{
  backboneGene: GeneDatatrack;
  comparativeGene: GeneDatatrack;

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

  constructor(params: OrthologLineParams)
  {
    this.backboneGene = params.backboneGene;
    this.comparativeGene = params.comparativeGene;

    this.setSVGPositions();
  }

  public setSVGPositions()
  {
    this.posX1 = this.backboneGene.posX2;
    this.posX2 = this.comparativeGene.posX1;
    this.posY1 = this.backboneGene.posY1 + (this.backboneGene.height / 2);
    this.posY2 = this.comparativeGene.posY1 + (this.comparativeGene.height / 2);
  }
}