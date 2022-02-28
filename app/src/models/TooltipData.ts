import TrackSection from "./TrackSection";
import OrthologLine from "./OrthologLine";

/**
 * Model that represents the Tooltip that will appear when hovering over genomic regions
 */
export default class TooltipData
{
  genomicSection: TrackSection | OrthologLine;
  type: string;
  x: number;
  mouseX: number;
  y: number;

  constructor(svgX: number, mouseX: number, svgY: number, section: TrackSection | OrthologLine, type: string)
  {
    this.x = svgX;
    this.mouseX = mouseX;
    this.y = svgY;
    this.genomicSection = section;
    this.type = type;
  }
}