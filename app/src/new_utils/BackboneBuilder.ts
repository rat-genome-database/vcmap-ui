import BackboneSection, { RenderType } from "@/new_models/BackboneSection";
import Chromosome from "@/new_models/Chromosome";
import Species from "@/new_models/Species";

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