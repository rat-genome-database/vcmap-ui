import httpInstance from '@/api/httpInstance';
import SyntenyBlock, { SyntenyBlockDTO } from '@/models/SyntenyBlock';
import Map from '@/models/Map';
import Chromosome from '@/models/Chromosome';
import { Resolution } from '@/utils/Resolution';

export default class SyntenyApi
{
  static async getSyntenyBlocks(backboneChromosome: Chromosome, start: number, stop: number, comparativeSpeciesMap: Map, chainLevel?: number): Promise<SyntenyBlock[]>
  {
    let apiRoute = `/vcmap/blocks/${backboneChromosome?.mapKey}/${backboneChromosome?.chromosome}/${start}/${stop}/${comparativeSpeciesMap?.key}`;
    if (chainLevel != null)
    {
      apiRoute += `/${chainLevel}`;
    }
    const threshold = Resolution.getSyntenyThreshold();
    if (threshold !=  null)
    {
      apiRoute += `?threshold=${threshold}`;
    }
    
    const res = await httpInstance.get(apiRoute);
    const blocks: SyntenyBlock[] = [];
    res.data.forEach((block: SyntenyBlockDTO) => {
      blocks.push(new SyntenyBlock(block));
    });

    console.debug(`Synteny blocks found for mapKey '${comparativeSpeciesMap.key}', threshold: '${threshold}': ${blocks.length}`);
    return blocks;
  }
}