import httpInstance from '@/api/httpInstance';
import SyntenicRegion, { SpeciesSyntenyData, SyntenicRegionDTO, SyntenyRegionData } from '@/models/SyntenicRegion';
import Chromosome from '@/models/Chromosome';
import Species from '@/models/Species';

interface SyntenyBlocksParams
{
  backboneChromosome: Chromosome; 
  start: number; 
  stop: number;
  threshold?: number;
}

export default class SyntenyApi
{
  static async getSyntenicRegions(params: SyntenyBlocksParams, comparativeSpecies: Species[])
  {
    const syntenyApiCalls: Promise<any>[] = [];
    const comparativeSpeciesMaps = comparativeSpecies.map(s => s.activeMap);
    comparativeSpeciesMaps.forEach(map => {
      let apiRoute = `/vcmap/synteny/${params.backboneChromosome?.mapKey}/${params.backboneChromosome?.chromosome}/${params.start}/${params.stop}/${map.key}`;

      if (params.threshold != null && params.threshold > 0)
      {
        apiRoute += `?threshold=${params.threshold}`;
      }

      syntenyApiCalls.push(httpInstance.get(apiRoute));
    });

    const syntenyResults = await Promise.allSettled(syntenyApiCalls);

    const speciesSyntenyData: SpeciesSyntenyData[] = [];
    syntenyResults.forEach((result, index) => {
      const regions: SyntenyRegionData[] = [];
      if (result.status === 'fulfilled')
      {
        result.value.data.forEach((regionData: any) => {
          const block = new SyntenicRegion(regionData.block as SyntenicRegionDTO);
          const gaps = regionData.gaps?.map((g: any) => new SyntenicRegion(g as SyntenicRegionDTO));
          regions.push({
            block: block,
            gaps: gaps ?? []
          });
        });
      }
      else
      {
        console.error(result.status, result.reason);
      }

      speciesSyntenyData.push({
        speciesName: comparativeSpecies[index].name,
        mapName: comparativeSpeciesMaps[index].name,
        regionData: regions
      });
      console.debug(`Syntenic regions found for mapKey '${comparativeSpeciesMaps[index].key}', threshold: '${params.threshold}': ${regions.length}`);
    });

    return speciesSyntenyData;
  }
}