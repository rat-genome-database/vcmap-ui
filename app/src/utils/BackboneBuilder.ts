import BackboneSection from "@/models/BackboneSection";
import Chromosome from "@/models/Chromosome";
import Species from "@/models/Species";
import Gene from "@/models/Gene";
import DatatrackSection, { LoadedGene } from "@/models/DatatrackSection";
import BackboneSet from "@/models/BackboneSet";
import { RenderType } from "@/models/GenomicSection";
import { GenomicSectionFactory } from "@/models/GenomicSectionFactory";

export interface ProcessedGenomicData
{
  datatracks: DatatrackSection[],
  genes: Gene[],
}

/**
 * Creates a BackboneSection model
 */
export function createBackboneSection(species: Species, chromosome: Chromosome, startPos: number, stopPos: number,
                                      renderType: RenderType)
{
  const backbone = new BackboneSection({
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
  });

  return backbone;
}

export function backboneDatatrackBuilder(species: Species, genomicData: Gene[], backboneSection: BackboneSection)
{
  const masterGeneMap = new Map<number, LoadedGene>();
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

  genomicData.forEach((genomicElement: Gene) => {
    const geneDatatrackSection = factory.createGeneDatatrackSection({
      gene: genomicElement, 
      start: genomicElement.start, 
      stop: genomicElement.stop, 
      backboneAlignment: { start: genomicElement.start, stop: genomicElement.stop },
    });
    processedGenomicData.datatracks.push(geneDatatrackSection);

    // Map structure is { rgdId: { species: { gene: Gene, drawn: [{ svgY: number, svgX: number }] } } }
    masterGeneMap.set(genomicElement.rgdId, {
      backboneOrtholog: geneDatatrackSection,
      genes: {
        [species.name.toLowerCase()]: [],
      }
    });
  });

  return { backboneSection, masterGeneMap, processedGenomicData };
}

export function createBackboneSet(backbone: BackboneSection, genomicData?: ProcessedGenomicData)
{
  return new BackboneSet(backbone, genomicData);
}