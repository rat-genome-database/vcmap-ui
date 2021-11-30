export class GeneDTO
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
}

export default class Gene extends GeneDTO
{
  constructor(dto: GeneDTO)
  {
    super();
    Object.assign(this, dto);
  }
}