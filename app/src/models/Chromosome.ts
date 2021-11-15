export class ChromosomeDTO
{
  mapKey: number = 0;
  chromosome: string = '';
  seqLength: number = 0;
  gapLength: number = 0;
  gapCount: number = 0;
  contigCount: number = 0;
}

export default class Chromosome extends ChromosomeDTO
{
  constructor(dto: ChromosomeDTO)
  {
    super();
    Object.assign(this, dto);
  }
}