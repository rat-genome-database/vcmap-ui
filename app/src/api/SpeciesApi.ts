import httpInstance from '@/api/httpInstance';
import Species from '@/models/Species';
import MapType from '@/models/Map';
import Chromosome from '@/models/Chromosome';
import Gene from '@/models/Gene';

export default class SpeciesApi
{
  static async getSpecies(): Promise<Species[]>
  {
    const speciesRes = await httpInstance.get(`/vcmap/species`);
    const speciesList: Species[] = [];
    for (const species of speciesRes.data)
    {
      const mapsList: MapType[] = [];
      let defaultMapKey = null;
      for (const map of species.maps)
      {
        if (map.primaryRefAssembly)
        {
          defaultMapKey = map.key;
        }
        mapsList.push(new MapType({ key: map.key, name: map.name, description: map.description, notes: map.notes, primaryRefAssembly: map.primaryRefAssembly }));
      }

      speciesList.push(new Species({ typeKey: species.speciesTypeKey, name: species.name, defaultMapKey: defaultMapKey ?? species.maps[0].key, maps: mapsList }));
    }
    return speciesList;
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


  static async getGenesBySymbol(mapKey: Number, speciesName: string, symbolPrefix: String):  Promise<any>
  {
    const res = await httpInstance.get(`/vcmap/genes/map/${mapKey}?symbolPrefix=${symbolPrefix}`);

    const geneList: Gene[] = [];

    for (const gene in res.data)
    {
      const geneInfo = res.data[gene];
      geneList.push(new Gene({ speciesName: speciesName, geneSymbol: geneInfo.gene.symbol, geneName: geneInfo.gene.name, geneType: geneInfo.gene.type, key: geneInfo.gene.key, geneRgdId: geneInfo.gene.rgdId, chr: geneInfo.chromosome, startPos: geneInfo.start, stopPos: geneInfo.stop, }));
    }

    return geneList;
  }

  static async getGenesByRegion(chromosome: String, start: Number, stop: Number, mapKey: Number, speciesName: string):  Promise<any>
  {
    const res = await httpInstance.get(`/vcmap/genes/mapped/${chromosome}/${start}/${stop}/${mapKey}`);

    const geneList: Gene[] = [];

    for (const gene in res.data)
    {
      const geneInfo = res.data[gene];
      geneList.push(new Gene({
        geneSymbol: geneInfo.gene.symbol,
        geneName: geneInfo.gene.name,
        geneType: geneInfo.gene.type,
        key: geneInfo.gene.key,
        geneRgdId: geneInfo.gene.rgdId,
        chr: geneInfo.chromosome,
        startPos: geneInfo.start,
        stopPos: geneInfo.stop,
        speciesName: speciesName
      }));
    }

    return geneList;
  }

  static async getGeneOrthologs(mapKey: Number, chromosome: String, start: Number, stop: Number, compMapKeys: Number[]):  Promise<any>
  {
    let mapKeyString = '';
    for (let index = 0; index < compMapKeys.length; index++)
    {
      const key = compMapKeys[index];
      index == compMapKeys.length -1 ? mapKeyString += key : mapKeyString += key + ',';
    }
    const res = await httpInstance.get(`/vcmap/genes/orthologs/${mapKey}/${chromosome}/${start}/${stop}}?mapKeys=${mapKeyString.toString()}`);
    
    const orthologList = new Map<string, any>();
    for (const gene in res.data)
    {
      const geneInfo = res.data[gene];

      orthologList.set(geneInfo.gene.geneSymbol, geneInfo.orthologs);
    }
    return orthologList;
  }
}