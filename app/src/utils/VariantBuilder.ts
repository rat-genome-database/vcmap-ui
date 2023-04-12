import { GenomicSectionFactory } from "@/models/GenomicSectionFactory";
import { BackboneAlignment } from "@/models/GenomicSection";
import VariantPositions from "@/models/VariantPositions";
import VariantApi from "@/api/VariantApi";
import Species from "@/models/Species";
import BackboneSection from "@/models/BackboneSection";

const BIN_SIZE = 1000000;

export function createVariantDatatracks(factory: GenomicSectionFactory, positions: number[], chromosome: any,
  sequenceStart: number, sequenceStop: number, backboneStart: number, backboneStop: number)
{
  const variantCounts: number[] = [];
  const seqLength = sequenceStop - sequenceStart;
  let binStart = sequenceStart;
  const backboneBinSize = Math.round(BIN_SIZE * (backboneStop - backboneStart) / seqLength);
  while (binStart < sequenceStop)
  {
    const counts = positions.filter((pos) => pos >= binStart && pos < (binStart + BIN_SIZE));
    variantCounts.push(counts.length);
    binStart += BIN_SIZE;
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
    backboneSection.chromosome,
    backboneSection.speciesStart,
    backboneSection.speciesStop,
    backboneSection.speciesStart,
    backboneSection.speciesStop,
  );

  return variantDatatracks;
}