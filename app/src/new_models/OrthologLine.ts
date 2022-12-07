import Datatracksection from './DatatrackSection';
import { SVGShape, VCMapSVGElement } from "./VCMapSVGElement";

interface OrthologLineParams
{
  posX1: number;  //backbone gene x
  posX2: number;  //comparative gene x
  posY1: number;  //backbone gene y
  posY2: number;  //comparative gene y

  backboneGene: Datatracksection;
  comparativeGene: Datatracksection;
}

export default class OrthologLine implements VCMapSVGElement
{
  backboneGene: Datatracksection;
  comparativeGene: Datatracksection;

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

    this.posX1 = params.posX1;
    this.posX2 = params.posX2;
    this.posY1 = params.posY1;
    this.posY2 = params.posY2;
  }
}