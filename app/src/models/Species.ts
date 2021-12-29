import Map from '@/models/Map';

export class SpeciesDTO
{
  typeKey: number = 0;
  name: string = '';
  defaultMapKey: number = 0;
  maps: Map[] = [];
}

export default class Species extends SpeciesDTO
{
  activeMap: Map;

  constructor(dto: SpeciesDTO)
  {
    super();
    Object.assign(this, dto);
    this.activeMap = this.maps?.filter(m => m.key === this.defaultMapKey)[0];
  }
}
