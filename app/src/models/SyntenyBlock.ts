export class SyntenyBlockDTO
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

export default class SyntenyBlock extends SyntenyBlockDTO
{
  constructor(dto: SyntenyBlockDTO)
  {
    super();
    Object.assign(this, dto);
  }
}