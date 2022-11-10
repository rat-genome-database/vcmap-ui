import Species from "@/new_models/Species";
import SpeciesMap from "@/new_models/SpeciesMap";
import httpInstance from './httpInstance';
import { getSpeciesMapFromDTO, SpeciesMapDTO } from "./MapsApi";

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