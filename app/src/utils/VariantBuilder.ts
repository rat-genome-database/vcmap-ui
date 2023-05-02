import { GenomicSectionFactory } from "@/models/GenomicSectionFactory";
import { BackboneAlignment } from "@/models/GenomicSection";
import VariantPositions from "@/models/VariantPositions";
import VariantApi from "@/api/VariantApi";
import Species from "@/models/Species";
import BackboneSection from "@/models/BackboneSection";
import { VariantDensity } from "@/models/DatatrackSection";
import { processAlignmentsOfGeneInsideOfViewport, processAlignmentsOfGeneOutsideOfViewport } from "./Shared";
import Block from "@/models/Block";

const NUM_BINS = 100; // For whole window per species
const MIN_BIN_SIZE = 10000; // Smallest size for a variant density datatrack (in species base pairs)

export function createVariantDatatracks(factory: GenomicSectionFactory, positions: number[],
  sequenceStart: number, sequenceStop: number, backboneStart: number, backboneStop: number,
  invertedBlock: boolean, targetBlock?: Block): {datatracks: VariantDensity[], maxCount: number, binSize: number}
{
  const seqLength = sequenceStop - sequenceStart;
  const backboneWindowStart = factory.windowBasePairRange.start;
  const backboneWindowStop = factory.windowBasePairRange.stop;

  // NOTE: to make sure counts are consistent within an off-backbone species, just go off the backbone size
  const binSize = Math.max(Math.round((backboneWindowStop - backboneWindowStart) / NUM_BINS), MIN_BIN_SIZE);
  // But then need to translate this "binSize" to what it would be for the backbone to increment backbone alignments
  const backboneBinSize = Math.round(((backboneStop - backboneStart) / seqLength) * binSize);

  // Ensure at least one bin for every section
  const numBinsForSection = Math.max(Math.round(seqLength / binSize), 1);
  const variantCounts: number[] = new Array(numBinsForSection).fill(0);
  let binStart = sequenceStart;

  for (let i = 0; i < positions.length; i++)
  {
    const binIdx = Math.min(Math.floor((positions[i] - sequenceStart) / binSize), numBinsForSection - 1);
    variantCounts[binIdx]++;
  }
  const maxCount = getMaxVariantCount(variantCounts);
  const variantDatatracks = [];
  let backboneBinStart = backboneStart;
  binStart = sequenceStart;
  // NOTE: building the datatrack sections is really slow when zoomed in, so I should only build
  // tracks for visible portions, and then keep track of the max counts for the overall color scale
  if (invertedBlock)
  {
    let backboneBinStop = backboneStop;
    for (let i = 0; i < variantCounts.length; i++)
    {
      const binStop = Math.min(binStart + binSize, sequenceStop);
      const backboneBinStart = Math.max(backboneBinStop - backboneBinSize, backboneStart);
      const backboneAlignment = getBackboneAlignment(binStart, binStop, backboneBinStart, backboneBinStop,
        backboneWindowStart, backboneWindowStop, targetBlock);
      if (isSectionInView(backboneAlignment.start, backboneAlignment.stop, backboneWindowStart, backboneWindowStop))
      {
        const newVariant = factory.createVariantDensitySection(variantCounts[i], maxCount, binStart, binStop, backboneAlignment);
        newVariant.adjustYPositionsBasedOnVisibleStartAndStop(factory.windowBasePairRange);
        variantDatatracks.push(newVariant);
      }
      binStart += binSize;
      backboneBinStop -= backboneBinSize;
    }
  }
  else
  {
    for (let i = 0; i < variantCounts.length; i++)
    {
      const binStop = Math.min(binStart + binSize, sequenceStop);
      const backboneBinStop = Math.min(backboneBinStart + backboneBinSize, backboneStop);
      const backboneAlignment = getBackboneAlignment(binStart, binStop, backboneBinStart, backboneBinStop,
        backboneWindowStart, backboneWindowStop, targetBlock);
      if (isSectionInView(backboneAlignment.start, backboneAlignment.stop, backboneWindowStart, backboneWindowStop))
      {
        const newVariant = factory.createVariantDensitySection(variantCounts[i], maxCount, binStart, binStop, backboneAlignment);
        newVariant.adjustYPositionsBasedOnVisibleStartAndStop(factory.windowBasePairRange);
        variantDatatracks.push(newVariant);
      }
      binStart += binSize;
      backboneBinStart += backboneBinSize;
    }
  }

  return {datatracks: variantDatatracks, maxCount: maxCount, binSize: binSize};
}


export async function buildVariantPositions(chromosome: string, bpStart: number, bpStop: number,
  backboneStart: number, backboneStop: number, mapKey: number)
{
  const positions = await VariantApi.getVariants(chromosome, bpStart, bpStop, mapKey);
  return new VariantPositions({
      mapKey: mapKey,
      chromosome: chromosome,
      positions: positions,
      blockStart: bpStart,
      blockStop: bpStop,
      backboneStart: backboneStart,
      backboneStop: backboneStop,
  });
}

export function backboneVariantTrackBuilder(species: Species, variantPositions: VariantPositions, backboneSection: BackboneSection)
{
  const factory = new GenomicSectionFactory(
    species.name,
    species.activeMap.name,
    backboneSection.chromosome,
    backboneSection.windowBasePairRange,
    backboneSection.renderType
  );

  const variantDatatracks = createVariantDatatracks(
    factory,
    variantPositions.positions,
    variantPositions.backboneStart,
    variantPositions.backboneStop,
    variantPositions.backboneStart,
    variantPositions.backboneStop,
    false
  );

  return variantDatatracks;
}

// NOTE: variant counts arrays can be really big so Math.max doesn't work
export function getMaxVariantCount(counts: number[]) {
  // NOTE variants counts won't be negative, so setting initial max to 0 instead of -Infinity
  let max = 0;
  for (let i = 0; i < counts.length; i++)
  {
    if (counts[i] > max)
    {
      max = counts[i];
    }
  }

  return max;
}

function isSectionInView(start: number, stop: number, backboneStart: number, backboneStop: number)
{
  return (start > backboneStart && start < backboneStop)
    || (stop < backboneStop && stop > backboneStart)
    || (start < backboneStart && stop > backboneStop);
}

function getBackboneAlignment(binStart: number, binStop: number,
  backboneStart: number, backboneStop: number, backboneWindowStart: number,
  backboneWindowStop: number, targetBlock?: Block): BackboneAlignment
{
  if (targetBlock) {
    if (isSectionInView(targetBlock.backboneStart, targetBlock.backboneStop, backboneWindowStart, backboneWindowStop)) {
      return processAlignmentsOfGeneInsideOfViewport(binStart, binStop, targetBlock);
    } else {
      return processAlignmentsOfGeneOutsideOfViewport(binStart, binStop, targetBlock);
    }
  } else {
    return { start: backboneStart, stop: backboneStop};
  }
}