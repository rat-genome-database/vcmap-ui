import { SpeciesSyntenyData, SyntenyRegionData } from "@/api/SyntenyApi";
import SVGConstants from "@/utils/SVGConstants";
import { GenomicSet } from "./GenomicSet";
import Label, { GeneLabel } from "./Label";
import OrthologLine from "./OrthologLine";
import SyntenyRegion from "./SyntenyRegion";
import SyntenySection from "./SyntenySection";
import { mergeGeneLabels } from "@/utils/GeneLabelMerger";
import { SelectedRegion } from "./BackboneSelection";
import { GenomicSectionFactory } from "./GenomicSectionFactory";
import DatatrackSet from "./DatatrackSet";

const LEVEL_2_WIDTH_MULTIPLIER = 0.75;

function getOverviewPanelXPosition(order: number)
{
  return (order * -80) + SVGConstants.backboneXPosition;
}

function getDetailedPanelXPositionForSynteny(order: number)
{
  return (order * 120) + SVGConstants.selectedBackboneXPosition;
}

function getDetailedPanelXPositionForDatatracks(order: number, index: number)
{
  return getDetailedPanelXPositionForSynteny(order) + 30 * (index + 1);
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
  datatrackLabels: Label[] = []; // array of Label objects associated with the datatrackSections in every SyntenyRegion

  constructor(regions: SyntenyRegion[], order: number, renderType: 'overview' | 'detailed', speciesSyntenyData: SpeciesSyntenyData, geneLabels?: Label[])
  {
    super(speciesSyntenyData.speciesName, speciesSyntenyData.mapName);
    this.regions = regions;
    this.order = order;
    this.renderType = renderType;
    this.speciesSyntenyData = speciesSyntenyData;
    this.datatrackLabels = geneLabels ?? [];

    this.setRegionXPositionsBasedOnOrder();
    this.createTitleLabels();
    this.sortBasePairLabels();
  }

  public adjustVisibleSet(visibleBackboneStart: number, visibleBackboneStop: number,  updateCache: boolean, bufferzone: SelectedRegion, threshold: number, updateData?: SyntenyRegionData[])
  {
    for (let index = 0; index < this.regions.length; index++)
    {
      const currRegion = this.regions[index];
      if (updateCache && this.regionIsVisible(currRegion, bufferzone.basePairStart, bufferzone.basePairStop))
      {
        currRegion.adjustSectionYPositionsBasedOnVisibleStartAndStop(visibleBackboneStart, visibleBackboneStop);
        if (updateData)
        {
          const updateGaps = updateData.find(region => region.block.backboneStart == currRegion.gaplessBlock.backboneAlignment.start);
          if (updateGaps)
          {
            const factory = new GenomicSectionFactory(
              this.speciesName, 
              this.mapName,
              currRegion.gaplessBlock.chromosome, 
              { start: visibleBackboneStart, stop: visibleBackboneStop },
              this.renderType
            );
            currRegion.splitBlockWithGaps(factory, updateGaps.gaps, threshold);
            // TODO: Adjust backbone alignments of genes when gaps change
          }
        }
      }
      else if (updateCache)
      {
        currRegion.adjustSectionYPositionsBasedOnVisibleStartAndStop(visibleBackboneStart, visibleBackboneStop);
      }
      else
      {
        currRegion.adjustSectionYPositionsBasedOnVisibleStartAndStop(visibleBackboneStart, visibleBackboneStop);
      }
    }
    
    if (!updateCache)
    {
      this.processGeneLabels();
    }
  }


  public adjustVisibleSetOnNav(visibleBackboneStart: number, visibleBackboneStop: number, adjustedRegion: SelectedRegion, updateCache: boolean, threshold: number, updateData?: SyntenyRegionData[])
  {
    for (let index = 0; index < this.regions.length; index++)
    {
      const currRegion = this.regions[index];
      if (updateCache && this.regionIsVisible(currRegion, adjustedRegion.basePairStart, adjustedRegion.basePairStop))
      {
        currRegion.adjustSectionYPositionsBasedOnVisibleStartAndStop(visibleBackboneStart, visibleBackboneStop);
        if (updateData)
        {
          const updateGaps = updateData.find(region => region.block.backboneStart == currRegion.gaplessBlock.backboneAlignment.start);
          if (updateGaps && updateGaps.gaps.length > 0)
          {
            const factory = new GenomicSectionFactory(
              this.speciesName, 
              this.mapName,
              currRegion.gaplessBlock.chromosome, 
              { start: visibleBackboneStart, stop: visibleBackboneStop },
              this.renderType
            );
            currRegion.splitBlockWithGaps(factory, updateGaps.gaps, threshold);
            // TODO: Adjust backbone alignments of genes when gaps change
          }
        }
      }
      else if (updateCache)
      {
        currRegion.adjustSectionYPositionsBasedOnVisibleStartAndStop(visibleBackboneStart, visibleBackboneStop);
      }
      else
      {
        currRegion.adjustSectionYPositionsBasedOnVisibleStartAndStop(visibleBackboneStart, visibleBackboneStop);
      }
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
      addClass: 'smaller',
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
        this.setDatatrackSectionXPositions(region.datatrackSets, region.orthologLines);
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

  private setDatatrackSectionXPositions(datatrackSets: DatatrackSet[], lines: OrthologLine[])
  {
    datatrackSets.forEach((set, index) => {
      let posX1 = 0;
      if (this.renderType === 'overview')
      {
        posX1 = getOverviewPanelXPosition(this.order);
      }
      else if (this.renderType === 'detailed')
      {
        posX1 = getDetailedPanelXPositionForDatatracks(this.order, index);
      }

      set.datatracks.forEach((section) => {
        section.posX1 = posX1;

        section.posX2 = section.posX1 + SVGConstants.dataTrackWidth;
        // set the label x position if there is one
        if (section.label)
        {
          section.label.posX = section.posX2;
        }
        section.width = Math.abs(section.posX2 - section.posX1);
      });
    });

    lines.forEach(line => {
      const geneDatatrackIdx = datatrackSets.findIndex((set) => set.type === 'gene');
      if (this.renderType === 'overview')
      {
        line.posX2 = getOverviewPanelXPosition(this.order);
      }
      else if (this.renderType === 'detailed')
      {
        line.posX2 = getDetailedPanelXPositionForDatatracks(this.order, geneDatatrackIdx);
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
      region.datatrackSets.forEach((set) => {
        if (set.datatracks && set.datatracks.length > 0 && set.datatracks[0].type === 'gene')
        {
          set.datatracks.forEach(section => {
            if (section.label)
            {
              allLabels.push(section.label);
            }
          });
        }
      });
    });
    this.datatrackLabels = allLabels;
    mergeGeneLabels(this.datatrackLabels as GeneLabel[]);
  }

  private regionIsVisible(region: SyntenyRegion, start: number, stop: number): boolean
  {
    return ( region.gaplessBlock.backboneAlignment.start >= start && region.gaplessBlock.backboneAlignment.start < stop ) || (region.gaplessBlock.backboneAlignment.stop <= stop && region.gaplessBlock.backboneAlignment.stop > start) || (region.gaplessBlock.backboneAlignment.start <= start && region.gaplessBlock.backboneAlignment.stop >= stop);
  }
}