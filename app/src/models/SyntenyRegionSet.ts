import { SpeciesSyntenyData } from "@/api/SyntenyApi";
import SVGConstants from "@/utils/SVGConstants";
import DatatrackSection from "./DatatrackSection";
import { LoadedGene } from "./DatatrackSection";
import { GenomicSet } from "./GenomicSet";
import Label, { GeneLabel } from "./Label";
import OrthologLine from "./OrthologLine";
import SyntenyRegion from "./SyntenyRegion";
import SyntenySection from "./SyntenySection";
import { mergeGeneLabels } from "@/utils/GeneLabelMerger";

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
  return getDetailedPanelXPositionForSynteny(order) + 30;
}

/**
 * Model for representing a set of SyntenyRegions for the same species and map
 */
export default class SyntenyRegionSet extends GenomicSet
{
  regions: SyntenyRegion[] = [];
  order: number = 1;
  renderType: 'overview' | 'detailed' = 'overview';
  speciesSyntenyData: SpeciesSyntenyData; // Raw synteny data for the species represented by this SyntenyRegionSet
  threshold: number; // The synteny threshold that was used to create this SyntenyRegionSet
  datatrackLabels: Label[] = []; // array of Label objects associated with the datatrackSections in every SyntenyRegion

  constructor(speciesName: string, mapName: string, regions: SyntenyRegion[], order: number, renderType: 'overview' | 'detailed', speciesSyntenyData: SpeciesSyntenyData, threshold: number, geneLabels?: Label[])
  {
    super(speciesName, mapName);
    this.regions = regions;
    this.order = order;
    this.renderType = renderType;
    this.speciesSyntenyData = speciesSyntenyData;
    this.threshold = threshold;
    this.datatrackLabels = geneLabels ?? [];

    this.setRegionXPositionsBasedOnOrder();
    this.createTitleLabels();
    this.sortBasePairLabels();
  }

  public adjustVisibleSet(visibleBackboneStart: number, visibleBackboneStop: number,  updateCache: boolean, masterGeneMap?: Map<number, LoadedGene>)
  {
    let removedIds: number[] = [];
    for (let index = 0; index < this.regions.length; index++)
    {
      const currRegion = this.regions[index];
      if (updateCache && this.regionIsVisible(currRegion, visibleBackboneStart, visibleBackboneStop))
      {
        removedIds = removedIds.concat(currRegion.geneIds);
        this.regions.splice(index, 1);
        index--;
      }
      else
      {
        currRegion.adjustSectionYPositionsBasedOnVisibleStartAndStop(visibleBackboneStart, visibleBackboneStop);
      }
    }

    if (updateCache && masterGeneMap && removedIds.length > 0)
    {
      removedIds.forEach((id) => masterGeneMap.delete(id));
    }
    
    this.processGeneLabels();
  }

  public updateRawData(speciesSyntenyData: SpeciesSyntenyData)
  {
    if (this.speciesSyntenyData.allGenes && speciesSyntenyData.allGenes)
    {
      this.speciesSyntenyData.allGenes = this.speciesSyntenyData.allGenes.concat(speciesSyntenyData.allGenes);
    }

    if (this.speciesSyntenyData.regionData && speciesSyntenyData.regionData)
    {
      this.speciesSyntenyData.regionData = this.speciesSyntenyData.regionData.concat(speciesSyntenyData.regionData);
    }
  }

  public addRegions(regions: SyntenyRegion[])
  {
    this.regions.length > 0 ? this.regions = this.regions.concat(regions) : this.regions = regions;
    this.setRegionXPositionsBasedOnOrder();
  }

  public addDatatrackLabels(labels: Label[])
  {
    this.datatrackLabels.length > 0 ? this.datatrackLabels = this.datatrackLabels.concat(labels) : this.datatrackLabels = labels;
  }

  protected createTitleLabels()
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
        this.setGaplessSyntenyBlockXPositions(region.gaplessBlock);
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

  private setGaplessSyntenyBlockXPositions(section: SyntenySection)
  {
    this.setSyntenyBlockXPositions([section]);
    section.startLabel.posX = section.posX2;
    section.stopLabel.posX = section.posX2;
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
      // set the label x position if there is one
      if (section.label)
      {
        section.label.posX = section.posX2;
      }
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

  private sortBasePairLabels()
  {
    const labelPosX = getOverviewPanelXPosition(this.order) + SVGConstants.trackWidth;
    const labelPairs = this.regions.map((region) =>{
      return {startLabel: region.gaplessBlock.startLabel, stopLabel: region.gaplessBlock.stopLabel};
    });
    labelPairs.sort((a, b) => (Math.abs(b.startLabel.posY - b.stopLabel.posY)) - Math.abs((a.startLabel.posY - a.stopLabel.posY)));
    for (let i = 0; i < labelPairs.length; i++)
    {
      const labelPair = labelPairs[i];
      labelPair.startLabel.posX = labelPosX;
      labelPair.stopLabel.posX = labelPosX;
      if (Math.abs(labelPair.stopLabel.posY - labelPair.startLabel.posY) > 14)
      {
        labelPair.startLabel.isVisible = true;
        labelPair.stopLabel.isVisible = true;
        continue;
      }
    }
  }

  public processGeneLabels()
  {
    const allLabels: any[] = [];
    this.datatrackLabels = [];
    this.regions.forEach((region: SyntenyRegion) => {
      region.datatrackSections.forEach((section) => {
        if (section.label)
        {
          allLabels.push(section.label);
        }
      });
    });
    this.datatrackLabels = allLabels;
    mergeGeneLabels(this.datatrackLabels as GeneLabel[]);
  }

  private regionIsVisible(region: SyntenyRegion, start: number, stop: number): boolean
  {
    return ( region.gaplessBlock.backboneSection.start >= start && region.gaplessBlock.backboneSection.start < stop ) || (region.gaplessBlock.backboneSection.stop <= stop && region.gaplessBlock.backboneSection.stop > start);
  }
}