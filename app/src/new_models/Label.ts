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

  constructor(params: LabelParams)
  {
    this.posX = params.posX;
    this.posY = params.posY;
    this.text = params.text;
  }
}