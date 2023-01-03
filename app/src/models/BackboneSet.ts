import { backboneDatatrackBuilder, ProcessedGenomicData } from "@/utils/BackboneBuilder";
import SVGConstants from "@/utils/SVGConstants";
import { mergeGeneLabels } from "@/utils/GeneLabelMerger";
import BackboneSection from "./BackboneSection";
import Gene from "./Gene";
import DatatrackSection from "./DatatrackSection";
import { GenomicSet } from "./GenomicSet";
import Label, { GeneLabel } from "./Label";


const DataTrack_X_OFFSET = 10;

/**
 * Model for representing a set of Backbone sections and its datatrack sections
 */
export default class BackboneSet extends GenomicSet
{
  backbone: BackboneSection;
  datatracks: DatatrackSection[];
  datatrackLabels: Label[] = [];

  constructor(backboneSection: BackboneSection, processedGenomicData?: ProcessedGenomicData)
  {
    super(backboneSection.species?.name, backboneSection.species?.activeMap.name);

    this.backbone = backboneSection;
    this.datatracks = processedGenomicData?.datatracks ?? [];
    if (this.datatracks.length > 0 && processedGenomicData)
    {
      this.backbone.setBackboneGenes(processedGenomicData.genes);
    }
    this.setBackboneXPositions();
    this.createTitleLabels();
    this.setDatatrackXPositions();
  }

  public adjustVisibleSet(backboneStart: number, backboneStop: number)
  {
    if (backboneStart < this.backbone.start || backboneStop > this.backbone.stop)
    {
      //expand base start/stop of backbone to include new range accomodating for the new window
      console.log('base expand')
      this.backbone.expandBaseStartAndStop(backboneStart, backboneStop);
    }

    // Change visible backbone section
    this.backbone.changeWindowStartAndStop(backboneStart, backboneStop);

    // Use stored genomic data to rebuild datatrack sections for visible region
    // TODO: Return new master gene map?
    if (this.backbone.backboneGenes)
    {
      const datatrackInfo = backboneDatatrackBuilder(this.backbone.backboneGenes, this.backbone, backboneStart, backboneStop);
      this.datatracks = datatrackInfo.processedGenomicData.datatracks;
      this.setDatatrackXPositions();
      this.processGeneLabels();

      return datatrackInfo.masterGeneMap;
    }
  }

  public updateBackboneGenes(genes: Gene[])
  {
    this.backbone.addBackboneGenes(genes);
  }

  protected createTitleLabels()
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
      if (section.label)
      {
        section.label.posX = section.posX2;
      }
    });
  }

  private processGeneLabels()
  {
    const allLabels: Label[] = [];
    this.datatracks.forEach((section) => {
      if (section.label)
      {
        allLabels.push(section.label);
      }
    });
    this.datatrackLabels = allLabels;

    mergeGeneLabels(this.datatrackLabels as GeneLabel[]);
  }

  public addDatatrackSections(datatrackSections: DatatrackSection[])
  {
    this.datatracks.length > 0 ? this.datatracks.concat(datatrackSections) : this.datatracks = datatrackSections;
    this.setDatatrackXPositions();
  }
}