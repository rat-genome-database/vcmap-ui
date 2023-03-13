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
  gene: Gene;
  combinedLabels: GeneLabel[] = [];

  constructor(params: LabelParams, gene: Gene)
  {
    super(params);
    this.gene = gene;
  }
}