import Gene from './Gene';
import Label, { GeneLabel } from './Label';
import GenomicSection, { BackboneAlignment, GenomicSectionParams, RenderType, WindowBasePairRange } from "./GenomicSection";

export type DatatrackSectionType = 'gene' | 'block' | 'qtl' | 'variant';

export interface LoadedGene
{
  genes: {
    [speciesName:string]: GeneDatatrack[]
  }
  backboneOrtholog?: GeneDatatrack,
}

type DatatrackSectionParams = GenomicSectionParams;

export default class DatatrackSection extends GenomicSection
{
  label?: Label;

  constructor(params: DatatrackSectionParams)
  {
    super(params);
  }

  public recalculateLabelYPositions()
  {
    if (this.label)
    {
      this.label.posY = (this.posY1 + this.posY2) / 2;
    }
  }
}

export class GeneDatatrack extends DatatrackSection
{
  gene: Gene; // gene that this datatrack represents

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

    this.gene = gene;
    this.opacity = 0.7;
    this.createGeneLabel();
  }

  private createGeneLabel()
  {
    this.label = new GeneLabel(
      {
        posX: 0, 
        posY: (this.posY1 + this.posY2) / 2, 
        text: this.gene.symbol,
        isVisible: true,
      },
      this.gene
    );
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
    const blueVal = Math.round((this.variantCount / maxCount) * 255);
    const redVal = Math.round(((maxCount - this.variantCount) / maxCount) * 255);
    let redHex = redVal.toString(16);
    redHex = redHex.length === 1 ? `0${redHex}` : redHex;
    let blueHex = blueVal.toString(16);
    blueHex = blueHex.length === 1 ? `0${blueHex}` : blueHex;
    this.elementColor = `#${redHex}00${blueHex}`;
  }
}
