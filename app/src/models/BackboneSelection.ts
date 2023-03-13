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


export class BufferZone
{
  topBackboneBuffer: number;          //Backbone basepair cutoff for the current top of the backbone in the detailed panel
  bottomBackboneBuffer: number;       //Backbone basepair cutoff for the current bottom of the backbone in the detailed panel


  constructor(start: number, stop: number)
  {
    this.topBackboneBuffer = start;
    this.bottomBackboneBuffer = stop;
  }
}

export default class BackboneSelection
{
  chromosome: Chromosome;
  //bufferzone is range above and below the viewport that is used to determine when to load more data
  bufferZoneSelection?: SelectedRegion;
  //viewport selection is the current viewport selection range
  viewportSelection?: SelectedRegion;


  private bufferZonePercent: number = 0.25; // TODO: configurable?

  constructor(baseSelection: SelectedRegion, chromosome: Chromosome, fullBackboneSelection?: SelectedRegion, viewportSelection?: SelectedRegion)
  {
    this.chromosome = chromosome;
    this.viewportSelection = viewportSelection;
  }

  public setViewportSelection(visibleStart: number, visibleStop: number, overviewBasePairToHeightRatio: number)
  {
    const originalRegionLength = this.chromosome.seqLength;
    const detailedRegionLength = visibleStop - visibleStart;

    visibleStart = (visibleStart < 0) ? 0 : Math.floor(visibleStart);
    visibleStop = (visibleStop > this.chromosome.seqLength) ? this.chromosome.seqLength : Math.ceil(visibleStop);
    const innerSVGHeight = (visibleStop - visibleStart) / overviewBasePairToHeightRatio;
    let innerSVGYPoint = SVGConstants.overviewTrackYPosition;
    if (visibleStart > 0)
    {
      innerSVGYPoint = ((visibleStart - 0) / overviewBasePairToHeightRatio) + SVGConstants.overviewTrackYPosition;
    }
    else if (visibleStart < 0)
    {
      innerSVGYPoint = SVGConstants.overviewTrackYPosition - ((0 - visibleStart) / overviewBasePairToHeightRatio);
    }

    this.viewportSelection = new SelectedRegion(innerSVGYPoint, innerSVGHeight, visibleStart, visibleStop);
    this.setBufferzoneSelection(overviewBasePairToHeightRatio);
    return this.viewportSelection;
  }


  public setBufferzoneSelection(overviewBasePairToHeightRatio: number,)
  {
    if (!this.viewportSelection)
    {
      return;
    }

    const viewportSelectionLength = this.viewportSelection.basePairStop - this.viewportSelection.basePairStart;

    //Initial setting of the bufferzone
   
    const bufferZoneStart = Math.max(this.viewportSelection.basePairStart - viewportSelectionLength * this.bufferZonePercent, 0);
    const bufferZoneStop = Math.min(this.viewportSelection.basePairStop + viewportSelectionLength * this.bufferZonePercent, this.chromosome.seqLength);
    const bufferZoneSVGPoint = ((bufferZoneStart - 0) / overviewBasePairToHeightRatio) + SVGConstants.overviewTrackYPosition;
    const bufferZoneSVGHeight = (bufferZoneStop - bufferZoneStart) / overviewBasePairToHeightRatio;

    this.bufferZoneSelection = new SelectedRegion(bufferZoneSVGPoint, bufferZoneSVGHeight, bufferZoneStart, bufferZoneStop);
  }
}
