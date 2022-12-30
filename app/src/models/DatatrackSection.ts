import BackboneSection from "./BackboneSection";
import Gene from './Gene';
import Label, { GeneLabel } from './Label';
import GenomicSection from "./GenomicSection";

type DatatrackSectionType = 'gene';

// TODO: See if this can be simplified to just [speciesName: string]: GeneDataTrack[]
export interface LoadedSpeciesGenes
{
  [speciesName:string]: {
    drawn: {
      gene: GeneDatatrack,
      // Are these necessary anymore? Orthologs are drawn using gene datatrack section positions...
      svgY: number;
      svgX: number;
    }[];
  };
}

interface DatatrackSectionParams
{
  start: number;
  stop: number;
  backboneSection: BackboneSection;
}

export default class DatatrackSection extends GenomicSection
{
  label?: Label;

  constructor(params: DatatrackSectionParams, type: DatatrackSectionType, elementColor: string)
  {
    super(params.start, params.stop, type, elementColor, params.backboneSection);
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

  constructor(params: DatatrackSectionParams, gene: Gene)
  {
    super(params, 'gene', '#00000');
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
