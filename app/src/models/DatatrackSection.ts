import Gene from './Gene';
import Label, { GeneLabel } from './Label';
import GenomicSection, { BackboneAlignment, GenomicSectionParams, RenderType, WindowBasePairRange } from "./GenomicSection";

type DatatrackSectionType = 'gene' | 'block';

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

  constructor(gene: Gene, start: number, stop: number, backboneAlignment: BackboneAlignment, speciesName: string, mapName: string, chromosome: string, windowBasePairRange: WindowBasePairRange, renderType: RenderType)
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
    this.createGeneLabel();
  }

  private createGeneLabel()
  {
    this.label = new GeneLabel(
      {
        posX: 0, 
        posY: (this.posY1 + this.posY2) / 2, 
        text: this.gene.symbol,
        isVisible: false,
      },
      this.gene
    );
  }
}
