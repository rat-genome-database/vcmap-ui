import Species from '../models/Species';
import Chromosome from "@/models/Chromosome";
import { VCMapSVGElement } from './VCMapSVGElement';
import SyntenyRegion from './SyntenyRegion';
import DatatrackSection from './DatatrackSection';
import Label from './Label';

interface BackboneSectionParams
{
  start: number;
  stop: number;
  chromosome: Chromosome;
  species: Species;
}

export default class BackboneSection implements VCMapSVGElement
{
  // VCMapSVGElement props
  posX1: number = 0;
  posX2: number = 0;
  posY1: number = 0;
  posY2: number = 0;
  height: number = 0;
  shape: string = '';
  representation: string = '';

  start: number = 0;   // start basepair of the section for the backbone
  stop: number = 0;    // stop basepair of the section for the backbone
  length: number = 0;  // length of the section for the backbone
  syntenicRatio: number = 0;  // ratio of the length of the section on its original species to the length of this backbone section
  //species: Species = new Species();  // species that this section is from
  //chromosome: string = '';  // chromosome that this section is from
  syntenyRegions: SyntenyRegion[] = [];
  datatrackSections: DatatrackSection[] = [];
  // NOTE: We should evaluate if we want this, if its just a copy of the references to the Labels in BackboneSection.datatrackSections
  datatrackLables: Label[] = []; // array of the Label objects associated with the datatrackSections

  constructor(params: BackboneSectionParams)
  {
    this.start = params.start;
    this.stop = params.stop;
    this.length = this.stop - this.start;
    //this.species = params.species;
    //this.chromosome = params.chromosome;
  }
}