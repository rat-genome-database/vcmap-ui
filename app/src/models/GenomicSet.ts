import Label from "./Label";
import SpeciesMap from "./SpeciesMap";

/**
 * Represents a Set of Genomic Data
 */
export abstract class GenomicSet
{
  speciesName: string;
  mapName: string;
  titleLabels: Label[] = [];
  mapKey: number;

  constructor(speciesName?: string, map?: SpeciesMap)
  {
    this.speciesName = speciesName ?? '';
    this.mapName = map?.name ?? '';
    this.mapKey = map?.key ?? 0;
  }

  protected abstract createTitleLabels(): void;
}