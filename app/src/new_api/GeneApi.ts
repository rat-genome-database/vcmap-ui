import Gene from "@/new_models/Gene";
import httpInstance from "./httpInstance";

/**
 * Expected Gene model returned from the RGD Rest API
 */
interface GeneDTO
{
  start: number;
  stop: number;
  chromosome: string;
  mapKey: number;
  strand: '+' | '-';
  gene: {
    key: number;
    symbol: string;
    name: string;
    description: string | null;
    notes: string | null;
    rgdId: number;
    type: string;
    nomenReviewDate: number;
    speciesTypeKey: number;
    refSeqStatus: string;
    soAccId: string;
    agrDescription: string | null;
    mergedDescription: string | null;
    geneSource: string;
    ensemblGeneSymbol: string;
    ensemblGeneType: string;
    ensemblFullName: string;
    nomenSource: string;
    variant: boolean;
    ncbiAnnotStatus: string | null;
  }
}

/**
 * Converts RGD Gene model to our internal Gene model
 */
function getGeneFromGeneDTO(dto: GeneDTO, speciesName?: string)
{
  return new Gene({
    speciesName: speciesName,
    symbol: dto.gene.symbol,
    name: dto.gene.name,
    rgdId: dto.gene.rgdId,
    chromosome: dto.chromosome,
    start: dto.start,
    stop: dto.stop,
  });
}

/**
 * Expected models returned from the RGD gene ortholog Rest API calls
 */
interface OrthologGeneDTO
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
}

interface OrthologGeneSetDTO
{
  gene: OrthologGeneDTO,
  orthologs: {
    [key: string]: OrthologGeneDTO[]
  }
}

/**
 * Converts RGD Ortholog Gene model to our internal Gene model
 */
function getGeneFromOrthologGeneDTO(dto: OrthologGeneDTO)
{
  return new Gene({
    symbol: dto.geneSymbol,
    name: dto.geneName,
    rgdId: dto.geneRgdId,
    chromosome: dto.chr,
    start: dto.startPos,
    stop: dto.stopPos,
  });
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
    dto.orthologs[mapKey].forEach(orthologGeneDTO => {
      if (orthologsByMapKey.hasOwnProperty(mapKey))
      {
        orthologsByMapKey[mapKey].push(getGeneFromOrthologGeneDTO(orthologGeneDTO));
      }
      else
      {
        orthologsByMapKey[mapKey] = [getGeneFromOrthologGeneDTO(orthologGeneDTO)];
      }
    })
  }

  return orthologsByMapKey;
}

export default class GeneApi
{
  static async getGenesBySymbol(mapKey: Number, speciesName: string, symbolPrefix: String):  Promise<any>
  {
    const res = await httpInstance.get<GeneDTO[]>(`/vcmap/genes/map/${mapKey}?symbolPrefix=${symbolPrefix}`);
    const geneList: Gene[] = res.data.map(dto => getGeneFromGeneDTO(dto, speciesName));
    return geneList;
  }

  static async getGenesByRegion(chromosome: String, start: Number, stop: Number, mapKey: Number, speciesName: string):  Promise<any>
  {
    const res = await httpInstance.get<GeneDTO[]>(`/genes/mapped/${chromosome}/${start}/${stop}/${mapKey}`);
    const geneList: Gene[] = res.data.map(dto => getGeneFromGeneDTO(dto, speciesName));
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
    const res = await httpInstance.get<OrthologGeneSetDTO[]>(`/vcmap/genes/orthologs/${mapKey}/${chromosome}/${start}/${stop}}?mapKeys=${mapKeyString.toString()}`);
    
    const orthologList = new Map<string, OrthologsPerMap>();
    res.data.forEach(orthologGeneSetDTO => {
      const orthologs = getOrthologsFromOrthologGeneSetDTO(orthologGeneSetDTO);
      orthologList.set(orthologGeneSetDTO.gene.geneSymbol, orthologs);
    });
    return orthologList;
  }
}