import Chromosome from "./Chromosome";

export default class BackboneSelection
{
  chromosome?: Chromosome;
  baseSelection: SelectedRegion;
  innerSelection?: SelectedRegion;

  constructor(baseSelection: SelectedRegion, chromosome?: Chromosome)
  {
    this.baseSelection = baseSelection;
    this.chromosome = chromosome;
  }

  /**
   * Creates an `innerSelection` based off of a zoom level
   * @param zoomLevel number
   * @param basePairToHeightRatio number to used to calculate the svg height and starting y position of the inner selection
   * @returns the innerSelection region
   */
  public generateInnerSelection(zoomLevel: number, basePairToHeightRatio: number)
  {
    let zoomedStart = this.baseSelection.basePairStart;
    let zoomedStop = this.baseSelection.basePairStop;
    const originalRegionLength = zoomedStop - zoomedStart;
    const zoomedRegionLength = originalRegionLength * (1 / zoomLevel);

    if (zoomLevel > 1)
    {
      zoomedStart = zoomedStart + ((originalRegionLength - zoomedRegionLength) / 2);
      zoomedStop = zoomedStop - ((originalRegionLength - zoomedRegionLength) / 2);
    }
    else if (zoomLevel < 1)
    {
      zoomedStart = zoomedStart - ((zoomedRegionLength - originalRegionLength) / 2);
      zoomedStop = zoomedStop + ((zoomedRegionLength - originalRegionLength) / 2);
    }

    zoomedStart = (zoomedStart < 0) ? 0 : Math.floor(zoomedStart);
    zoomedStop = (this.chromosome?.seqLength && zoomedStop > this.chromosome.seqLength) ? this.chromosome.seqLength : Math.ceil(zoomedStop);
    const innerSVGHeight = (zoomedStop - zoomedStart) / basePairToHeightRatio;
    let innerSVGYPoint = this.baseSelection.svgYPoint;
    if (zoomedStart > this.baseSelection.basePairStart)
    {
      innerSVGYPoint = ((zoomedStart - this.baseSelection.basePairStart) / basePairToHeightRatio) + this.baseSelection.svgYPoint;
    }
    else if (zoomedStart < this.baseSelection.basePairStart)
    {
      innerSVGYPoint = this.baseSelection.svgYPoint - ((this.baseSelection.basePairStart - zoomedStart) / basePairToHeightRatio);
    }
    this.innerSelection = new SelectedRegion(innerSVGYPoint, innerSVGHeight, zoomedStart, zoomedStop);
    return this.innerSelection;
  }
}

export class SelectedRegion
{
  svgYPoint: number; // The Y position on the backbone SVG
  svgHeight: number; // The height of the selection on the backbone SVG
  basePairStart: number;
  basePairStop: number;

  constructor(svgYPoint: number, svgHeight: number, basePairStart: number, basePairStop: number)
  {
    this.svgYPoint = svgYPoint;
    this.svgHeight = svgHeight;
    this.basePairStart = basePairStart;
    this.basePairStop = basePairStop;
  }
}