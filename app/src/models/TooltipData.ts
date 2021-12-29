import TrackSection from "./TrackSection";

/**
 * Model that represents the Tooltip that will appear when hovering over genomic regions
 */
export default class TooltipData
{
  genomicSection: TrackSection;
  x: number;
  y: number;

  constructor(svgX: number, svgY: number, section: TrackSection)
  {
    this.genomicSection = section;
    this.x = svgX;
    this.y = svgY;
  }
}