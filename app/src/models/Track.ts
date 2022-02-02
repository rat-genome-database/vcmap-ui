import SVGConstants from "@/utils/SVGConstants";
import Gene from "./Gene";
import { SpeciesSyntenyData } from "./SyntenicRegion";
import TrackSection from "./TrackSection";

interface TrackParams
{
  speciesName: string;
  sections: TrackSection[];
  mapName?: string;
  speciesMap?: number;
  isSyntenyTrack?: boolean;
  startingSVGY: number;
  type: 'backbone' | 'comparative' | 'gene';
  rawGeneData?: Gene[];
  rawSyntenyData?: SpeciesSyntenyData;
}

export interface Label
{
  svgY: number;
  text: string;
  isVisible: boolean;
  symbol?: string;
}

export default class Track
{
  sections: TrackSection[] = [];
  name: string;
  mapName?: string;
  speciesMap?: Number;
  labels: Label[] = [];
  geneLabels: Label[] = [];
  startingSVGY: number = 0;
  type = 'backbone';
  rawGeneData?: Gene[]; // Tracks made from genes will populate this with the raw gene data it used from the API
  rawSyntenyData?: SpeciesSyntenyData; // Tracks made from synteny will populate this with the raw syntenic region data it used from the API

  constructor(params: TrackParams)
  {
    this.name = params.speciesName;
    this.sections = params.sections;
    this.mapName = params.mapName;
    this.speciesMap = params.speciesMap;
    this.startingSVGY = params.startingSVGY;
    this.type = params.type;
    this.rawGeneData = params.rawGeneData;
    this.rawSyntenyData = params.rawSyntenyData;
    this.setSectionSVGPositions(this.sections, params.isSyntenyTrack);
    this.buildAndSortLabelObjects(this.sections);
    this.createCombinedGeneLabels(this.sections);
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
    // If track is in the overview, leave some space between the title panels and the track
    let currentYPos = this.startingSVGY;
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
        svgY: s.svgY - SVGConstants.panelTitleHeight <= 3 ? s.svgY + 5 : s.svgY,
        text: s.startBPLabel ?? '',
        isVisible: false
      });
      labels.push({
        svgY: (SVGConstants.viewboxHeight - SVGConstants.navigationButtonHeight) - s.svgY2 <= 3 ? s.svgY2 - 5 : s.svgY2,
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

  private createCombinedGeneLabels(drawnSections: TrackSection[])
  {
    //sort genes by longest to shortest
    drawnSections.sort((a, b) => b.height - a.height);
    
    //create labels for each gene, track section with labels using map
    const geneLabelsMap = new Map<string, any>();
    let labels: Label[] = [];

    drawnSections.forEach(s => {
      const labelObject = {svgY: s.svgY - SVGConstants.panelTitleHeight <= 3 ? (s.svgY + 5): s.svgY + (s.height/2), text: s.geneLabel ?? '', isVisible: false };
      labels.push(labelObject);
      geneLabelsMap.set(Math.trunc(labelObject.svgY).toString(), {'labelShown': false, 'labelCombined': false, 'labelY': labelObject.svgY, 'trackSection': s});
    });

    //labels are sorted in order of longest gene to shortest
    for (let index = 0; index < labels.length; index++)
    {
      const label = labels[index];
      const labelSection = geneLabelsMap.get(Math.trunc(label.svgY).toString());
      
      if (labelSection)
      {
        if (labelSection.labelCombined)
        {
          labelSection.labelShown = false;
          continue;
        }

        //check for labels above and below the current label that would overlap
        for (let keyDiff = 1; keyDiff < 10; keyDiff++)
        {
          const aboveKey = (Math.trunc(label.svgY) - keyDiff).toString();
          const belowKey = (Math.trunc(label.svgY) + keyDiff).toString();

          const aboveKeyCheck = geneLabelsMap.has(aboveKey);
          const belowKeyCheck = geneLabelsMap.has(belowKey);

          if (aboveKeyCheck)
          {
            const sectionAbove = geneLabelsMap.get(aboveKey);
            //gene has already been combined into a label
            if (sectionAbove.labelCombined)
            {
              sectionAbove.labelShown = false;
            }
            else
            {
              labelSection.trackSection.combinedGenes ? labelSection.trackSection.combinedGenes.push(sectionAbove.trackSection) : labelSection.trackSection.combinedGenes = [sectionAbove.trackSection];
              sectionAbove.labelCombined = true;
            }
          }
          if (belowKeyCheck)
          {
            const sectionBelow = geneLabelsMap.get(belowKey);
            if (sectionBelow.labelCombined)
            {
              sectionBelow.labelShown = false;
            }
            else
            {
              labelSection.trackSection.combinedGenes ? labelSection.trackSection.combinedGenes.push(sectionBelow.trackSection) : labelSection.trackSection.combinedGenes = [sectionBelow.trackSection];
              sectionBelow.labelCombined = true;
            }
          }

          labelSection.labelShown = true;
        }
      }
    }

    labels = [];
    geneLabelsMap.forEach((value) => {
      const labelObject = {svgY: value.labelY, text: value.trackSection.geneLabel, isVisible: value.labelShown};
      labels.push(labelObject);
    });

    this.geneLabels = labels;
  }
}