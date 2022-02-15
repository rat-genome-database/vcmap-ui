
interface geneParams
{
  symbol: string;
  name: string;
  type: string;
  key: number;
  rgdId: number;
  chromosome: string;
  start: number;
  stop: number;
  speciesTypeKey: number;
  blockInfo: any;
}

export default class Gene
{
  symbol: string = '';
  name: string = '';
  type: string = '';
  key: number = 0;
  rgdId: number = 0;
  chromosome: string = '';
  start: number = 0;
  stop: number = 0;
  speciesTypeKey: number = 0;
  blockInfo: any | null = {};

  constructor(params: geneParams)
  {
    this.symbol = params.symbol;
    this.name = params.name;
    this.type = params.type;
    this.key = params.key;
    this.rgdId = params.rgdId;
    this.chromosome = params.chromosome;
    this.start = params.start;
    this.stop = params.stop;
    this.speciesTypeKey = params.speciesTypeKey;

    this.blockInfo = params.blockInfo;
  }
}

