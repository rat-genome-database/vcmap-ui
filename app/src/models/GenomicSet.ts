import { SelectedRegion } from "./BackboneSelection";
import { SyntenyRegionData } from "@/api/SyntenyApi";
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

  protected abstract adjustVisibleSet(visibleBackboneStart: number, visibleBackboneStop: number, updateCache: boolean, bufferzone: SelectedRegion, threshold: number, updateData?: SyntenyRegionData[]): void;
  protected abstract createTitleLabels(): void;
}