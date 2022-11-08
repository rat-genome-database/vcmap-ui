import Species from '../models/Species';
import Chromosome from "@/models/Chromosome";

interface BackboneSectionParams
{
  start: number;
  stop: number;
  chromosome: Chromosome;
  species: Species;
}

export default class BackboneSection
{
  start: number = 0;   // start basepair of the section for the backbone
  stop: number = 0;    // stop basepair of the section for the backbone
  length: number = 0;  // length of the section for the backbone

  syntenicRatio: number = 0;  // ratio of the length of the section on its original species to the length of this backbone section
  //species: Species = new Species();  // species that this section is from
  //chromosome: string = '';  // chromosome that this section is from

  constructor(params: BackboneSectionParams)
  {
    this.start = params.start;
    this.stop = params.stop;
    this.length = this.stop - this.start;
    //this.species = params.species;
    //this.chromosome = params.chromosome;
  }
}