import Chromosome from "@/models/Chromosome";
import Gene from "@/models/Gene";

interface BlockParams
{
  backbone: Chromosome;
  chromosome: Chromosome;
  chainLevel?: number;
  start: number;
  stop: number;
  backboneStart?: number;
  backboneStop?: number;
  orientation?: '+' | '-';
  gaps?: [{start: number, stop:number}];
  genes?: [Gene];
}

export default class Block
{
  backbone: Chromosome;
  chromosome: Chromosome;
  // Defaults
  chainLevel: number = 1;
  start: number = 0;
  stop: number = 0;
  backboneStart: number = -1;
  backboneStop: number = -1;
  orientation: "+" | "-" = '+';
  gaps: [{start: number, stop:number}?] = [];
  genes: [Gene?] = [];

  // Constructor
  constructor(params: BlockParams)
  {
    this.backbone = params.backbone;
    this.chromosome = params.chromosome;
    this.chainLevel = params.chainLevel ?? this.chainLevel;
    this.start = params.start;
    this.stop = params.stop;
    this.backboneStart = params.backboneStart ?? this.backboneStart;
    this.backboneStop = params.backboneStop ?? this.backboneStop;
    this.orientation = params.orientation ?? this.orientation;
    this.gaps = params.gaps ?? this.gaps;
    this.genes = params.genes ?? this.genes;
  }
}
