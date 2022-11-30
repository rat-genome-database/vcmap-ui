import BackboneSection from "./BackboneSection";
import SyntenySection from "./SyntenySection";
import Species from '../models/Species';
import Gene from '../models/Gene';
import Chromosome from "@/models/Chromosome";
import { VCMapSVGElement } from "./VCMapSVGElement";
import Label from './Label';

interface DatatrackSectionParams
{
  start: number;
  stop: number;
  backboneSection: BackboneSection;
  syntenySection: SyntenySection;
  isGene: boolean;
  orthologs?: DatatrackSection[];
}

export default class DatatrackSection implements VCMapSVGElement
{
  speciesStart: number = 0;                    // start basepair of the section on its original species
  speciesStop: number = 0;                     // stop basepair of the section on its original species
  length: number = 0;                          // length of the section on its original species
  posX1: number = 0;
  posX2: number = 0;
  posY1: number = 0;
  posY2: number = 0;
  height: number = 0;
  shape: string = '';
  representation: string = '';
  //chromosome: Chromosome = new Chromosome();   // chromosome that this section is from
  //species: Species = new Species();            // species that this section is from
  label?: Label;

  backboneSection: BackboneSection | undefined;  // backbone section that this datatrack is aligned to
  syntenyBlock: SyntenySection | undefined;     // synteny section that this datatrack is aligned to

  constructor(params: DatatrackSectionParams)
  {
    this.speciesStart = params.start;
    this.speciesStop = params.stop;
    this.length = this.speciesStop - this.speciesStart;
    this.backboneSection = params.backboneSection;

    this.posY1 = this.backboneSection.posY1;
    this.posY2 = this.backboneSection.posY2;
    this.height = this.backboneSection.height;
  }
}

export class GeneDatatrack extends DatatrackSection
{
  constructor(params: DatatrackSectionParams)
  {
    super(params);
  }

  orthologs: Gene[] = [];  // orthologs of this gene
}
