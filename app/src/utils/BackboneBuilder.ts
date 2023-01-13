import BackboneSection, { RenderType } from "@/models/BackboneSection";
import Chromosome from "@/models/Chromosome";
import Species from "@/models/Species";
import Gene from "@/models/Gene";
import DatatrackSection, { LoadedGene, GeneDatatrack } from "@/models/DatatrackSection";
import BackboneSet from "@/models/BackboneSet";
import { GeneLabel } from "@/models/Label";

export interface ProcessedGenomicData
{
  datatracks: DatatrackSection[],
  genes: Gene[],
}

/**
 * Creates the backbone track model and sets the viewbox height based on the size of the backbone track
 */
export function createBackboneSection(species: Species, chromosome: Chromosome, startPos: number, stopPos: number, renderType: RenderType)
{
  const backbone = new BackboneSection({
    chromosome: chromosome.chromosome,
    species: species,
    speciesName: species.name,
    start: startPos,
    stop: stopPos,
    windowStart: startPos,
    windowStop: stopPos,
    renderType: renderType,
    createLabels: true,
  });

  return backbone;
}

export function backboneDatatrackBuilder(genomicData: Gene[], backboneSection: BackboneSection, windowStart: number, windowStop: number,)
{
  const masterGeneMap = new Map<number, LoadedGene>();
  const species = backboneSection.speciesName;

  const processedGenomicData: ProcessedGenomicData = {
    datatracks: [],
    genes: genomicData,
  };

  genomicData.forEach((genomicElement: Gene) => {
    const geneBackboneSection = new BackboneSection({ start: genomicElement.start, stop: genomicElement.stop, windowStart: windowStart, windowStop: windowStop, renderType: 'detailed' });
    const geneDatatrackSection = new GeneDatatrack({ start: genomicElement.start, stop: genomicElement.stop, backboneSection: geneBackboneSection }, genomicElement);
    const geneLabel = new GeneLabel({
        posX: 0,
        posY: (geneDatatrackSection.posY1 + geneDatatrackSection.posY2) / 2,
        text: geneDatatrackSection.gene.symbol,
      },
      geneDatatrackSection.gene
    );
    geneDatatrackSection.label = geneLabel;

    processedGenomicData.datatracks.push(geneDatatrackSection);
    // Map structure is { rgdId: { species: { gene: Gene, drawn: [{ svgY: number, svgX: number }] } } }
    masterGeneMap.set(genomicElement.rgdId, {
      backboneOrtholog: geneDatatrackSection,
      genes: {
        [species.toLowerCase()]: [],
      }
    });
  });

  return { backboneSection, masterGeneMap, processedGenomicData };
}

export function createBackboneSet(backbone: BackboneSection, genomicData?: ProcessedGenomicData)
{
  return new BackboneSet(backbone, genomicData);
}