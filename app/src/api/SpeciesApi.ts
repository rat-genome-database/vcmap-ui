import httpInstance from '@/api/httpInstance';
import Species from '@/models/Species';
import Map from '@/models/Map';
import Chromosome from '@/models/Chromosome';
import Gene from '@/models/Gene';

export default class SpeciesApi
{
  static async getSpecies(): Promise<Species[]>
  {
    const res = await httpInstance.get(`/lookup/speciesTypeKeys`);
    const mapRes = await httpInstance.get(`/vcmap/species`);
    const speciesList: Species[] = [];
    for (const name in res.data)
    {
      const typeKey = res.data[name];
      let defaultMap = 0;
      for (const map of mapRes.data)
      {
        if (map.name === name)
        {
          defaultMap = map.maps[0].key;
        }
      }
      speciesList.push(new Species({ typeKey: typeKey, name: name, defaultMapKey: defaultMap }));
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

  static async getChromosomes(mapKey: Number):  Promise<Chromosome[]>
  {
    const res = await httpInstance.get(`/vcmap/maps/${mapKey}/chromosomes`);
    const chrList: Chromosome[] = [];
    const chrInfo = res.data;

    for (const chr in chrInfo)
    {
      const chrData = chrInfo[chr];
      chrList.push(new Chromosome({ mapKey: chrData.mapKey, chromosome: chrData.chromosome, seqLength: chrData.seqLength, gapLength: chrData.gapLength, gapCount: chrData.gapCount, contigCount: chrData.contigCount, ordinalNumber: chrData.ordinalNumber }));
    }

    return chrList;
  }

  static async getChromosomeInfo(chr: String, mapKey: Number):  Promise<Chromosome>
  {
    const res = await httpInstance.get(`/maps/chr/${chr}/${mapKey}`);
    const chrInfo = res.data;
    const chromosome: Chromosome = new Chromosome({ mapKey: chrInfo.mapKey, chromosome: chrInfo.chromosome, seqLength: chrInfo.seqLength, gapLength: chrInfo.gapLength, gapCount: chrInfo.gapCount, contigCount: chrInfo.contigCount, ordinalNumber: chrInfo.ordinalNumber });
    return chromosome;
  }

  static async getGenes(mapKey: Number):  Promise<any>
  {
    const res = await httpInstance.get(`/genes/map/${mapKey}`);

    const geneList: Gene[] = [];

    for (const gene in res.data)
    {
      const geneInfo = res.data[gene];
      geneList.push(new Gene({ symbol: geneInfo.gene.symbol, name: geneInfo.gene.name, type: geneInfo.gene.type, key: geneInfo.gene.key, rgdId: geneInfo.gene.rgdId, chromosome: geneInfo.chromosome, start: geneInfo.start, stop: geneInfo.stop, speciesTypeKey: geneInfo.gene.speciesTypeKey, }));
    }

    return geneList;
  }
}