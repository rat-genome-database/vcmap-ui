import { GenomicSectionFactory } from "@/models/GenomicSectionFactory";
import { BackboneAlignment } from "@/models/GenomicSection";
import VariantPositions from "@/models/VariantPositions";
import VariantApi from "@/api/VariantApi";
import Species from "@/models/Species";
import BackboneSection from "@/models/BackboneSection";
import { VariantDensity } from "@/models/DatatrackSection";

const NUM_BINS = 200; // For whole window per species

export function createVariantDatatracks(factory: GenomicSectionFactory, positions: number[],
  sequenceStart: number, sequenceStop: number, backboneStart: number, backboneStop: number, invertedBlock: boolean): VariantDensity[]
{
  const seqLength = sequenceStop - sequenceStart;
  const backboneWindowStart = factory.windowBasePairRange.start;
  const backboneWindowStop = factory.windowBasePairRange.stop;
  let speciesWindowStart;
  let speciesWindowStop;
  if (invertedBlock)
  {
    speciesWindowStart = backboneStart > backboneWindowStart ? sequenceStop
      : Math.round(sequenceStop - (seqLength / (backboneStop - backboneStart)) * (backboneWindowStart - backboneStart));
    speciesWindowStop = backboneStop < backboneWindowStop ? sequenceStart
      : Math.round(sequenceStart + (seqLength / (backboneStop - backboneStart)) * (backboneStop - backboneWindowStop));
  }
  else
  {
    speciesWindowStart = backboneStart > backboneWindowStart ? sequenceStart
      : Math.round(sequenceStart + (seqLength / (backboneStop - backboneStart)) * (backboneWindowStart - backboneStart));
    speciesWindowStop = backboneStop < backboneWindowStop ? sequenceStop
      : Math.round(sequenceStop - (seqLength / (backboneStop - backboneStart)) * (backboneStop - backboneWindowStop));
  }

  const speciesWindowSequenceLength = Math.abs(speciesWindowStop - speciesWindowStart);
  const visibleBackboneSectionLength = Math.min(backboneStop, backboneWindowStop) - Math.max(backboneStart, backboneWindowStart);
  const visibleSectionWindowFraction = (visibleBackboneSectionLength) / (backboneWindowStop - backboneWindowStart);
  const numBinsForSection = Math.ceil(NUM_BINS * visibleSectionWindowFraction);
  const binSize = Math.round(speciesWindowSequenceLength / numBinsForSection);
  // Preallocate counts array with number of bins we'll have
  const variantCounts: number[] = new Array(numBinsForSection).fill(0);
  let binStart = invertedBlock ? speciesWindowStop : speciesWindowStart;
  const backboneBinSize = Math.round(binSize * (visibleBackboneSectionLength) / speciesWindowSequenceLength);
  // Only loop through positions array once and count based on what bin it should be in
  // NOTE: this assumes we have bins of equal size, if we ever want different bin sizes
  // in the same rendered view we'll need to adjust this
  for (let i = 0; i < positions.length; i++)
  {
    if (invertedBlock)
    {
      if (positions[i] >= speciesWindowStop && positions[i] <= speciesWindowStart)
      {
        const binIdx = Math.min(Math.floor((positions[i] - speciesWindowStop) / binSize), numBinsForSection - 1)
        variantCounts[binIdx]++;
      }
    }
    else
    {
      if (positions[i] >= speciesWindowStart && positions[i] <= speciesWindowStop)
      {
        const binIdx = Math.min(Math.floor((positions[i] - speciesWindowStart) / binSize), numBinsForSection - 1);
        variantCounts[binIdx]++;
      }
    }
  }

  const maxCount = Math.max(...variantCounts);
  const variantDatatracks = [];
  if (invertedBlock)
  {
    let backboneBinStop = Math.min(backboneStop, backboneWindowStop);
    binStart = speciesWindowStop;
    for (let i = 0; i < variantCounts.length; i++)
    {
      const binStop = Math.min(binStart + binSize, speciesWindowStart);
      const backboneBinStart = Math.max(backboneBinStop - backboneBinSize, backboneStart);
      const backboneAlignment: BackboneAlignment = { start: backboneBinStart, stop: backboneBinStop };
      const newVariant = factory.createVariantDensitySection(variantCounts[i], maxCount, binStart, binStop, backboneAlignment);
      newVariant.adjustYPositionsBasedOnVisibleStartAndStop(factory.windowBasePairRange);
      variantDatatracks.push(newVariant);
      binStart += binSize;
      backboneBinStop -= backboneBinSize;
    }
  }
  else
  {
    let backboneBinStart = Math.max(backboneStart, backboneWindowStart);
    binStart = speciesWindowStart;
    for (let i = 0; i < variantCounts.length; i++)
    {
      const binStop = Math.min(binStart + binSize, speciesWindowStop);
      const backboneBinStop = Math.min(backboneBinStart + backboneBinSize, backboneStop);
      const backboneAlignment: BackboneAlignment = { start: backboneBinStart, stop: backboneBinStop };
      const newVariant = factory.createVariantDensitySection(variantCounts[i], maxCount, binStart, binStop, backboneAlignment);
      newVariant.adjustYPositionsBasedOnVisibleStartAndStop(factory.windowBasePairRange);
      variantDatatracks.push(newVariant);
      binStart += binSize;
      backboneBinStart += backboneBinSize;
    }
  }
  return variantDatatracks;
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
    backboneSection.windowBasePairRange.start,
    backboneSection.windowBasePairRange.stop,
    backboneSection.windowBasePairRange.start,
    backboneSection.windowBasePairRange.stop,
    false
  );

  return variantDatatracks;
}
