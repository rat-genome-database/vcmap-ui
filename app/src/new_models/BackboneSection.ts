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
  windowStart: number;
  windowStop: number;
  //chromosome: string;
  //species: string;
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
  windowStart: number = 0;  // start basepair of the section for the backbone in the detailed view
  windowStop: number = 0;   // stop basepair of the section for the backbone in the detailed view
  length: number = 0;  // length of the section for the backbone
  syntenicRatio: number = 0;  // ratio of the length of the section on its original species to the length of this backbone section
  species: string = '';  // species that this section is from
  chromosome: string = '';  // chromosome that this section is from
  syntenyRegions: SyntenyRegion[] = [];
  datatrackSections: DatatrackSection[] = [];
  // NOTE: We should evaluate if we want this, if its just a copy of the references to the Labels in BackboneSection.datatrackSections
  datatrackLables: Label[] = []; // array of the Label objects associated with the datatrackSections

  constructor(params: BackboneSectionParams)
  {
    this.start = params.start;
    this.stop = params.stop;
    this.length = this.stop - this.start;
    this.windowStart = params.windowStart;
    this.windowStop = params.windowStop;

    this.calculateSVGPosition(this.windowStart, this.windowStop);
    //this.species = params.species;
    //this.chromosome = params.chromosome;
  }

  /**
   * Function determines the start and stop SVG positions of this backbone section using the ratio of known windowStart and svgStart (55)
   * 
   * @param windowStart 
   * @param windowStop 
   */
  private calculateSVGPosition(windowStart: number, windowStop: number)
  {
    const svgStart = 55;
    const svgStop = 425;
    const svgLength = svgStop - svgStart;
    const windowLength = windowStop - windowStart;
    const ratio = windowLength / svgLength;
    const blockSvgStart = 0;
    const blockSvgStop = 0;

    // Calculate the start and stop SVG positions of this backbone section
    const basepairDiff =  this.start < windowStart ? windowStart - this.start : this.start - windowStart;
    const svgDiff = basepairDiff / ratio;

    if (this.start < windowStart)
    {
      this.posY1 = svgStart - svgDiff;
    }
    else if (this.start > windowStart)
    {
      this.posY1 = svgStart + svgDiff;
    }
    else if (this.start === windowStart)
    {
      this.posY1 = svgStart;
    }

    this.posY2 = this.posY1 + ( this.length / ratio );

    this.height = this.posY2 - this.posY1;
  }
}