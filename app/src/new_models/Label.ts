import Gene from './Gene';

interface LabelParams
{
  posX: number;
  posY: number;
  text: string;
}

export default class Label
{
  posX: number = 0;
  posY: number = 0;
  text: string = '';
  isVisible: boolean = true;

  constructor(params: LabelParams)
  {
    this.posX = params.posX;
    this.posY = params.posY;
    this.text = params.text;
  }
}

export class GeneLabel extends Label
{
  gene: Gene;

  constructor(params: LabelParams, gene: Gene)
  {
    super(params);
    this.gene = gene;
  }
}