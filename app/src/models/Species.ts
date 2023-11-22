import SpeciesMap from './SpeciesMap';

export default class Species
{
  activeMap: SpeciesMap;
  typeKey: number = 0;
  name: string = '';
  defaultMapKey: number = 0;
  maps: SpeciesMap[] = [];
  visible: boolean = true;

  constructor(params: {typeKey: number, name: string, defaultMapKey?: number, maps: SpeciesMap[]})
  {
    this.typeKey = params.typeKey;
    this.name = params.name;
    this.maps = params.maps;

    if (params.defaultMapKey != null)
    {
      this.defaultMapKey = params.defaultMapKey;
      this.activeMap = this.maps?.filter(m => m.key === this.defaultMapKey)[0];
    }
    else
    {
      this.activeMap = this.maps[0];
      this.defaultMapKey = this.maps[0].key;
    }
  }

  public copy()
  {
    return new Species({
      typeKey: this.typeKey,
      name: this.name,
      defaultMapKey: this.defaultMapKey,
      maps: this.maps
    });
  }
}
