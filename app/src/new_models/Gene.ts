interface GeneParams
{
  speciesName?: string;
  symbol: string;
  name: string;
  rgdId: number;
  chromosome: string;
  start: number;
  stop: number;
  orthologs?: number[];
}

export default class Gene
{
  speciesName?: string;
  symbol: string = '';
  name: string = '';
  rgdId: number = 0;
  chromosome: string = '';
  start: number = 0;
  stop: number = 0;
  orthologs: number[] = []; // RGD IDs -- Note: will only be populated if Gene was received from the Synteny API with the includeOrthologs param

  constructor(params: GeneParams)
  {
    this.speciesName = params.speciesName;
    this.symbol = params.symbol;
    this.name = params.name;
    this.rgdId = params.rgdId;
    this.chromosome = params.chromosome;
    this.start = params.start;
    this.stop = params.stop;
    this.orthologs = params.orthologs ?? [];
  }
}