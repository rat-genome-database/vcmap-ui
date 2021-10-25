import Axios from 'axios';
import Species from '@/models/Species';

export default class SpeciesApi
{
  private static speciesAxios = Axios.create();

  static async getSpecies(): Promise<Species[]>
  {
    const res = await this.speciesAxios.get('https://rest.rgd.mcw.edu/rgdws/lookup/speciesTypeKeys');
    const speciesList: Species[] = [];
    for (const name in res.data)
    {
      const typeKey = res.data[name];
      speciesList.push(new Species({ typeKey: typeKey, name: name}));
    }

    return speciesList;
  }
}