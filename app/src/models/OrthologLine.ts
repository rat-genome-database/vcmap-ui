import TrackSection from './TrackSection';

interface OrthologLineParams
{
  backboneY: number;
  comparativeX: number;
  comparativeY: number;

  backboneGene: TrackSection;
  comparativeGene: TrackSection;
}

export default class OrthologLine
{
  backboneGeneY: number;
  comparativeGeneX: number;
  comparativeGeneY: number;
  backboneGene: TrackSection;
  comparativeGene: TrackSection;

  constructor(params: OrthologLineParams)
  {
    this.backboneGeneY = params.backboneY;
    this.comparativeGeneX = params.comparativeX;
    this.comparativeGeneY = params.comparativeY;
    this.backboneGene = params.backboneGene;
    this.comparativeGene = params.comparativeGene;
  }
}


