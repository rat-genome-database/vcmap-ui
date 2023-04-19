import { GeneDatatrack, VariantDensity } from "./DatatrackSection";
import Gene from "./Gene";
import { WindowBasePairRange, RenderType, BackboneAlignment } from "./GenomicSection";
import SyntenySection, { Orientation, SyntenySectionType } from "./SyntenySection";

/**
 * Factory class used for more easily creating different types of GenomicSections with the same
 * species, chromosome, windowBasePairRange, and renderType data
 */
export class GenomicSectionFactory
{
  speciesName: string;
  mapName: string;
  chromosome: string;
  windowBasePairRange: WindowBasePairRange;
  renderType: RenderType;

  constructor(speciesName: string, mapName: string, chromosome: string, windowBasePairRange: WindowBasePairRange, renderType: RenderType)
  {
    this.speciesName = speciesName;
    this.mapName = mapName;
    this.chromosome = chromosome;
    this.windowBasePairRange = windowBasePairRange;
    this.renderType = renderType;
  }

  /**
   * Creates a SyntenySection
   */
  createSyntenySection(params: {start: number, stop: number, backboneAlignment: BackboneAlignment, type: SyntenySectionType, orientation: Orientation, chainLevel: number, isGapless?: boolean})
  {
    const {
      start,
      stop,
      backboneAlignment,
      type,
      orientation,
      chainLevel,
      isGapless,
    } = params;

    return new SyntenySection({
      speciesName: this.speciesName,
      mapName: this.mapName,
      chromosome: this.chromosome,
      windowBasePairRange: this.windowBasePairRange,
      renderType: this.renderType,
      start: start,
      stop: stop,
      backboneAlignment: backboneAlignment,
      type: type,
      orientation: orientation,
      chainLevel: chainLevel,
      isGapless: isGapless,
    });
  }

  /** 
   * Creates a GeneDatatrackSection
   */
  createGeneDatatrackSection(params: {gene: Gene, start: number, stop: number, backboneAlignment: BackboneAlignment}): GeneDatatrack
  {
    const {
      gene,
      start,
      stop,
      backboneAlignment,
    } = params;

    return new GeneDatatrack(gene, start, stop, backboneAlignment, this.speciesName, this.mapName, this.chromosome, this.windowBasePairRange, this.renderType);
  }

  /**
   * Creates a new VariantDensity datatrack section
   */
  createVariantDensitySection(variantCount: number, maxDensity: number, start: number, stop: number, backboneAlignment: BackboneAlignment): VariantDensity
  {
    return new VariantDensity(variantCount, maxDensity, start, stop, backboneAlignment, this.speciesName, this.mapName, this.chromosome, this.windowBasePairRange, this.renderType);
  }
}