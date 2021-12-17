import httpInstance from '@/api/httpInstance';
import SyntenicRegion, { SyntenicRegionDTO, SyntenyRegionData } from '@/models/SyntenicRegion';
import Map from '@/models/Map';
import Chromosome from '@/models/Chromosome';

interface SyntenyBlocksParams
{
  backboneChromosome: Chromosome; 
  start: number; 
  stop: number;
  comparativeSpeciesMap: Map; 
  chainLevel?: number; 
  threshold?: number;
  includeGaps?: boolean;
}

export default class SyntenyApi
{
  static async getSyntenicRegions(params: SyntenyBlocksParams)
  {
    let apiRoute = `/vcmap/${params.includeGaps ? 'synteny' : 'blocks'}`;
    apiRoute += `/${params.backboneChromosome?.mapKey}/${params.backboneChromosome?.chromosome}/${params.start}/${params.stop}/${params.comparativeSpeciesMap?.key}`;
    if (params.chainLevel != null)
    {
      apiRoute += `/${params.chainLevel}`;
    }

    if (params.threshold != null && params.threshold > 0)
    {
      apiRoute += `?threshold=${params.threshold}`;
    }
    
    const res = await httpInstance.get(apiRoute);

    const regions: SyntenyRegionData[] = [];
    if (params.includeGaps)
    {
      res.data.forEach((regionData: any) => {
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
      res.data.forEach((blockData: any) => {
        const block = new SyntenicRegion(blockData as SyntenicRegionDTO);
        regions.push({
          block: block,
          gaps: []
        });
      });
    }

    console.debug(`Syntenic regions found for mapKey '${params.comparativeSpeciesMap.key}', threshold: '${params.threshold}': ${regions.length}`);
    return regions;
  }
}