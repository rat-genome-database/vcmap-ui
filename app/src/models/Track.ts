import SVGConstants from "@/utils/SVGConstants";
import TrackSection from "./TrackSection";

interface TrackParams
{
  speciesName: string;
  sections: TrackSection[];
  mapName?: string;
  isSyntenyTrack?: boolean;
}

export interface Label
{
  svgY: number;
  text: string;
  isVisible: boolean;
}

export default class Track
{
  sections: TrackSection[] = [];
  name: string;
  mapName?: string;
  labels: Label[] = [];

  constructor(params: TrackParams)
  {
    this.name = params.speciesName;
    this.sections = params.sections;
    this.mapName = params.mapName;
    this.setSectionSVGPositions(this.sections, params.isSyntenyTrack);
    this.buildAndSortLabelObjects(this.sections);
  }

  public get height()
  {
    let totalHeight = 0;
    this.sections.forEach(section => {
      totalHeight += section.height + section.offsetHeight;
    });
    return totalHeight;
  }

  public get svgY()
  {
    if (this.sections.length > 0)
    {
      return this.sections[0].svgY;
    }

    return 0;
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
      // Set the SVG Y position of each section according to the other sections it its level
      level1Sections.forEach((section, index) => this.setSectionYPosition(section, index, level1Sections));
      level2Sections.forEach((section, index) => this.setSectionYPosition(section, index, level2Sections));

      // The order of the sections in the array determines the order in which SVGs will be drawn. Sections at the end
      // will be closer to the foreground while sections at the beginning will be closer to the background.
      this.sections = level2Sections.filter(s => s.shape === 'line') // level 2 gaps should be in the background
        .concat(level1Sections.filter(s => s.shape !== 'line')) // level 1 blocks
        .concat(level2Sections.filter(s => s.shape !== 'line')) // level 2 blocks
        .concat(level1Sections.filter(s => s.shape === 'line')); // level 1 gaps should be in the foreground
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

  private buildAndSortLabelObjects(sections: TrackSection[])
  {
    const labels: Label[] = [];
    sections.forEach(s => {
      labels.push({
        svgY: s.svgY,
        text: s.startBPLabel ?? '',
        isVisible: false
      });
      labels.push({
        svgY: s.svgY2,
        text: s.stopBPLabel ?? '',
        isVisible: false
      });
    });

    labels.sort((a, b) => a.svgY - b.svgY);

    labels.forEach((label, index) => {
      if (index === 0)
      {
        label.isVisible = true;
        return;
      }

      // Find nearest, previous visible label
      let previousLabel: Label | undefined;
      let currentIndex = index - 1;
      while (previousLabel == null && currentIndex >= 0)
      {
        if (labels[currentIndex].isVisible)
        {
          previousLabel = labels[currentIndex];
        }
        currentIndex--;
      }

      if (previousLabel == null || (label.svgY - previousLabel.svgY > 10))
      {
        label.isVisible = true;
      }
    });
    this.labels = labels;
  }
}