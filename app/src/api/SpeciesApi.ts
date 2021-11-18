import httpInstance from '@/api/httpInstance';
import Species from '@/models/Species';
import Map from '@/models/Map';
import Chromosome from '@/models/Chromosome';

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

  static async getMaps(speciesTypeKey: Number):  Promise<Map[]>
  {
    const res = await httpInstance.get(`/lookup/maps/${speciesTypeKey}`);
    const mapsList: Map[] = [];

    for (const map in res.data)
    {
      const mapInfo = res.data[map];
      mapsList.push(new Map({ key: mapInfo.key, name: mapInfo.name, description: mapInfo.description, notes: mapInfo.notes, primaryRefAssembly: mapInfo.primaryRefAssembly }));
    }

    return mapsList;
  }

  static async getChromosomes(mapKey: Number):  Promise<Number[]>
  {
    const res = await httpInstance.get(`/maps/chr/${mapKey}`);
    const chrList: Number[] = [];
    for (const chr in res.data)
    {
      chrList.push(parseInt(chr));
    }
    return res.data;
  }

  static async getChromosomeInfo(chr: String, mapKey: Number):  Promise<Chromosome>
  {
    const res = await httpInstance.get(`/maps/chr/${chr}/${mapKey}`);
    const chrInfo = res.data;
    const chromosome: Chromosome = new Chromosome({ mapKey: chrInfo.mapKey, chromosome: chrInfo.chromosome, seqLength: chrInfo.seqLength, gapLength: chrInfo.gapLength, gapCount: chrInfo.gapCount, contigCount: chrInfo.contigCount, ordinalNumber: chrInfo.ordinalNumber });
    return chromosome;
  }
}