import { SVGShape, VCMapSVGElement } from './VCMapSVGElement';
import BackboneSection from './BackboneSection';
import Chromosome from './Chromosome';

interface SyntenySectionParams
{
  start: number;
  stop: number;
  backboneSection: BackboneSection;
  type: string;
  threshold?: number;
  orientation?: string;
  chromosome: Chromosome;
  chainLevel: number;
}

export default class SyntenySection implements VCMapSVGElement
{
  // VCMapSVGElement props
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

  speciesStart: number = 0;  // start basepair of the section on its original species
  speciesStop: number = 0;   // stop basepair of the section on its original species
  length: number = 0;        // length of the section on its original species
  threshold?: number = 0;     // threshold level this object was created at
  orientation?: string = '';  // orientation of the synteny block
  type: string = '';         // type of object this is (synteny, gap, etc)
  backboneSection: BackboneSection;  // backbone section that this datatrack is aligned to
  blockRatio: number = 0;    // ratio of the length of the section on its original species to the length of this backbone section
  chromosome: Chromosome;    // chromosome that this section is from
  chainLevel: number = 0;    // level of the chain that this section is on

  constructor(params: SyntenySectionParams)
  {
    this.speciesStart = params.start;
    this.speciesStop = params.stop;
    this.length = this.speciesStop - this.speciesStart;
    this.threshold = params.threshold || 0;
    this.orientation = params.orientation || '';
    this.type = params.type;
    this.backboneSection = params.backboneSection;
    this.blockRatio = this.backboneSection.length / this.length;

    this.posY1 = this.backboneSection.posY1;
    this.posY2 = this.backboneSection.posY2;
    this.height = this.backboneSection.height;
    this.chromosome = params.chromosome;
    this.chainLevel = params.chainLevel;

    this.elementColor = this.color;
  }

  public get color()
  {
    const color = Chromosome.getColor(this.chromosome.chromosome);
    return color;
  }
}