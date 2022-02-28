
interface geneParams
{
  speciesName?: string;
  geneSymbol: string;
  geneName: string;
  geneType: string;
  key: number;
  geneRgdId: number;
  chr: string;
  startPos: number;
  stopPos: number;
}

export default class Gene
{
  speciesName?: string;
  symbol: string = '';
  name: string = '';
  type: string = '';
  key: number = 0;
  rgdId: number = 0;
  chromosome: string = '';
  start: number = 0;
  stop: number = 0;

  constructor(params: geneParams)
  {
    this.speciesName = params.speciesName;
    this.symbol = params.geneSymbol;
    this.name = params.geneName;
    this.type = params.geneType;
    this.key = params.key;
    this.rgdId = params.geneRgdId;
    this.chromosome = params.chr;
    this.start = params.startPos;
    this.stop = params.stopPos;
  }
}

