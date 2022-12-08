import SVGConstants from "@/utils/SVGConstants";
import DatatrackSection from "./DatatrackSection";
import Label from "./Label";
import OrthologLine from "./OrthologLine";
import SyntenyRegion from "./SyntenyRegion";
import SyntenySection from "./SyntenySection";

const LEVEL_2_WIDTH_MULTIPLIER = 0.75;

function getOverviewPanelXPosition(order: number)
{
  return (order * -80) + SVGConstants.backboneXPosition;
}

function getDetailedPanelXPositionForSynteny(order: number)
{
  return (order * 120) + SVGConstants.selectedBackboneXPosition;
}

function getDetailedPanelXPositionForDatatracks(order: number)
{
  return getDetailedPanelXPositionForSynteny(order) + (order * 30);
}

/**
 * Model for representing a set of SyntenyRegions for the same species and map
 */
export default class SyntenyRegionSet
{
  speciesName: string = '';
  mapName: string = '';
  regions: SyntenyRegion[] = [];
  order: number = 1;
  renderType: 'overview' | 'detailed' = 'overview';
  titleLabels: Label[] = [];

  constructor(speciesName: string, mapName: string, regions: SyntenyRegion[], order: number, renderType: 'overview' | 'detailed')
  {
    this.speciesName = speciesName;
    this.mapName = mapName;
    this.regions = regions;
    this.order = order;
    this.renderType = renderType;
    this.setRegionXPositionsBasedOnOrder();
    this.createTitleLabels();
  }

  private createTitleLabels()
  {
    const speciesLabel = new Label({
      posX: (this.renderType === 'overview') ? getOverviewPanelXPosition(this.order) : getDetailedPanelXPositionForSynteny(this.order),
      posY: SVGConstants.trackLabelYPosition,
      text: this.speciesName,
    });

    const mapLabel = new Label({
      posX: (this.renderType === 'overview') ? getOverviewPanelXPosition(this.order) : getDetailedPanelXPositionForSynteny(this.order),
      posY: SVGConstants.trackMapLabelYPosition,
      text: this.mapName,
    });

    this.titleLabels = [speciesLabel, mapLabel];
  }

  private setRegionXPositionsBasedOnOrder()
  {
    if (this.regions.length > 0)
    {
      this.regions.forEach(region => {
        this.setSyntenyBlockXPositions(region.syntenyBlocks);
        this.setSyntenyGapXPositions(region.syntenyGaps);
        this.setDatatrackSectionXPositions(region.datatrackSections, region.orthologLines);
      });
    }
  }

  private setSyntenyGapXPositions(sections: SyntenySection[])
  {
    sections.forEach(section => {
      let blockPosX1: number = 0;
      if (this.renderType === 'overview')
      {
        blockPosX1= getOverviewPanelXPosition(this.order);
      }
      else if (this.renderType === 'detailed')
      {
        blockPosX1 = getDetailedPanelXPositionForSynteny(this.order);
      }

      const posX = blockPosX1 + (SVGConstants.trackWidth / 2);
      section.posX1 = posX;
      section.posX2 = posX;
      section.width = 0;
    });
  }

  private setSyntenyBlockXPositions(sections: SyntenySection[])
  {
    sections.forEach(section => {
      if (this.renderType === 'overview')
      {
        section.posX1 = getOverviewPanelXPosition(this.order);
      }
      else if (this.renderType === 'detailed')
      {
        section.posX1 = getDetailedPanelXPositionForSynteny(this.order);
      }

      let trackWidth = SVGConstants.trackWidth;
      // Level 2 blocks should appear slimmer
      if (section.chainLevel === 2)
      {
        section.posX1 = section.posX1 + ((SVGConstants.trackWidth * (1 - LEVEL_2_WIDTH_MULTIPLIER)) / 2);
        trackWidth = trackWidth * LEVEL_2_WIDTH_MULTIPLIER;
      }

      section.posX2 = section.posX1 + trackWidth;
      section.width = Math.abs(section.posX2 - section.posX1);
    });
  }

  private setDatatrackSectionXPositions(sections: DatatrackSection[], lines: OrthologLine[])
  {
    sections.forEach(section => {
      if (this.renderType === 'overview')
      {
        section.posX1 = getOverviewPanelXPosition(this.order);
      }
      else if (this.renderType === 'detailed')
      {
        section.posX1 = getDetailedPanelXPositionForDatatracks(this.order);
      }

      section.posX2 = section.posX1 + SVGConstants.dataTrackWidth;
      section.width = Math.abs(section.posX2 - section.posX1);
    });

    lines.forEach(line => {
      if (this.renderType === 'overview')
      {
        line.posX2 = getOverviewPanelXPosition(this.order);
      }
      else if (this.renderType === 'detailed')
      {
        line.posX2 = getDetailedPanelXPositionForDatatracks(this.order);
      }
    });
  }
}