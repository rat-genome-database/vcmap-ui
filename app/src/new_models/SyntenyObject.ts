import { VCMapSVGElement } from './VCMapSVGElement';

export default class SyntenyObject implements VCMapSVGElement
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
  threshold: number = 0;     // threshold level this object was created at
  type: string = '';         // type of object this is (synteny, gap, etc)
}