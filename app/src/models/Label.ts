import DatatrackSection, { GeneDatatrack } from './DatatrackSection';
import Gene from './Gene';

interface LabelParams
{
  posX: number;
  posY: number;
  text: string;
  isVisible?: boolean;
  addClass?: string;
}

export default class Label
{
  posX: number = 0;
  posY: number = 0;
  text: string = '';
  isVisible: boolean = true;
  isHovered: boolean = false;
  addClass: string = "";

  constructor(params: LabelParams)
  {
    this.posX = params.posX;
    this.posY = params.posY;
    this.text = params.text;
    this.isVisible = params.isVisible ?? this.isVisible;
    this.addClass = params.addClass ?? this.addClass;
  }
}

export class GeneLabel extends Label
{
  genes: Gene[];
  rgdIds: number[];
  bpRange: { start: number, stop: number };
  //combinedLabels: GeneLabel[] = [];

  constructor(params: LabelParams, genes: Gene[])
  {
    super(params);
    this.genes = genes;
    this.rgdIds = genes.map(g => g.rgdId);
    this.bpRange = {
      start: Math.min(...genes.map(g => g.start)),
      stop: Math.max(...genes.map(g => g.stop)),
    };
  }

  addGenes(...genes: Gene[])
  {
    this.genes.push(...genes);
    this.rgdIds.push(...genes.map(g => g.rgdId));
    this.bpRange = {
      start: Math.min(...genes.map(g => g.start)),
      stop: Math.max(...genes.map(g => g.stop)),
    };
  }

  hasGene(gene: Gene)
  {
    return this.rgdIds.includes(gene.rgdId);
  }
}