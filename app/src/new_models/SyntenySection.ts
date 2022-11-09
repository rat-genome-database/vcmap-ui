import BackboneSection from './BackboneSection';
import SyntenyObject from './SyntenyObject';
import Species from '../models/Species';
import Chromosome from "@/models/Chromosome";
import DatatrackSection from './DatatrackSection';

interface SyntenySectionParams
{
  start: number;
  stop: number;
  backboneStart: number;
  backboneStop: number;
  species: Species;
  syntenyObject: SyntenyObject;
}

//This model is used to store data for a syntenic section offbackbone
export default class SyntenySection
{
  speciesStart: number = 0;  // start basepair of the section on its original species
  speciesStop: number = 0;   // stop basepair of the section on its original species
  length: number = 0;        // length of the section on its original species

  //backboneSection: BackboneSection = new BackboneSection();  // backbone section that this synteny section is aligned to
  syntenyGaps: SyntenyObject[] = [];                         // synteny gaps occupying this section
  syntenyBlocks: SyntenyObject[] = [];                       // synteny blocks occupying this section
  syntenicRatio: number = 0;                                 // ratio of the length of the section on its original species to the length of the backbone section
  datatrackSections: DatatrackSection[] = []; // DatatrackSections belonging to this SyntenySection

  //species: Species = new Species();                          // species that this section is from
  //chromosome: Chromosome = new Chromosome();                 // chromosome that this section is from

  constructor(params: SyntenySectionParams)
  {
    this.speciesStart = params.start;
    this.speciesStop = params.stop;
    this.length = this.speciesStop - this.speciesStart;
    //this.backboneSection.start = params.backboneStart;
    //this.backboneSection.stop = params.backboneStop;
    //this.backboneSection.length = this.backboneSection.stop - this.backboneSection.start;
    //this.species = params.species;
    //this.chromosome = params.chromosome;
  }
}