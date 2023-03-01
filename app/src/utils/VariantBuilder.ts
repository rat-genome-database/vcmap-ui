import BackboneSection from "@/models/BackboneSection";
import { VariantDensity } from "@/models/DatatrackSection";
import { GenomicSectionFactory } from "@/models/GenomicSectionFactory";
import { BackboneAlignment } from "@/models/GenomicSection";

const BIN_SIZE = 1000000;

export function createVariantDatatracks(factory: GenomicSectionFactory, positions: number[], chromosome: any, windowStart: number, windowStop: number)
{
  const variantCounts: number[] = [];
  let binStart = 0;
  while (binStart < chromosome.seqLength)
  {
    const counts = positions.filter((pos) => pos >= binStart && pos < (binStart + BIN_SIZE));
    variantCounts.push(counts.length);
    binStart += BIN_SIZE;
  }
  const maxCount = Math.max(...variantCounts);
  binStart = 0;
  const variantDatatracks = [];
  for (let i = 0; i < variantCounts.length; i++)
  {
    const binStop = Math.max(binStart + BIN_SIZE, chromosome.seqLength);
    const backboneAlignment: BackboneAlignment = { start: binStart, stop: binStop };
    const newVariant = factory.createVariantDensitySection(variantCounts[i], maxCount, binStart, binStop, backboneAlignment);
    newVariant.adjustYPositionsBasedOnVisibleStartAndStop({start: windowStart, stop: windowStop});
    variantDatatracks.push(newVariant);
    binStart += BIN_SIZE;
  }
  
  return variantDatatracks;
}