import SVGConstants from "@/utils/SVGConstants";
import Chromosome from "@/models/Chromosome";

export interface BasePairRange
{
  start: number;
  stop: number;
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

  public get length()
  {
    return this.basePairStop - this.basePairStart;
  }
}

export default class BackboneSelection
{
  chromosome: Chromosome;
  //viewport selection is the current viewport selection range
  viewportSelection?: SelectedRegion;

  constructor(chromosome: Chromosome, viewportSelection?: SelectedRegion)
  {
    this.chromosome = chromosome;
    this.viewportSelection = viewportSelection;
  }

  public setViewportSelection(visibleStart: number, visibleStop: number, overviewBasePairToHeightRatio: number)
  {
    visibleStart = (visibleStart < 0) ? 0 : Math.floor(visibleStart);
    visibleStop = (visibleStop > this.chromosome.seqLength) ? this.chromosome.seqLength : Math.ceil(visibleStop);
    const innerSVGHeight = (visibleStop - visibleStart) / overviewBasePairToHeightRatio;
    let innerSVGYPoint = SVGConstants.overviewTrackYPosition;
    if (visibleStart > 0)
    {
      innerSVGYPoint = (visibleStart / overviewBasePairToHeightRatio) + SVGConstants.overviewTrackYPosition;
    }
    else if (visibleStart < 0)
    {
      innerSVGYPoint = SVGConstants.overviewTrackYPosition - ((0 - visibleStart) / overviewBasePairToHeightRatio);
    }

    this.viewportSelection = new SelectedRegion(innerSVGYPoint, innerSVGHeight, visibleStart, visibleStop);
    return this.viewportSelection;
  }
}
