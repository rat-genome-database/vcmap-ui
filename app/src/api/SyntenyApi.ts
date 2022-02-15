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
    const speciesGenes: Gene[] = [];
    syntenyResults.forEach((result, index) => {
      const regions: SyntenyRegionData[] = [];
      if (result.status === 'fulfilled')
      {
        result.value.data.forEach((regionData: any) => {
          console.log(syntenyResults.length);
          const block = new SyntenicRegion(regionData.block as SyntenicRegionDTO);
          const gaps = regionData.gaps?.map((g: any) => new SyntenicRegion(g as SyntenicRegionDTO));
          
          const blockInfo = {'blockStart': block.start, 'blockStop': block.stop, 'blockBackboneStart': block.backboneStart, 'blockBackboneStop': block.backboneStop}
          if (regionData.genes)
          {
            for (const gene in regionData.genes)
            {
              const geneInfo = regionData.genes[gene];
              const currGene = new Gene({ symbol: geneInfo.geneSymbol, name: geneInfo.geneName, type: geneInfo.geneType, key: geneInfo.key, rgdId: geneInfo.geneRgdId, chromosome: geneInfo.chr, start: geneInfo.startPos, stop: geneInfo.stopPos, blockInfo: blockInfo, speciesTypeKey: geneInfo.speciesTypeKey, })
              speciesGenes.push(currGene);
            }
          }
          
          regions.push({
            block: block,
            gaps: gaps ?? [],
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
        genes: speciesGenes
      });
      console.debug(`Syntenic regions found for mapKey '${comparativeSpeciesMaps[index].key}', threshold: '${params.threshold}': ${regions.length}`);
    });

    console.log(speciesGenes);
    return speciesSyntenyData;
  }
}