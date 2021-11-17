import httpInstance from '@/api/httpInstance';
import SyntenyBlock, { SyntenyBlockDTO } from '@/models/SyntenyBlock';
import Map from '@/models/Map';
import Chromosome from '@/models/Chromosome';

export default class SyntenyApi
{
  static async getSyntenyBlocks(backboneChromosome: Chromosome, start: number, stop: number, comparativeSpeciesMap: Map, chainLevel?: number): Promise<SyntenyBlock[]>
  {
    let apiRoute = `/synteny/blocks/${backboneChromosome?.mapKey}/${backboneChromosome?.chromosome}/${start}/${stop}/${comparativeSpeciesMap?.key}`;
    if (chainLevel != null)
    {
      apiRoute += `/${chainLevel}`;
    }
    
    const res = await httpInstance.get(apiRoute);
    const blocks: SyntenyBlock[] = [];
    res.data.forEach((block: SyntenyBlockDTO) => {
      blocks.push(new SyntenyBlock(block));
    });

    console.log(blocks.length, blocks, [... new Set(blocks.map(b => b.chromosome))]);
    return blocks;
  }
}