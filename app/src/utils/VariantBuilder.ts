import { GenomicSectionFactory } from "@/models/GenomicSectionFactory";
import { BackboneAlignment } from "@/models/GenomicSection";
import VariantPositions from "@/models/VariantPositions";
import VariantApi from "@/api/VariantApi";
import Species from "@/models/Species";
import BackboneSection from "@/models/BackboneSection";
import { VariantDensity } from "@/models/DatatrackSection";

const BIN_SIZE = 1000000;

/**
 *
 * @param factory the GenomicSectionFactory to use to build the datatracks
 * @param positions array of variants positions
 * @param sequenceStart sequenceStart represents the start bp for the region of this set of variants
 * @param sequenceStop  sequenceStop represents the stop bp for the region of this set of variants
 * @param backboneStart backboneStart represents the backbone start bp equivalent for the start of this set of variants
 * @param backboneStop  backboneStop represents the backbone stop bp equivalent for the stop of this set of variants
 * @returns VariantDensity[]
 */
export function createVariantDatatracks(factory: GenomicSectionFactory, positions: number[],
  sequenceStart: number, sequenceStop: number, backboneStart: number, backboneStop: number): VariantDensity[]
{
  const seqLength = sequenceStop - sequenceStart;
  const numBins = Math.ceil(seqLength / BIN_SIZE);
  // Preallocate counts array with number of bins we'll have
  const variantCounts: number[] = new Array(numBins).fill(0);
  let binStart = sequenceStart;
  const backboneBinSize = Math.round(BIN_SIZE * (backboneStop - backboneStart) / seqLength);
  console.log('before count loop');
  // Only loop through positions array once and count based on what bin it should be in
  // NOTE: this assumes we have bins of equal size, if we ever want different bin sizes
  // in the same rendered view we'll need to adjust this
  for (let i = 0; i < positions.length; i++)
  {
    const binIdx = Math.floor(positions[i] / BIN_SIZE);
    variantCounts[binIdx]++;
  }

  const maxCount = Math.max(...variantCounts);
  let backboneBinStart = backboneStart;
  binStart = sequenceStart;
  const variantDatatracks = [];
  for (let i = 0; i < variantCounts.length; i++)
  {
    const binStop = Math.min(binStart + BIN_SIZE, sequenceStop);
    const backboneBinStop = Math.min(backboneBinStart + backboneBinSize, backboneStop);
    const backboneAlignment: BackboneAlignment = { start: backboneBinStart, stop: backboneBinStop };
    const newVariant = factory.createVariantDensitySection(variantCounts[i], maxCount, binStart, binStop, backboneAlignment);
    newVariant.adjustYPositionsBasedOnVisibleStartAndStop(factory.windowBasePairRange);
    variantDatatracks.push(newVariant);
    binStart += BIN_SIZE;
    backboneBinStart += backboneBinSize;
  }
  return variantDatatracks;
}


export async function buildVariantPositions(chromosome: string, bpStart: number, bpStop: number, mapKey: number)
{
  const positions = await VariantApi.getVariants(chromosome, bpStart, bpStop, mapKey)
  if (positions.length > 0)
  {
    return new VariantPositions({
        mapKey: mapKey,
        chromosome: chromosome,
        positions: positions,
        backboneStart: bpStart,
        backboneStop: bpStop,
    });
  }
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
    variantPositions.backboneStart || 0,
    variantPositions.backboneStop || 0,
    variantPositions.backboneStart || 0,
    variantPositions.backboneStop || 0,
  );

  return variantDatatracks;
}