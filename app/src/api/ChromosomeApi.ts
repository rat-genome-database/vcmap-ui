import Chromosome from "@/models/Chromosome";
import httpInstance from './httpInstance';

/**
 * Expected Chromosome model returned from the RGD Rest API
 */
interface ChromosomeDTO
{
  mapKey: number;
  chromosome: string;
  refSeqId: string;
  genbankId: null,
  seqLength: number;
  gapLength: number;
  gapCount: number;
  contigCount: number;
  ordinalNumber: number;
}

interface ChromosomeMapDTO
{
  [key: string]: ChromosomeDTO
}

/**
 * Converts RGD Chromosome model to our internal Chromosome model
 */
function getChromosomeFromDTO(dto: ChromosomeDTO)
{
  return new Chromosome({
    mapKey: dto.mapKey,
    chromosome: dto.chromosome,
    seqLength: dto.seqLength,
  });
}

function getChromosomeListFromMapDTO(chrMapDTO: ChromosomeMapDTO)
{
  const chrList: Chromosome[] = [];
  for (const chrKey in chrMapDTO)
  {
    chrList.push(getChromosomeFromDTO(chrMapDTO[chrKey]));
  }

  return chrList;
}

export default class ChromosomeApi
{
  static async getChromosomes(mapKey: Number):  Promise<Chromosome[]>
  {
    const res = await httpInstance.get<ChromosomeMapDTO>(`/vcmap/maps/${mapKey}/chromosomes`);
    return getChromosomeListFromMapDTO(res.data);
  }

  static async getChromosomeInfo(chr: String, mapKey: Number):  Promise<Chromosome>
  {
    const res = await httpInstance.get<ChromosomeDTO>(`/maps/chr/${chr}/${mapKey}`);
    return getChromosomeFromDTO(res.data);
  }
}