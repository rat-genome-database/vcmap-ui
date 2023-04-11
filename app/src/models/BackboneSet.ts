import { ProcessedGenomicData } from "@/utils/BackboneBuilder";
import SVGConstants from "@/utils/SVGConstants";
import { mergeGeneLabels } from "@/utils/GeneLabelMerger";
import BackboneSection from "./BackboneSection";
import Gene from "./Gene";
import DatatrackSection, { DatatrackSectionType } from "./DatatrackSection";
import DatatrackSet from "./DatatrackSet";
import { GenomicSet } from "./GenomicSet";
import Label, { GeneLabel } from "./Label";

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

    console.time(`Backbone Gene Label Processing`);
    this.processGeneLabels();
    console.timeEnd(`Backbone Gene Label Processing`);
  }

  /**
   * TODO: We might not need this at all anymore if we are re-creating the BackboneSet on each nav or zoom 
   * instead of just adjusting Y positions
   */
  public adjustVisibleSet(visibleBackboneStart: number, visibleBackboneStop: number)
  {
    // TODO: No-op for now
  }

  /**
   * Adjusts the Y positions of all of the data associated with this BackboneSet
   * 
   * @param visibleBackboneStart backbone start bp in visible selection
   * @param visibleBackboneStop backbone stop bp in visible selection
   * @returns an object containing timing info so we can log it if we choose
   */
  // public adjustVisibleSet(visibleBackboneStart: number, visibleBackboneStop: number)
  // {
  //   const visibleStartStopString = `[${visibleBackboneStart}, ${visibleBackboneStop}]`;

  //   // Change visible backbone section
  //   console.time(`Backbone Y position adjustment ${visibleStartStopString}`);
  //   this.backbone.adjustYPositionsBasedOnVisibleStartAndStop({
  //     start: visibleBackboneStart,
  //     stop: visibleBackboneStop,
  //   });
  //   this.backbone.recalculateLabelYPositions();
  //   console.timeEnd(`Backbone Y position adjustment ${visibleStartStopString}`);

  //   console.time(`Backbone Datatrack Y position adjustments ${visibleStartStopString}`);
  //   for (let i = 0; i < this.datatrackSets.length; i++)
  //   {
  //     const set = this.datatrackSets[i];
  //     for (let j = 0; j < set.datatracks.length; j++)
  //     {
  //       set.datatracks[j].adjustYPositionsBasedOnVisibleStartAndStop({
  //         start: visibleBackboneStart,
  //         stop: visibleBackboneStop
  //       });
  //       set.datatracks[j].recalculateLabelYPositions();
  //     }
  //   }
  //   console.timeEnd(`Backbone Datatrack Y position adjustments ${visibleStartStopString}`);

  //   console.time(`Backbone Gene Label Processing ${visibleStartStopString}`);
  //   this.processGeneLabels();
  //   console.timeEnd(`Backbone Gene Label Processing ${visibleStartStopString}`);
  // }

  // public updateBackboneGenes(genes: Gene[])
  // {
  //   this.backbone.addBackboneGenes(genes);
  // }

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
      addClass: 'smaller',
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
        section.posX1 = this.backbone.posX2 + (SVGConstants.backboneDatatrackXOffset) * (index + 1) + (SVGConstants.backboneDatatrackXOffset * index);
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

    // TODO: Seems a bit precarious to cast a type of Label[] as GeneLabel[] here... could maybe be addressed at the same time
    // as the TODO above this one
    //mergeGeneLabels(this.datatrackLabels as GeneLabel[], this.backbone.backboneGenes ?? []);
    mergeGeneLabels(this.datatrackLabels as GeneLabel[], this.backbone.backboneGenes ?? []);
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