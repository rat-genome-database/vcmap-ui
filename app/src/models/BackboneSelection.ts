export default class BackboneSelection
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