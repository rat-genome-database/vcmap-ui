import Gene from "@/models/Gene";
import httpInstance from "./httpInstance";

/**
 * Expected Gene model returned from the RGD Rest API
 */
interface GeneDTO
{
  geneRgdId: number;
  geneSymbol: string;
  geneName: string;
  geneType: string;
  mapKey: number;
  chr: string;
  startPos: number;
  stopPos: number;
  strand: '+' | '-';
  orthologs: number[];
}

/**
 * Converts RGD Gene model to our internal Gene model
 */
function getGeneFromGeneDTO(dto: GeneDTO, speciesName?: string)
{
  return new Gene({
    speciesName: speciesName,
    symbol: dto.geneSymbol,
    name: dto.geneName,
    rgdId: dto.geneRgdId,
    chromosome: dto.chr,
    start: dto.startPos,
    stop: dto.stopPos,
    orthologs: dto.orthologs,
  });
}

interface OrthologGeneSetDTO
{
  gene: GeneDTO,
  orthologs: {
    [key: string]: GeneDTO[]
  }
}

interface OrthologsPerMap
{
  /** Keyed on map key */
  [key: string]: Gene[]
}

/**
 * Converts RGD ortholog genes into our internal Gene model and maps them to a map key
 */
function getOrthologsFromOrthologGeneSetDTO(dto: OrthologGeneSetDTO)
{
  const orthologsByMapKey: OrthologsPerMap = {};
  for (const mapKey in dto)
  {
    dto.orthologs[mapKey]?.forEach(orthologGeneDTO => {
      if (mapKey in orthologsByMapKey)
      {
        orthologsByMapKey[mapKey].push(getGeneFromGeneDTO(orthologGeneDTO));
      }
      else
      {
        orthologsByMapKey[mapKey] = [getGeneFromGeneDTO(orthologGeneDTO)];
      }
    });
  }

  return orthologsByMapKey;
}

export default class GeneApi
{
  static async getGenesBySymbol(mapKey: Number, speciesName: string, symbolPrefix: String)
  {
    const res = await httpInstance.get<GeneDTO[]>(`/vcmap/genes/${mapKey}?symbolPrefix=${symbolPrefix}`);
    const geneList: Gene[] = res.data.map(dto => getGeneFromGeneDTO(dto, speciesName));
    return geneList;
  }

  static async getGenesByRegion(chromosome: String, start: number, stop: number, mapKey: number, speciesName: string, comparativeSpeciesIds: number[])
  {
    const roundedStart = Math.round(start);
    const roundedStop = Math.round(stop);
    const startTime = Date.now();

    

    // const res = await httpInstance.get<GeneDTO[]>(`/vcmap/genes/${mapKey}/${chromosome}/${roundedStart}/${roundedStop}`);
    const res = await httpInstance.get<GeneDTO[]>(`/vcmap/genes/${mapKey}/${chromosome}/${roundedStart}/${roundedStop}?orthologMapKeys=${comparativeSpeciesIds.toString()}`);
    const geneList: Gene[] = res.data.map(dto => getGeneFromGeneDTO(dto, speciesName));
    console.debug(`[DEBUG] Genes By Region API: ${Date.now() - startTime} ms`, {
      chromosome,
      start,
      stop,
      mapKey,
      speciesName,
      comparativeSpeciesIds,
    });

    console.log(`/vcmap/genes/${mapKey}/${chromosome}/${roundedStart}/${roundedStop}?orthologMapKeys=${comparativeSpeciesIds.toString()}`);

    return geneList;
  }

  static async getGeneOrthologs(mapKey: Number, chromosome: String, start: Number, stop: Number, compMapKeys: Number[])
  {
    let mapKeyString = '';
    for (let index = 0; index < compMapKeys.length; index++)
    {
      const key = compMapKeys[index];
      index == compMapKeys.length -1 ? mapKeyString += key : mapKeyString += key + ',';
    }
    const res = await httpInstance.get<OrthologGeneSetDTO[]>(`/vcmap/genes/orthologs/${mapKey}/${chromosome}/${start}/${stop}}?mapKeys=${mapKeyString.toString()}`);
    
    const orthologList = new Map<string, OrthologsPerMap>();
    res.data.forEach(orthologGeneSetDTO => {
      const orthologs = getOrthologsFromOrthologGeneSetDTO(orthologGeneSetDTO);
      orthologList.set(orthologGeneSetDTO.gene.geneSymbol, orthologs);
    });
    return orthologList;
  }
}