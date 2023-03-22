import SVGConstants, {PANEL_SVG_START, PANEL_SVG_STOP} from "@/utils/SVGConstants";
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

  /**
   * Change the position start / stop position of the Detailed panel.
   * @param visibleStart
   *   The new start position of the detailed panel (in the Backbone bp coordinate system).
   * @param visibleStop
   *   The new stop position of the detailed panel (in the Backbone bp coordinate system).
   */
  public setViewportSelection(visibleStart: number, visibleStop: number)
  {
    // Protect any bad inputs
    // TODO: log this, so the upstream code can be corrected...
    visibleStart = (visibleStart < 0) ? 0 : Math.floor(visibleStart);
    visibleStop = (visibleStop > this.chromosome.seqLength) ? this.chromosome.seqLength : Math.ceil(visibleStop);

    const overviewHeight = PANEL_SVG_STOP - PANEL_SVG_START - (SVGConstants.overviewTrackPadding * 2);
    const bpOverviewLength = this.chromosome.seqLength;
    const pixelsPerBpRatio = overviewHeight / bpOverviewLength;

    const innerSVGYPoint = (visibleStart * pixelsPerBpRatio) + SVGConstants.overviewTrackYPosition;
    const svgHeight = (visibleStop - visibleStart) * pixelsPerBpRatio;

    this.viewportSelection = new SelectedRegion(innerSVGYPoint, svgHeight, visibleStart, visibleStop);
    return this.viewportSelection;
  }
}
