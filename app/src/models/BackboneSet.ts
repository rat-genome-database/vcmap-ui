import { ProcessedGenomicData } from "@/utils/BackboneBuilder";
import SVGConstants from "@/utils/SVGConstants";
import { mergeGeneLabels } from "@/utils/GeneLabelMerger";
import BackboneSection from "./BackboneSection";
import Gene from "./Gene";
import DatatrackSection, { DatatrackSectionType } from "./DatatrackSection";
import DatatrackSet from "./DatatrackSet";
import { GenomicSet } from "./GenomicSet";
import Label, { GeneLabel } from "./Label";


const DataTrack_X_OFFSET = 10;

/**
 * Model for representing a set of Backbone sections and its datatrack sections
 */
export default class BackboneSet extends GenomicSet
{
  backbone: BackboneSection;
  datatrackSets: DatatrackSet[] = [];
  datatrackLabels: Label[] = [];

  constructor(backboneSection: BackboneSection, processedGenomicData?: ProcessedGenomicData)
  {
    super(backboneSection.speciesName, backboneSection.mapName);

    this.backbone = backboneSection;
    if (processedGenomicData?.datatracks)
    {
      this.datatrackSets.push(new DatatrackSet(processedGenomicData.datatracks, 'gene'));
    }
    if (processedGenomicData && processedGenomicData.datatracks.length > 0)
    {
      this.backbone.setBackboneGenes(processedGenomicData.genes);
    }
    this.setBackboneXPositions();
    this.createTitleLabels();
    this.setDatatrackXPositions();
  }

  /**
   * Adjusts the Y positions of all of the data associated with this BackboneSet
   * 
   * @param visibleBackboneStart backbone start bp in visible selection
   * @param visibleBackboneStop backbone stop bp in visible selection
   * @returns an object containing timing info so we can log it if we choose
   */
  public adjustVisibleSet(visibleBackboneStart: number, visibleBackboneStop: number)
  {
    const startTime = Date.now();

    // Change visible backbone section
    this.backbone.adjustYPositionsBasedOnVisibleStartAndStop({
      start: visibleBackboneStart,
      stop: visibleBackboneStop,
    });
    this.backbone.recalculateLabelYPositions();
    const backboneEndTime = Date.now();

    this.datatrackSets.forEach(set => {
      set.datatracks.forEach(datatrack => {
        datatrack.adjustYPositionsBasedOnVisibleStartAndStop({
          start: visibleBackboneStart,
          stop: visibleBackboneStop
        });
        datatrack.recalculateLabelYPositions();
      });
    });
    const datatracksEndTime = Date.now();

    this.processGeneLabels();
    const geneLabelsEndTime = Date.now();

    return {
      'Backbone adjustment time': backboneEndTime - startTime,
      'Backbone datatracks adjustment time': datatracksEndTime - backboneEndTime,
      'Backbone gene labels processing time': geneLabelsEndTime - datatracksEndTime,
    };
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
    this.datatrackSets.forEach((set, index) => {
      set.datatracks.forEach((section) => {
        section.posX1 = this.backbone.posX2 + (DataTrack_X_OFFSET) * (index + 1) + (DataTrack_X_OFFSET * index);
        section.posX2 = section.posX1 + SVGConstants.dataTrackWidth;
        section.width = SVGConstants.dataTrackWidth;
        if (section.label)
        {
          section.label.posX = section.posX2;
        }
      });
    });
  }

  private processGeneLabels()
  {
    const allLabels: Label[] = [];
    this.datatrackSets.forEach((set) => {
      // TODO (SGD): Why the magic number "0" here?
      //  If the DatatrackSet is intended to have only one type of Datatrack, we should expand that model.
      //  Otherwise this is a fragile way to do this (datatracks could be empty)
      if (set.datatracks.length > 0 && set.datatracks[0].type === 'gene')
      {
        set.datatracks.forEach((section) => {
          if (section.label)
          {
            allLabels.push(section.label);
          }
        });
      }
    });
    this.datatrackLabels = allLabels;

    mergeGeneLabels(this.datatrackLabels as GeneLabel[]);
  }

  public addNewDatatrackSetToEnd(datatrackSections: DatatrackSection[], type: DatatrackSectionType)
  {
    this.datatrackSets.push(new DatatrackSet(datatrackSections, type));
    this.setDatatrackXPositions();
  }

  public addNewDatatrackSetToStart(datatrackSections: DatatrackSection[], type: DatatrackSectionType)
  {
    this.datatrackSets.unshift(new DatatrackSet(datatrackSections, type));
    this.setDatatrackXPositions();
  }

  public addToDatatrackSet(datatrackSections: DatatrackSection[], datatrackSetIdx: number)
  {
    this.datatrackSets[datatrackSetIdx].addDatatrackSections(datatrackSections);
    this.setDatatrackXPositions();
  }

  public removeDatatrackSet(datatrackSetIdx: number)
  {
    this.datatrackSets.splice(datatrackSetIdx, 1);
    this.setDatatrackXPositions();
  }
}