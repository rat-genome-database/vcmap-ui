import { LoadedSpeciesGenes } from "./DatatrackSection";
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

  protected abstract adjustVisibleSet(backboneStart: number, backboneStop: number, masterGeneMap?: Map<number, LoadedSpeciesGenes>): void | Map<number, LoadedSpeciesGenes>;
  protected abstract createTitleLabels(): void;
}