import SVGConstants from "@/utils/SVGConstants";
import TrackSection from "./TrackSection";

interface TrackParams
{
  speciesName: string;
  sections: TrackSection[];
  mapName?: string;
}

export default class Track
{
  sections: TrackSection[] = [];
  name: string;
  mapName?: string;

  constructor(params: TrackParams)
  {
    this.name = params.speciesName;
    this.sections = params.sections;
    this.mapName = params.mapName;
    this.setSectionSVGPositions(this.sections);
  }

  public get height()
  {
    let totalHeight = 0;
    this.sections.forEach(section => {
      totalHeight += section.height + section.offsetHeight;
    });
    return totalHeight;
  }

  /**
   * Sets the starting Y position of each track section based on the height of the previous section
   * and any offsets that might need to be applied for gaps.
   */
  private setSectionSVGPositions(sections: TrackSection[])
  {
    sections.forEach((section, index) => {
      let currentYPos = SVGConstants.trackYPosition;
      let previousSectionIndex = index - 1;
      while (previousSectionIndex >= 0 && index !== 0)
      {
        const previousTrackSection = sections[previousSectionIndex];
        currentYPos += previousTrackSection.height + previousTrackSection.offsetHeight;
        previousSectionIndex--;
      }

      // Add offset if one is defined
      currentYPos += section.offsetHeight;

      section.svgY = currentYPos;
    });
  }
}