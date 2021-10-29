export class SpeciesDTO
{
  typeKey: number = 0;
  name: string = '';
}

export default class Species extends SpeciesDTO
{
  constructor(dto: SpeciesDTO)
  {
    super();
    Object.assign(this, dto);
  }
}
