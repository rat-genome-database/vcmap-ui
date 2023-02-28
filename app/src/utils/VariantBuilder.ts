import BackboneSection from "@/models/BackboneSection";
import { VariantDensity } from "@/models/DatatrackSection";

const BIN_SIZE = 1000000;

export function createVariantDatatracks(positions: number[], chromosome: any)
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
    const backboneSection = new BackboneSection({ start: binStart, stop: binStop, windowStart: 0, windowStop: chromosome.seqLength, renderType: 'detailed' });
    const newVariant = new VariantDensity({start: binStart, stop: binStop, backboneSection: backboneSection}, variantCounts[i], maxCount);
    newVariant.adjustYPositionsBasedOnVisibleStartAndStop(0, chromosome.seqLength);
    variantDatatracks.push(newVariant);
    binStart += BIN_SIZE;
  }
  
  return variantDatatracks;
}