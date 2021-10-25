import httpInstance from '@/api/httpInstance';
import Species from '@/models/Species';

export default class SpeciesApi
{
  static async getSpecies(): Promise<Species[]>
  {
    const res = await httpInstance.get(`/lookup/speciesTypeKeys`);
    const speciesList: Species[] = [];
    for (const name in res.data)
    {
      const typeKey = res.data[name];
      speciesList.push(new Species({ typeKey: typeKey, name: name}));
    }

    return speciesList;
  }
}