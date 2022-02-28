import httpInstance from '@/api/httpInstance';
import SyntenicRegion, { SpeciesSyntenyData, SyntenicRegionDTO, SyntenyRegionData } from '@/models/SyntenicRegion';
import Chromosome from '@/models/Chromosome';
import Species from '@/models/Species';
import Gene from '@/models/Gene';

interface SyntenyBlocksParams
{
  backboneChromosome: Chromosome; 
  start: number; 
  stop: number;
  threshold?: number;
  includeGenes?: number; //if includeGenes=1 genes are included for each synteny block
}

export default class SyntenyApi
{
  static async getSyntenicRegions(params: SyntenyBlocksParams, comparativeSpecies: Species[])
  {
    try
    {
      const syntenyApiCalls: Promise<any>[] = [];
      const comparativeSpeciesMaps = comparativeSpecies.map(s => s.activeMap);
      comparativeSpeciesMaps.forEach(map => {
        let apiRoute = `/vcmap/synteny/${params.backboneChromosome?.mapKey}/${params.backboneChromosome?.chromosome}/${params.start}/${params.stop}/${map.key}`;

        if (params.threshold != null && params.threshold > 0)
        {
          apiRoute += `?threshold=${params.threshold}`;

          if (params.includeGenes != null && params.includeGenes == 1)
          {
            apiRoute += `&includeGenes=${params.includeGenes}`;
          }
        }

        else if (params.includeGenes != null && params.includeGenes == 1)
        {
          apiRoute += `?includeGenes=${params.includeGenes}`;
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
            const genes: Gene[] = [];
            regionData.genes?.forEach((gene: any) => {
              const currGene = new Gene(gene);
              currGene.speciesName = comparativeSpecies[index].name;
              genes.push(currGene);
            });
            
            regions.push({
              block: block,
              gaps: gaps ?? [],
              genes: genes ?? [],
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
          mapKey: comparativeSpeciesMaps[index].key,
          regionData: regions,
        });
        console.debug(`Syntenic regions found for mapKey '${comparativeSpeciesMaps[index].key}', threshold: '${params.threshold}': ${regions.length}`);
      });

      return speciesSyntenyData;
    }
    catch (error)
    {
      console.error(error);
    }
  }
}