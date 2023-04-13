interface VariantPositionsParams
{
  mapKey: number;
  speciesName? : string;
  chromosome: string;
  positions: number[];
  blockStart: number;
  blockStop: number
  backboneStart: number;
  backboneStop: number;
}

export default class VariantPositions
{
  mapKey: number;
  speciesName: string = '';
  chromosome: string = '';
  positions: number[] = [];
  blockStart: number;
  blockStop: number;
  backboneStart: number;
  backboneStop: number;

  constructor(params: VariantPositionsParams)
  {
    this.mapKey = params.mapKey;
    this.speciesName = params.speciesName ?? this.speciesName;
    this.chromosome = params.chromosome;
    this.positions = params.positions;
    this.blockStart = params.blockStart;
    this.blockStop = params.blockStop;
    this.backboneStart = params.backboneStart;
    this.backboneStop = params.backboneStop;
  }
}