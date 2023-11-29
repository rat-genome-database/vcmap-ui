import { Formatter } from '@/utils/Formatter';
import Gene from './Gene';
import { IHoverableData } from './HoveredData';

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

export class GeneLabel extends Label implements IHoverableData
{
  genes: Gene[];
  rgdIds: number[];

  constructor(params: LabelParams, genes: Gene[])
  {
    super(params);
    this.genes = genes;
    this.rgdIds = genes.map(g => g.rgdId);
    if (this.genes.length > 0)
    {
      this.text = this.genes[0].symbol;
    }
  }

  public toHoveredData(): string[] {
    return [
      this.mainGene.symbol,
      Formatter.truncate(this.mainGene.name, 30),
      this.mainGene.speciesName,
      `Chr${this.mainGene.chromosome}: ${Formatter.addCommasToBasePair(this.mainGene.start)} - ${Formatter.addCommasToBasePair(this.mainGene.stop)}`,
      `Gene count in this area: ${this.genes.length}`
    ];
  }

  /**
   * Returns the "main" gene that belongs to this GeneLabel
   */
  public get mainGene()
  {
    // FIXME: Probably shouldn't arbitrarily rely on the first gene in label being the one that it represents...
    return this.genes[0] ?? null;
  }
}

export type IntermediateGeneLabel = {
  gene: Gene,
  posY: number,
  posX: number,
};