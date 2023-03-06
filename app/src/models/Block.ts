import Chromosome from "@/models/Chromosome";
import Gene from "@/models/Gene";

interface BlockParams
{
  backbone: Chromosome;
  chromosome: Chromosome;
  start: number;
  stop: number;
  backboneStart: number;
  backboneStop: number;
  gaps?: [{start: number, stop:number}];
  genes?: [Gene];
}

export default class Block
{
  backbone: Chromosome;
  chromosome: Chromosome;
  start: number = 0;
  stop: number = 0;
  backboneStart: number = 0;
  backboneStop: number = 0;
  gaps: [{start: number, stop:number}?] = [];
  genes: [Gene?] = [];
  constructor(params: BlockParams)
  {
    this.backbone = params.backbone;
    this.chromosome = params.chromosome;
    this.start = params.start;
    this.stop = params.stop;
    this.backboneStart = params.backboneStart;
    this.backboneStop = params.backboneStop;
    if (params.gaps) this.gaps = params.gaps;
    if (params.genes) this.genes = params.genes;
  }
}