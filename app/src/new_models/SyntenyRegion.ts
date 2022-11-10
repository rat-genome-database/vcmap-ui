import BackboneSection from './BackboneSection';
import SyntenySection from './SyntenySection';
import Species from '../models/Species';
import Chromosome from "@/models/Chromosome";
import DatatrackSection from './DatatrackSection';
import Label from './Label';

interface SyntenySectionParams
{
  start: number;
  stop: number;
  backboneStart: number;
  backboneStop: number;
  species: Species;
  syntenyObject: SyntenySection;
}

//This model is used to store data for a syntenic section offbackbone
export default class SyntenyRegion
{
  speciesStart: number = 0;  // start basepair of the section on its original species
  speciesStop: number = 0;   // stop basepair of the section on its original species
  length: number = 0;        // length of the section on its original species

  syntenyGaps: SyntenySection[] = [];                         // synteny gaps occupying this section
  syntenyBlocks: SyntenySection[] = [];                       // synteny blocks occupying this section
  syntenicRatio: number = 0;                                 // ratio of the length of the section on its original species to the length of the backbone section
  datatrackSections: DatatrackSection[] = []; // DatatrackSections belonging to this SyntenySection
  backboneSelection: BackboneSection | undefined; // backbone section that this synteny section is aligned to
  //species: Species = new Species();                          // species that this section is from
  //chromosome: Chromosome = new Chromosome();                 // chromosome that this section is from
  // NOTE: We should evaluate if we want this, if its just a copy of the references to the labels in SyntenyRegion.datatrackSections
  datatrackLabels: Label[] = [];                               // array of Label objects associated with the datatrackSections

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