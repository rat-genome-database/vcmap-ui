import TrackSection from "./TrackSection";
import OrthologLine from "./OrthologLine";

/**
 * Model that represents the Selected Data that will appear when Selected Data Panel
 */
export default class SelectedData
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