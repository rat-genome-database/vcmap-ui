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

    this.gene = gene.clone();
    this.opacity = 0.7;
    //this.createGeneLabel();
  }

  // private createGeneLabel()
  // {
  //   this.label = new GeneLabel(
  //     {
  //       posX: 0, 
  //       posY: (this.posY1 + this.posY2) / 2, 
  //       text: this.gene.symbol,
  //       isVisible: false,
  //     },
  //     [this.gene]
  //   );
  // }
}

export class VariantDensity extends DatatrackSection
{
  variantCount: number; // number of variants contained within the datatrack section
  constructor(variantCount: number, maxDensity: number, start: number, stop: number, backboneAlignment: BackboneAlignment, speciesName: string, mapName: string, chromosome: string, windowBasePairRange: WindowBasePairRange, renderType: RenderType)
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
    if (maxDensity !== 0)
    {
      this.setDensityColor(maxDensity);
    }
  }

  setDensityColor(maxDensity: number) {
    // Number of variants per 1.0 Mbp
    const variantDensity = this.calculateVariantDensity();
    const blueVal = Math.round(((maxDensity - variantDensity) / maxDensity) * 255);
    const redVal = Math.round((variantDensity / maxDensity) * 255);
    let redHex = redVal.toString(16);
    redHex = redHex.length === 1 ? `0${redHex}` : redHex;
    let blueHex = blueVal.toString(16);
    blueHex = blueHex.length === 1 ? `0${blueHex}` : blueHex;
    this.elementColor = `#${redHex}00${blueHex}`;
  }

  calculateVariantDensity() {
    return (this.variantCount / Math.abs(this.speciesStop - this.speciesStart)) * 1000000;
  }
}
