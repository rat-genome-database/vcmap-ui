interface VariantPositionsParams
{
  mapKey: number;
  speciesName? : string;
  chromosome: string;
  positions: number[];
  backboneStart?: number;
  backboneStop?: number;
}

export default class VariantPositions
{
  mapKey: number;
  speciesName: string = '';
  chromosome: string = '';
  positions: number[] = [];
  backboneStart: number | null = null;
  backboneStop: number | null = null;

  constructor(params: VariantPositionsParams)
  {
    this.mapKey = params.mapKey;
    this.speciesName = params.speciesName ?? this.speciesName;
    this.chromosome = params.chromosome;
    this.positions = params.positions;
    this.backboneStart = params.backboneStart ?? this.backboneStart;
    this.backboneStop = params.backboneStop ?? this.backboneStop;
  }
}