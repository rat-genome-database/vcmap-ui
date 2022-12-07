import BackboneSection, { RenderType } from "@/new_models/BackboneSection";
import Chromosome from "@/new_models/Chromosome";
import Species from "@/new_models/Species";
import { SyntenyComponent } from "@/new_api/SyntenyApi";
import Gene from "@/new_models/Gene";
import DatatrackSection from "@/new_models/DatatrackSection";

/**
 * Creates the backbone track model and sets the viewbox height based on the size of the backbone track
 */
export function createBackboneTrack(species: Species, chromosome: Chromosome, startPos: number, stopPos: number, renderType: RenderType)
{
  const backbone = new BackboneSection({
    chromosome: chromosome.chromosome,
    species: species,
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
  const masterGeneMap = new Map<number, any>();

  const processedGenomicData: DatatrackSection[] = [];
  genomicData.forEach((genomicElement: Gene) => {
    const currSpecies = genomicElement.speciesName.toLowerCase();
    const geneBackboneSection = new BackboneSection({ start: genomicElement.start, stop: genomicElement.stop, windowStart: windowStart, windowStop: windowStop, renderType: 'detailed' });
    const geneDatatrackSection = new DatatrackSection({ start: genomicElement.start, stop: genomicElement.stop, backboneSection: geneBackboneSection, type: 'gene', });
    geneDatatrackSection.posX1 = 370;

    processedGenomicData.push(geneDatatrackSection);
    // Map structure is { rgdId: { species: { gene: Gene, drawn: [{ svgY: number, svgX: number }] } } }
    masterGeneMap.set(genomicElement.rgdId, { [currSpecies]: { drawn: [{gene: geneDatatrackSection, svgY: geneBackboneSection.posY1, svgX: geneBackboneSection.posX1 ?? 370 }]} });
  });

  backboneSection.datatrackSections = processedGenomicData;
  return { backboneSection, masterGeneMap };
}