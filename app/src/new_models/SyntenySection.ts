import { VCMapSVGElement } from './VCMapSVGElement';
import BackboneSection from './BackboneSection';

interface SyntenySectionParams
{
  start: number;
  stop: number;
  backboneSection: BackboneSection;
  type: string;
  threshold?: number;
}

export default class SyntenySection implements VCMapSVGElement
{
  // VCMapSVGElement props
  posX1: number = 0;
  posX2: number = 0;
  posY1: number = 0;
  posY2: number = 0;
  height: number = 0;
  shape: string = '';
  representation: string = '';

  speciesStart: number = 0;  // start basepair of the section on its original species
  speciesStop: number = 0;   // stop basepair of the section on its original species
  length: number = 0;        // length of the section on its original species
  threshold?: number = 0;     // threshold level this object was created at
  type: string = '';         // type of object this is (synteny, gap, etc)
  backboneSection: BackboneSection | undefined;  // backbone section that this datatrack is aligned to
  blockRatio: number = 0;    // ratio of the length of the section on its original species to the length of this backbone section

  constructor(params: SyntenySectionParams)
  {
    this.speciesStart = params.start;
    this.speciesStop = params.stop;
    this.length = this.speciesStop - this.speciesStart;
    this.threshold = params.threshold || 0;
    this.type = params.type;
    this.backboneSection = params.backboneSection;
    this.blockRatio = this.backboneSection.length / this.length;

    this.posY1 = this.backboneSection.posY1;
    this.posY2 = this.backboneSection.posY2;
    this.height = this.backboneSection.height;
  }
}