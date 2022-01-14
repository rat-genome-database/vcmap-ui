import SVGConstants from "@/utils/SVGConstants";
import TrackSection from "./TrackSection";

interface TrackParams
{
  speciesName: string;
  sections: TrackSection[];
  mapName?: string;
  isSyntenyTrack?: boolean;
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
    this.setSectionSVGPositions(this.sections, params.isSyntenyTrack);
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
  private setSectionSVGPositions(sections: TrackSection[], isSyntenyTrack?: boolean)
  {
    if (isSyntenyTrack)
    {
      const level1Sections = sections.filter(s => s.chainLevel === 1);
      const level2Sections = sections.filter(s => s.chainLevel === 2);
      level1Sections.forEach((section, index) => this.setSectionYPosition(section, index, level1Sections));
      level2Sections.forEach((section, index) => this.setSectionYPosition(section, index, level2Sections));
    }
    else
    {
      sections.forEach((section, index) => this.setSectionYPosition(section, index, sections));
    }
  }

  private setSectionYPosition(section: TrackSection, index: number, sections: TrackSection[])
  {
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
  }
}