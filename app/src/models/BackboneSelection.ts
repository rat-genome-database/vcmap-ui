import Chromosome from "./Chromosome";

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
}

export default class BackboneSelection
{
  chromosome?: Chromosome;
  baseSelection: SelectedRegion;
  innerSelection?: SelectedRegion;
  zoomLevel: number = 1;


  private shiftPercent: number = 0.2; // TODO: configurable?

  constructor(baseSelection: SelectedRegion, chromosome?: Chromosome)
  {
    this.baseSelection = baseSelection;
    this.chromosome = chromosome;
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
