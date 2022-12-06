import SVGConstants from "@/utils/SVGConstants";
import DatatrackSection from "./DatatrackSection";
import Label from "./Label";
import SyntenyRegion from "./SyntenyRegion";
import SyntenySection from "./SyntenySection";

function getOverviewPanelXPosition(order: number)
{
  return (order * -80) + SVGConstants.backboneXPosition;
}

function getDetailedPanelXPositionForSynteny(order: number)
{
  // TODO: Remove the 100 at the end after testing detailed synteny set rendering
  return (order * 120) + SVGConstants.selectedBackboneXPosition + 100;
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
    console.log('labels', this.order, this.titleLabels);
  }

  private setRegionXPositionsBasedOnOrder()
  {
    if (this.regions.length > 0)
    {
      this.regions.forEach(region => {
        this.setSyntenyBlockXPositions(region.syntenyBlocks);
        this.setSyntenyGapXPositions(region.syntenyGaps);
        this.setDatatrackSectionXPositions(region.datatrackSections);
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

      section.posX2 = section.posX1 + SVGConstants.trackWidth;
      section.width = Math.abs(section.posX2 - section.posX1);
    });
  }

  private setDatatrackSectionXPositions(sections: DatatrackSection[])
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
  }
}