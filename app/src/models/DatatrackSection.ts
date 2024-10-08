import Gene from './Gene';
import Label from './Label';
import GenomicSection, { BackboneAlignment, GenomicSectionParams, RenderType, WindowBasePairRange } from "./GenomicSection";
import OrthologLine from './OrthologLine';
import { Formatter } from '@/utils/Formatter';

export type DatatrackSectionType = 'gene' | 'qtl' | 'variant';

type DatatrackSectionParams = GenomicSectionParams;

/**
 * General representation of a DatatrackSection element. Defined as abstract in order
 * to force implementation of any abstract methods of GenomicSection in its subclasses.
 */
export default abstract class DatatrackSection extends GenomicSection
{
  label?: Label;

  constructor(params: DatatrackSectionParams)
  {
    super(params);
  }
}

export class GeneDatatrack extends DatatrackSection
{
  gene: Gene; // gene that this datatrack represents
  lines: OrthologLine[] = [];

  constructor(gene: Gene, start: number, stop: number, backboneAlignment: BackboneAlignment, speciesName: string,
              mapName: string, chromosome: string, windowBasePairRange: WindowBasePairRange, renderType: RenderType)
  {
    super({
      start: start,
      stop: stop,
      backboneAlignment: backboneAlignment,
      speciesName: speciesName,
      mapName: mapName,
      chromosome: chromosome,
      windowBasePairRange: windowBasePairRange,
      renderType: renderType,
      type: 'gene',
      color: '#00000',
    });

    this.gene = gene.clone();
    this.opacity = 0.7;
  }

  public toHoveredData(): string[] {
    return [
      this.gene.symbol,
      Formatter.truncate(this.gene.name, 30),
      this.speciesName,
      `Chr${this.chromosome}: ${Formatter.addCommasToBasePair(this.gene.start)} - ${Formatter.addCommasToBasePair(this.gene.stop)}`,
      `Orthologs: ${this.gene.orthologs.length}`,
    ];
  }
}

export class VariantDensity extends DatatrackSection
{
  variantCount: number; // number of variants contained within the datatrack section
  constructor(variantCount: number, maxCount: number, start: number, stop: number, backboneAlignment: BackboneAlignment, speciesName: string, mapName: string, chromosome: string, windowBasePairRange: WindowBasePairRange, renderType: RenderType)
  {
    super({
      start: start,
      stop: stop,
      backboneAlignment: backboneAlignment,
      speciesName: speciesName,
      mapName: mapName,
      chromosome: chromosome,
      windowBasePairRange: windowBasePairRange,
      renderType: renderType,
      type: 'variant',
      color: '#FFFFFF',
    });
    this.variantCount = variantCount;
    // NOTE: setting the color is very preliminary, this will likely change
    // and I want to add a lot more structure around it.
    // Only change the color if there are variants for this section, otherwise leave as white
    if (maxCount !== 0)
    {
      this.setSectionColor(maxCount);
    }
  }

  // TODO: Will need option to adjust color scheme for colorblind users
  setSectionColor(maxCount: number) {
    // Define the hue range for the gradient (e.g., purple to red)
    const hueRange = { min: 15, max: 250 }; // Example values
    const hue = ((maxCount - this.variantCount) / maxCount) * (hueRange.max - hueRange.min) + hueRange.min;

    //find hue value as a fraction of hue range (eg, 250 - 15 = 235. if hue = 200, then 185/235 is about 0.79)
    const huePercentage = ((hue - hueRange.min) / (hueRange.max - hueRange.min));
    
    //scale lightness to variant density. 
    //TODO: if 0 is too dark, this could be calculated on a 50 - 100 scale for example
    const lightness = 100 * huePercentage; // Example value, can be adjusted
    
    //scale chroma to density 0.5 to 0
    const chroma = 0.5 - (huePercentage / 2);

    // Set the color using OKLCH format
    this.elementColor = `oklch(${lightness}% ${chroma} ${hue})`;
  }

  public toHoveredData(): string[] {
    return [
      `Chr${this.chromosome}: ${Formatter.addCommasToBasePair(this.speciesStart)} - ${Formatter.addCommasToBasePair(this.speciesStop)}`,
      `Variant Count: ${this.variantCount}`,
    ];
  }
}
