export class MapDTO
{
  key: number = 0;
  name: string = '';
  description: string = '';
  notes: string = '';
}

export default class Map extends MapDTO
{
  constructor(dto: MapDTO)
  {
    super();
    Object.assign(this, dto);
  }
}