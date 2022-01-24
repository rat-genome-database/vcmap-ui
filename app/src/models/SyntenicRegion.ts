export interface SpeciesSyntenyData
{
  speciesName: string;
  mapName: string;
  regionData: SyntenyRegionData[]
}

export interface SyntenyRegionData
{
  block: SyntenicRegion,
  gaps: SyntenicRegion[]
}

export class SyntenicRegionDTO
{
  backboneMapKey: number = 0;
  backboneChromosome: string = '';
  backboneStart: number = 0;
  backboneStop: number = 0;
  mapKey: number = 0;
  chromosome: string = '';
  start: number = 0;
  stop: number = 0;
  orientation: string = '';
  chainLevel: number = 0;
  chainType: string = 'top';
}

export default class SyntenicRegion extends SyntenicRegionDTO
{
  constructor(dto: SyntenicRegionDTO)
  {
    super();
    Object.assign(this, dto);
  }

  public get length()
  {
    return this.stop - this.start;
  }
}