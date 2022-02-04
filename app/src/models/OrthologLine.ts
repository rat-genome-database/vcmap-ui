interface OrthologLineParams
{
  //backboneX: number;
  backboneY: number;
  comparativeX: number;
  comparativeY: number;
}

export default class OrthologLine
{
  //backboneGeneX: number;
  backboneGeneY: number;
  comparativeGeneX: number;
  comparativeGeneY: number;

  constructor(params: OrthologLineParams)
  {
    //this.backboneGeneX = params.backboneX;
    this.backboneGeneY = params.backboneY;
    this.comparativeGeneX = params.comparativeX;
    this.comparativeGeneY = params.comparativeY;
  }
}


