import Label from "./Label";

/**
 * Represents a Set of Genomic Data
 */
export abstract class GenomicSet
{
  speciesName: string;
  mapName: string;
  titleLabels: Label[] = [];

  constructor(speciesName?: string, mapName?: string)
  {
    this.speciesName = speciesName ?? '';
    this.mapName = mapName ?? '';
  }

  protected abstract createTitleLabels(): void;
}