import BackboneSection from "@/models/BackboneSection";
import Chromosome from "@/models/Chromosome";
import Species from "@/models/Species";
import Gene from "@/models/Gene";
import DatatrackSection from "@/models/DatatrackSection";
import BackboneSet from "@/models/BackboneSet";
import { RenderType } from "@/models/GenomicSection";
import { GenomicSectionFactory } from "@/models/GenomicSectionFactory";
import { getThreshold } from "./Shared";
import SpeciesMap from "@/models/SpeciesMap";
import logger from "@/logger";

export interface ProcessedGenomicData
{
  datatracks: DatatrackSection[],
  genes: Gene[],
}

/**
 * Creates a BackboneSection model
 */
export function createBackboneSection(species: Species, chromosome: Chromosome, startPos: number, stopPos: number,
                                      renderType: RenderType, order: number)
{
  return new BackboneSection({
    chromosome: chromosome.chromosome,
    species: species,
    start: startPos,
    stop: stopPos,
    windowBasePairRange: {
      start: startPos,
      stop: stopPos,
    },
    renderType: renderType,
    createLabels: true,
    order,
  });
}

export function backboneDatatrackBuilder(species: Species, genomicData: Gene[], backboneSection: BackboneSection)
{
  // const masterGeneMap = new Map<number, LoadedGene>();
  const processedGenomicData: ProcessedGenomicData = {
    datatracks: [],
    genes: genomicData,
  };

  // Create all gene datatrack sections with same species, chromosome, visible window range, etc
  const factory = new GenomicSectionFactory(
    species.name,
    species.activeMap.name, 
    backboneSection.chromosome, 
    backboneSection.windowBasePairRange, 
    backboneSection.renderType
  );

  const visibleBPRange = backboneSection.windowBasePairRange.stop - backboneSection.windowBasePairRange.start;
  let filteredGeneCount = 0;
  // NOTE: Intentionally using a basic for loop here to avoid extra functions on the call stack
  for (let i = 0, len = genomicData.length; i < len; i++)
  {
    const genomicElement = genomicData[i];

    // Skip any genes that are deemed too small for rendering
    if (Math.abs(genomicElement.stop - genomicElement.start) < getThreshold(visibleBPRange))
    {
      filteredGeneCount++;
      continue;
    }

    const geneDatatrackSection = factory.createGeneDatatrackSection({
      gene: genomicElement,
      start: genomicElement.start,
      stop: genomicElement.stop,
      backboneAlignment: { start: genomicElement.start, stop: genomicElement.stop },
    });
    processedGenomicData.datatracks.push(geneDatatrackSection);
  }

  logger.debug(`Filtered out gene count for backbone: ${filteredGeneCount}`);
  return { backboneSection, processedGenomicData };
}

export function createBackboneSet(backbone: BackboneSection, order: number, backboneMap: SpeciesMap, genomicData?: ProcessedGenomicData)
{
  return new BackboneSet(backbone, order, backboneMap, genomicData);
}