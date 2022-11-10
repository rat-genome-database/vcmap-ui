export class MapDTO
{
  key: number = 0;
  name: string = '';
  description: string = '';
  notes: string = '';
  primaryRefAssembly: boolean = false;
}

export default class SpeciesMap
{
  key: number = 0;
  name: string = '';
  primaryRefAssembly: boolean = false;
  
  constructor(params: { key: number, name: string, primaryRefAssembly: boolean })
  {
    this.key = params.key;
    this.name = params.name;
    this.primaryRefAssembly = params.primaryRefAssembly;
  }
}