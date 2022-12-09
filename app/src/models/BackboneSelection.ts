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
  chromosome?: Chromosome;
  baseSelection: SelectedRegion;
  innerSelection?: SelectedRegion;
  zoomLevel: number = 1;
  orthologData?: any;


  private shiftPercent: number = 0.2; // TODO: configurable?

  constructor(baseSelection: SelectedRegion, chromosome?: Chromosome)
  {
    this.baseSelection = baseSelection;
    this.chromosome = chromosome;
  }

  /**
   * Adjusts the bp start/stop of the base selection (and inner selection if necessary) according to a given percentage
   * @param percent percent to grow/shrink the selection by. Expects a whole number (e.g. 10 for 10% or -20 for -20%).
   * @param backboneBasePairStop the cutoff base pair on the backbone (will likely be the end of the backbone chromosome)
   * @param overviewBasePairToHeightRatio the bp/height ratio of the overview panel
   */
  public adjustBaseSelectionByPercentage(percent: number, backboneBasePairStop: number, overviewBasePairToHeightRatio: number)
  {
    const lengthAdjustment = Math.ceil(((percent / 100) * this.baseSelection.length) / 2);

    const newStartBasePair = this.baseSelection.basePairStart - lengthAdjustment;
    const newStopBasePair = this.baseSelection.basePairStop + lengthAdjustment;

    this.adjustBaseSelectionByPosition(newStartBasePair, newStopBasePair, backboneBasePairStop, overviewBasePairToHeightRatio);
  }

  /**
   * Adjusts the bp start/stop of the base selection (and inner selection if necessary) according to new start/stop positions
   * @param newStartBasePair new start bp
   * @param newStopBasePair new stop bp
   * @param backboneBasePairStop the cutoff base pair on the backbone (will likely be the end of the backbone chromosome)
   * @param overviewBasePairToHeightRatio the bp/height ratio of the overview panel
   */
  public adjustBaseSelectionByPosition(newStartBasePair: number, newStopBasePair: number, backboneBasePairStop: number, overviewBasePairToHeightRatio: number)
  {
    if (newStartBasePair < 0 && newStopBasePair > backboneBasePairStop)
    {
      newStartBasePair = 0;
      newStopBasePair = backboneBasePairStop;
    }
    else if (newStartBasePair < 0)
    {
      // Add the extra length onto the end of the new stop base pair
      newStopBasePair = (newStopBasePair - newStartBasePair > backboneBasePairStop) ? backboneBasePairStop : newStopBasePair - newStartBasePair;
      newStartBasePair = 0;
    }
    else if (newStopBasePair > backboneBasePairStop)
    {
      // Subtract the extra length from the new start base pair
      newStartBasePair = (newStartBasePair - (newStopBasePair - backboneBasePairStop) < 0) ? 0 : newStartBasePair - (newStopBasePair - backboneBasePairStop);
      newStopBasePair = backboneBasePairStop;
    }

    // Calculate the new SVG starting Y position and height using new base pairs and the bp/height ratio
    const svgHeightFromTopOfBackboneToStart = newStartBasePair / overviewBasePairToHeightRatio;
    const svgY = svgHeightFromTopOfBackboneToStart + SVGConstants.overviewTrackYPosition;
    const svgHeightOfNewBaseSelection = (newStopBasePair - newStartBasePair) / overviewBasePairToHeightRatio;

    this.baseSelection = new SelectedRegion(svgY, svgHeightOfNewBaseSelection, newStartBasePair, newStopBasePair);
    // Adjust inner selection if it is outside the bounds of the base selection
    if (this.innerSelection)
    {
      let innerStart = this.innerSelection.basePairStart;
      let innerStop = this.innerSelection.basePairStop;
      let innerSelectionChanged = false;
      if (this.innerSelection.basePairStart < this.baseSelection.basePairStart)
      {
        innerStart = this.baseSelection.basePairStart;
        innerSelectionChanged = true;
      }

      if (this.innerSelection.basePairStop > this.baseSelection.basePairStop)
      {
        innerStop = this.baseSelection.basePairStop;
        innerSelectionChanged = true;
      }
      
      if (innerSelectionChanged)
      {
        this.generateInnerSelection(innerStart, innerStop, overviewBasePairToHeightRatio);
      }
    }
  }

  /**
   * Creates an `innerSelection` based off of a zoom level
   * @param detailedStart start bp of the detailed panel
   * @param detailedStop stop bp of the detailed panel
   * @param overviewBasePairToHeightRatio number to used to calculate the svg height and starting y position of the inner selection
   * @returns the innerSelection region
   */
  public generateInnerSelection(detailedStart: number, detailedStop: number, overviewBasePairToHeightRatio: number)
  {
    const originalRegionLength = this.baseSelection.basePairStop - this.baseSelection.basePairStart;
    const detailedRegionLength = detailedStop - detailedStart;
    this.zoomLevel = parseFloat((1 / (detailedRegionLength / originalRegionLength)).toFixed(2));

    detailedStart = (detailedStart < 0) ? 0 : Math.floor(detailedStart);
    detailedStop = (this.chromosome?.seqLength && detailedStop > this.chromosome.seqLength) ? this.chromosome.seqLength : Math.ceil(detailedStop);
    const innerSVGHeight = (detailedStop - detailedStart) / overviewBasePairToHeightRatio;
    let innerSVGYPoint = this.baseSelection.svgYPoint;
    if (detailedStart > this.baseSelection.basePairStart)
    {
      innerSVGYPoint = ((detailedStart - this.baseSelection.basePairStart) / overviewBasePairToHeightRatio) + this.baseSelection.svgYPoint;
    }
    else if (detailedStart < this.baseSelection.basePairStart)
    {
      innerSVGYPoint = this.baseSelection.svgYPoint - ((this.baseSelection.basePairStart - detailedStart) / overviewBasePairToHeightRatio);
    }
    this.innerSelection = new SelectedRegion(innerSVGYPoint, innerSVGHeight, detailedStart, detailedStop);
    return this.innerSelection;
  }

  public moveInnerSelectionUp(overviewBasePairToHeightRatio: number)
  {
    if (!this.innerSelection)
    {
      return;
    }

    const innerSelectionLength = this.innerSelection.basePairStop - this.innerSelection.basePairStart;

    let newStart = this.innerSelection.basePairStart - innerSelectionLength * this.shiftPercent;
    let newStop = this.innerSelection.basePairStop - innerSelectionLength * this.shiftPercent;
    if (newStart < this.baseSelection.basePairStart)
    {
      newStart = this.baseSelection.basePairStart;
      newStop = this.baseSelection.basePairStart + innerSelectionLength;
    }

    return this.generateInnerSelection(newStart, newStop, overviewBasePairToHeightRatio);
  }

  public moveInnerSelectionDown(overviewBasePairToHeightRatio: number)
  {
    if (!this.innerSelection)
    {
      return;
    }

    const innerSelectionLength = this.innerSelection.basePairStop - this.innerSelection.basePairStart;

    let newStart = this.innerSelection.basePairStart + innerSelectionLength * this.shiftPercent;
    let newStop = this.innerSelection.basePairStop + innerSelectionLength * this.shiftPercent;
    if (newStop > this.baseSelection.basePairStop)
    {
      newStart = this.baseSelection.basePairStop - innerSelectionLength;
      newStop = this.baseSelection.basePairStop;
    }

    return this.generateInnerSelection(newStart, newStop, overviewBasePairToHeightRatio);
  }
}
