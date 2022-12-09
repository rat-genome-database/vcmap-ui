import BackboneSection from "./BackboneSection";
import Gene from './Gene';
import { SVGShape, VCMapSVGElement } from "./VCMapSVGElement";
import Label from './Label';

export interface LoadedSpeciesGenes
{
  [speciesName:string]: {
    drawn: {
      gene: DatatrackSection,
      svgY: number;
      svgX: number;
    }[];
  };
}

interface DatatrackSectionParams
{
  start: number;
  stop: number;
  backboneSection: BackboneSection;
  type: string;
  orthologs?: number[];
  gene?: Gene;
}

export default class DatatrackSection implements VCMapSVGElement
{
  speciesStart: number = 0;                    // start basepair of the section on its original species
  speciesStop: number = 0;                     // stop basepair of the section on its original species
  length: number = 0;                          // length of the section on its original species
  type: string = '';
  //chromosome: Chromosome = new Chromosome();   // chromosome that this section is from
  //species: Species = new Species();            // species that this section is from
  label?: Label;
  backboneSection: BackboneSection | undefined;  // backbone section that this datatrack is aligned to
  chainLevel: number = 0;                      // level of the chain that this section is on
  
  orthologs: number[] = [];  // orthologs ids of this gene
  gene: Gene | undefined // gene that this datatrack represents

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


  constructor(params: DatatrackSectionParams)
  {
    this.speciesStart = params.start;
    this.speciesStop = params.stop;
    this.length = Math.abs(this.speciesStop - this.speciesStart);
    this.backboneSection = params.backboneSection;
    this.type = params.type;

    this.posY1 = this.backboneSection.posY1;
    this.posY2 = this.backboneSection.posY2;
    this.height = this.backboneSection.height;

    this.elementColor = '#00000';

    if (params.gene) this.gene = params.gene;
    if (params.orthologs) this.orthologs = params.orthologs;

  }
}

export class GeneDatatrack extends DatatrackSection
{
  constructor(params: DatatrackSectionParams)
  {
    super(params);
  }


}
