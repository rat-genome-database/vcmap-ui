import SpeciesMap from "@/new_models/SpeciesMap";
import httpInstance from "./httpInstance";

/**
 * Expected Map model returned from the RGD Rest API
 */
export interface SpeciesMapDTO
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
export function getSpeciesMapFromDTO(dto: SpeciesMapDTO)
{
  return new SpeciesMap({
    key: dto.key,
    name: dto.name,
    primaryRefAssembly: dto.primaryRefAssembly
  });
}

/**
 * Encapsulates all Maps API calls
 */
export default class MapsApi
{
  static async getMaps(speciesTypeKey: Number):  Promise<SpeciesMap[]>
  {
    const res = await httpInstance.get<SpeciesMapDTO[]>(`/lookup/maps/${speciesTypeKey}`);
    const mapsList: SpeciesMap[] = res.data.map(dto => getSpeciesMapFromDTO(dto));
    return mapsList;
  }
}