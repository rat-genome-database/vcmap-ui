import BackboneSection from "./BackboneSection";
import SyntenySection from "./SyntenySection";
import Species from '../models/Species';
import Gene from '../models/Gene';
import Chromosome from "@/models/Chromosome";


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

interface DatatrackSectionParams
{
  start: number;
  stop: number;
  backboneStart: number;
  backboneStop: number;
  isGene: boolean;
  orthologs?: DatatrackSection[];
}

export default class DatatrackSection
{
  speciesStart: number = 0;                    // start basepair of the section on its original species
  speciesStop: number = 0;                     // stop basepair of the section on its original species
  length: number = 0;                          // length of the section on its original species
  //chromosome: Chromosome = new Chromosome();   // chromosome that this section is from
  //species: Species = new Species();            // species that this section is from

  //backboneSection: BackboneSection = new BackboneSection();  // backbone section that this datatrack is aligned to
  //syntenySection: SyntenySection = new SyntenySection();     // synteny section that this datatrack is aligned to
  drawnPos: SVGElement = {
    posX1: 0,
    posX2: 0,
    posY1: 0,
    posY2: 0,
    height: 0,
    shape: '',
    representation: ''
  };

  constructor(params: DatatrackSectionParams)
  {
    this.speciesStart = params.start;
    this.speciesStop = params.stop;
    this.length = this.speciesStop - this.speciesStart;
    //this.backboneSection.start = params.backboneStart;
    //this.backboneSection.stop = params.backboneStop;
    //this.backboneSection.length = this.backboneSection.stop - this.backboneSection.start;
  }
}

export class GeneDatatrack extends DatatrackSection
{
  orthologs: Gene[] = [];  // orthologs of this gene
}
