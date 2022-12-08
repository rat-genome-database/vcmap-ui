import SVGConstants from "@/utils/SVGConstants";
import BackboneSection from "./BackboneSection";
import DatatrackSection from "./DatatrackSection";
import Label from "./Label";


const DataTrack_X_OFFSET = 10;

/**
 * Model for representing a set of Backbone sections and its datatrack sections
 */
export default class BackboneSet
{
  speciesName?: string;
  mapName?: string;
  backbone: BackboneSection;
  datatracks: DatatrackSection[];
  titleLabels: Label[] = [];

  constructor(backboneSection: BackboneSection, datatracks: DatatrackSection[])
  {
    this.speciesName = backboneSection.species?.name;
    this.mapName = backboneSection.species?.activeMap.name;
    this.backbone = backboneSection;
    this.datatracks = datatracks;

    this.setBackboneXPositions();
    this.createTitleLabels();
    this.setDatatrackXPositions();
  }

  private setBackboneXPositions()
  {
    // Calculate X positions of this backbone section
    if (this.backbone.renderType === 'overview')
    {
      this.backbone.posX1 = SVGConstants.backboneXPosition;
      this.backbone.posX2 = this.backbone.posX1 + SVGConstants.trackWidth;
    }
    else if (this.backbone.renderType === 'detailed')
    {
      this.backbone.posX1 = SVGConstants.selectedBackboneXPosition;
      this.backbone.posX2 = this.backbone.posX1 + SVGConstants.trackWidth;
    }

    this.backbone.width = Math.abs(this.backbone.posX2 - this.backbone.posX1);
  }

  private setDatatrackXPositions()
  {
    this.datatracks.forEach(section => {
      section.posX1 = this.backbone.posX2 + DataTrack_X_OFFSET;
      section.posX2 = section.posX1 + SVGConstants.dataTrackWidth;
      section.width = SVGConstants.dataTrackWidth;
    });
  }

  private createTitleLabels()
  {
    const speciesLabel = new Label({
      posX: this.backbone.posX1,
      posY: SVGConstants.trackLabelYPosition,
      text: this.speciesName ?? 'Unknown',
    });

    const mapLabel = new Label({
      posX: this.backbone.posX1,
      posY: SVGConstants.trackMapLabelYPosition,
      text: this.mapName ?? 'Unknown',
    });

    this.titleLabels = [speciesLabel, mapLabel];
  }
}