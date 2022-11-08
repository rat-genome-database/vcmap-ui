import BackboneSection from './BackboneSection';

export interface SVGElement
{
  posX1: number;
  posX2: number;
  posY1: number;
  posY2: number;
  height: number;
  shape: string;           // 'rect' or 'line'
  representation: string;  // 'gene' or 'synteny', etc
}

export default class SyntenyObject
{
  speciesStart: number = 0;  // start basepair of the section on its original species
  speciesStop: number = 0;   // stop basepair of the section on its original species
  length: number = 0;        // length of the section on its original species

  backboneSection: BackboneSection = new BackboneSection();  // backbone section that this synteny section is aligned to

  threshold: number = 0;     // threshold level this object was created at
  type: string = '';         // type of object this is (synteny, gap, etc)
  drawnPos: SVGElement = {
    posX1: 0,
    posX2: 0,
    posY1: 0,
    posY2: 0,
    height: 0,
    shape: '',
    representation: ''
  };
}