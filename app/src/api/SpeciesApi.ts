import Species from "@/models/Species";
import SpeciesMap from "@/models/SpeciesMap";
import httpInstance from './httpInstance';

/**
 * Expected Species model returned from the RGD Rest API
 */
interface SpeciesDTO
{
  name: string;
  speciesTypeKey: number;
  maps: SpeciesMapDTO[];
}

/**
 * Expected Map model returned from the RGD Rest API
 */
interface SpeciesMapDTO
{
  key: number;
  name: string;
  version: string | null;
  description: string;
  unit: string;
  rgdId: number;
  methodKey: number;
  speciesTypeKey: number;
  notes: string;
  primaryRefAssembly: boolean;
  dbsnpVersion: string | null;
  rank: number;
  ucscAssemblyId: string;
  refSeqAssemblyAcc: string;
  refSeqAssemblyName: string;
  source: string;
}
 
/**
 * Converts RGD Map model to our internal SpeciesMap model
 */
function getSpeciesMapFromDTO(dto: SpeciesMapDTO)
{
  return new SpeciesMap({
    key: dto.key,
    name: dto.name,
    primaryRefAssembly: dto.primaryRefAssembly
  });
}

/**
 * Converts RGD Species model to our internal Species model
 */
function getSpeciesFromDTO(dto: SpeciesDTO)
{
  const mapsList: SpeciesMap[] = dto.maps.map(mapDTO => getSpeciesMapFromDTO(mapDTO));
  let defaultMapKey: number | undefined;
  for (const map of mapsList)
  {
    if (map.primaryRefAssembly)
    {
      defaultMapKey = map.key;
      break;
    }
  }

  return new Species({
    typeKey: dto.speciesTypeKey,
    name: dto.name,
    defaultMapKey: defaultMapKey,
    maps: mapsList
  });
}

/**
 * Encapsulates all Species API calls
 */
export default class SpeciesApi
{
  static async getSpecies(): Promise<Species[]>
  {
    const speciesRes = await httpInstance.get<SpeciesDTO[]>(`/vcmap/species`);
    const speciesList: Species[] = speciesRes.data.map(dto => getSpeciesFromDTO(dto));
    return speciesList;
  }
}