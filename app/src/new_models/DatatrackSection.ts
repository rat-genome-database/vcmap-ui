import BackboneSection from "./BackboneSection";
import SyntenySection from "./SyntenySection";
import Species from '../models/Species';
import Gene from '../models/Gene';
import Chromosome from "@/models/Chromosome";
import { SVGShape, VCMapSVGElement } from "./VCMapSVGElement";
import Label from './Label';

interface DatatrackSectionParams
{
  start: number;
  stop: number;
  backboneSection: BackboneSection;
  type: string;
  orthologs?: DatatrackSection[];
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
    this.length = this.speciesStop - this.speciesStart;
    this.backboneSection = params.backboneSection;
    this.type = params.type;

    this.posY1 = this.backboneSection.posY1;
    this.posY2 = this.backboneSection.posY2;
    this.height = this.backboneSection.height;

    this.elementColor = '#00000';
  }
}

export class GeneDatatrack extends DatatrackSection
{
  constructor(params: DatatrackSectionParams)
  {
    super(params);
  }

  orthologs: Gene[] = [];  // orthologs of this gene
  gene: Gene | undefined // gene that this datatrack represents
}
