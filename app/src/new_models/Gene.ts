interface GeneParams
{
  speciesName?: string;
  symbol: string;
  name: string;
  rgdId: number;
  chromosome: string;
  start: number;
  stop: number;
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

  constructor(params: GeneParams)
  {
    this.speciesName = params.speciesName;
    this.symbol = params.symbol;
    this.name = params.name;
    this.rgdId = params.rgdId;
    this.chromosome = params.chromosome;
    this.start = params.start;
    this.stop = params.stop;
  }
}