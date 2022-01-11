import TrackSection from "./TrackSection";

/**
 * Model that represents the Tooltip that will appear when hovering over genomic regions
 */
export default class TooltipData
{
  genomicSection: TrackSection;
  isGeneLabel: boolean = false;
  x: number;
  y: number;

  constructor(svgX: number, svgY: number, section: TrackSection, isGeneLabel: boolean)
  {
    this.x = svgX;
    this.y = svgY;
    this.genomicSection = section;
    this.isGeneLabel = isGeneLabel;
  }
}