export interface ISpecies
{
  typeKey: number,
  name: string
}

export class SpeciesDTO implements ISpecies
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
