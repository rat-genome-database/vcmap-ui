import httpInstance from '@/api/httpInstance';
import SyntenyBlock, { SyntenyBlockDTO } from '@/models/SyntenyBlock';
import Map from '@/models/Map';
import Chromosome from '@/models/Chromosome';

interface SyntenyBlocksParams
{
  backboneChromosome: Chromosome, 
  start: number, 
  stop: number, 
  comparativeSpeciesMap: Map, 
  chainLevel?: number, 
  threshold?: number
}

export default class SyntenyApi
{
  static async getSyntenyBlocks(params: SyntenyBlocksParams): Promise<SyntenyBlock[]>
  {
    let apiRoute = `/vcmap/blocks/${params.backboneChromosome?.mapKey}/${params.backboneChromosome?.chromosome}/${params.start}/${params.stop}/${params.comparativeSpeciesMap?.key}`;
    if (params.chainLevel != null)
    {
      apiRoute += `/${params.chainLevel}`;
    }

    if (params.threshold !=  null)
    {
      apiRoute += `?threshold=${params.threshold}`;
    }
    
    const res = await httpInstance.get(apiRoute);
    const blocks: SyntenyBlock[] = [];
    res.data.forEach((block: SyntenyBlockDTO) => {
      blocks.push(new SyntenyBlock(block));
    });

    console.debug(`Synteny blocks found for mapKey '${params.comparativeSpeciesMap.key}', threshold: '${params.threshold}': ${blocks.length}`);
    return blocks;
  }
}