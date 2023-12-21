import SVGConstants, { SVGPositionVariables } from "@/utils/SVGConstants";
import { GenomicSet } from "./GenomicSet";
import Label, { GeneLabel, IntermediateGeneLabel } from "./Label";
import SyntenyRegion from "./SyntenyRegion";
import SyntenySection from "./SyntenySection";
import DatatrackSet from "./DatatrackSet";
import { mergeAndCreateGeneLabels } from "@/utils/GeneLabelMerger";
import {
  calculateDetailedPanelSVGYPositionBasedOnBackboneAlignment,
  getDetailedPanelXPositionForDatatracks,
  getDetailedPanelXPositionForSynteny,
  isGenomicDataInViewport,
  getOverviewPanelXPosition,
} from "@/utils/Shared";
import SpeciesMap from "./SpeciesMap";
import logger from "@/logger";

const LEVEL_2_WIDTH_MULTIPLIER = 0.75;

/**
 * Model for representing a set of SyntenyRegions for the same species and map
 */
export default class SyntenyRegionSet extends GenomicSet
{
  regions: SyntenyRegion[] = [];
  order: number = 1;
  renderType: 'overview' | 'detailed' = 'overview';
  geneLabels: GeneLabel[] = [];
  // TODO: figure out if this is this best place for this,
  // because it's only relevant to variant density
  maxVariantCount?: number;
  variantBinSize?: number;

  constructor(speciesName: string, map: SpeciesMap, regions: SyntenyRegion[],
    order: number, renderType: 'overview' | 'detailed', svgPositions: SVGPositionVariables)
  {
    super(speciesName, map);
    this.regions = regions;
    this.order = order;
    this.renderType = renderType;

    this.setRegionXPositionsBasedOnOrder(svgPositions);
    this.createTitleLabels(svgPositions);
    this.sortBasePairLabels(svgPositions);
    
    if (renderType === 'detailed')
    {
      logger.time(`Create Gene Labels`);
      this.generateGeneLabels(svgPositions);
      logger.timeEnd(`Create Gene Labels`);
    }
  }

  private generateGeneLabels(svgPositions: SVGPositionVariables)
  {
    // Get:
    // + X position based on where the gene datatrack set is positioned in the regions
    // + window start base pair (backbone)
    // + window stop base pair (backbone)
    // TODO: The backbone window start/stop should probably be more accessible at this level in some way
    let xPos: number | null = null;
    let visibleBackboneStart: number | null = null;
    let visibleBackboneStop: number | null = null;
    for (let i = 0; i < this.regions.length; i++)
    {
      if (visibleBackboneStart == null || visibleBackboneStop == null)
      {
        visibleBackboneStart = this.regions[i].gaplessBlock.windowStart;
        visibleBackboneStop = this.regions[i].gaplessBlock.windowStop;
      }

      for (let j = 0; j < this.regions[i].datatrackSets.length; j++)
      {
        if (this.regions[i].datatrackSets[j].type === 'gene')
        {
          xPos = getDetailedPanelXPositionForDatatracks(this.order, j, svgPositions.overviewPanelWidth) + SVGConstants.dataTrackWidth;
          break;
        }
      }

      if (xPos != null && visibleBackboneStart != null && visibleBackboneStop != null)
      {
        break;
      }
    }

    if (xPos == null || visibleBackboneStart == null || visibleBackboneStop == null)
    {
      logger.debug(`(SyntenyRegionSet) generateGeneLabels: xPos || visibleBackboneStart || visibleBackboneStop is null after iterating through DatatrackSets`);
      logger.debug(`  ${xPos}, ${visibleBackboneStart}, ${visibleBackboneStop}`);
      return;
    }

    // Create gene labels for all genes that are contained in the viewport
    const filteredGenes = this.regions.map(r => r.genes)
      .flat()
      // Using '!' to declare visibleBackboneStart and visibleBackboneStop are never null at this point
      // Typescript seems to not be able to pick this up inside of an anonymous function
      .filter(g => isGenomicDataInViewport(g, visibleBackboneStart!, visibleBackboneStop!));

    logger.time(`Create intermediate labels`);
    // Create intermediate gene labels for all genes in the viewport:
    const intermediateLabels: IntermediateGeneLabel[] = [];
    for (let i = 0; i < filteredGenes.length; i++)
    {
      const g = filteredGenes[i];
      const yPos = calculateDetailedPanelSVGYPositionBasedOnBackboneAlignment(g.backboneStart, 
        g.backboneStop, visibleBackboneStart, visibleBackboneStop);
      intermediateLabels.push({
        gene: g,
        posY: yPos,
        posX: xPos,
      });
    }
    logger.timeEnd(`Create intermediate labels`);

    this.geneLabels = mergeAndCreateGeneLabels(intermediateLabels);
  }

  public addRegions(regions: SyntenyRegion[], svgPositions: SVGPositionVariables)
  {
    this.regions.length > 0 ? this.regions = this.regions.concat(regions) : this.regions = regions;
    this.setRegionXPositionsBasedOnOrder(svgPositions);
  }

  protected createTitleLabels(svgPositions: SVGPositionVariables)
  {
    const speciesLabel = new Label({
      posX: (this.renderType === 'overview')
        ? getOverviewPanelXPosition(this.order, svgPositions)
        : getDetailedPanelXPositionForSynteny(this.order, svgPositions.overviewPanelWidth),
      posY: SVGConstants.trackLabelYPosition,
      text: this.speciesName,
    });

    const mapLabel = new Label({
      posX: (this.renderType === 'overview')
        ? getOverviewPanelXPosition(this.order, svgPositions)
        : getDetailedPanelXPositionForSynteny(this.order, svgPositions.overviewPanelWidth),
      posY: SVGConstants.trackMapLabelYPosition,
      text: this.mapName,
      addClass: 'smaller',
    });

    this.titleLabels = [speciesLabel, mapLabel];
  }

  private setRegionXPositionsBasedOnOrder(svgPositions: SVGPositionVariables)
  {
    if (this.regions.length > 0)
    {
      this.regions.forEach(region => {
        this.setGaplessSyntenyBlockXPositions(region.gaplessBlock, svgPositions);
        this.setSyntenyBlockXPositions(region.syntenyBlocks, svgPositions);
        this.setSyntenyGapXPositions(region.syntenyGaps, svgPositions);
        this.setDatatrackSectionXPositions(region.datatrackSets, svgPositions);
      });
    }
  }

  private setSyntenyGapXPositions(sections: SyntenySection[], svgPositions: SVGPositionVariables)
  {
    sections.forEach(section => {
      let blockPosX1: number = 0;
      if (this.renderType === 'overview')
      {
        blockPosX1= getOverviewPanelXPosition(this.order, svgPositions);
      }
      else if (this.renderType === 'detailed')
      {
        blockPosX1 = getDetailedPanelXPositionForSynteny(this.order, svgPositions.overviewPanelWidth);
      }

      const posX = blockPosX1 + (SVGConstants.trackWidth / 2);
      section.posX1 = posX;
      section.posX2 = posX;
      section.width = 0;
    });
  }

  private setSyntenyBlockXPositions(sections: SyntenySection[], svgPositions: SVGPositionVariables)
  {
    sections.forEach(section => {
      if (this.renderType === 'overview')
      {
        section.posX1 = getOverviewPanelXPosition(this.order, svgPositions);
      }
      else if (this.renderType === 'detailed')
      {
        section.posX1 = getDetailedPanelXPositionForSynteny(this.order, svgPositions.overviewPanelWidth);
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

  private setGaplessSyntenyBlockXPositions(section: SyntenySection, svgPositions: SVGPositionVariables)
  {
    this.setSyntenyBlockXPositions([section], svgPositions);
    section.startLabel.posX = section.posX2;
    section.stopLabel.posX = section.posX2;
  }

  private setDatatrackSectionXPositions(datatrackSets: DatatrackSet[], svgPositions: SVGPositionVariables)
  {
    // TODO: Skip for overview since datatracks are only shown in Detailed Panel?
    datatrackSets.forEach((set, index) => {
      let posX1 = 0;
      if (this.renderType === 'overview')
      {
        posX1 = getOverviewPanelXPosition(this.order, svgPositions);
      }
      else if (this.renderType === 'detailed')
      {
        posX1 = getDetailedPanelXPositionForDatatracks(this.order, index, svgPositions.overviewPanelWidth);
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
  }

  private sortBasePairLabels(svgPositions: SVGPositionVariables)
  {
    const regionPosX2 = getOverviewPanelXPosition(this.order, svgPositions) + SVGConstants.trackWidth;
    const labelPairs = this.regions.map((region) =>{
      return {startLabel: region.gaplessBlock.startLabel, stopLabel: region.gaplessBlock.stopLabel};
    });
    labelPairs.sort((a, b) =>
        (Math.abs(b.startLabel.posY - b.stopLabel.posY)) - Math.abs((a.startLabel.posY - a.stopLabel.posY)));
    for (let i = 0; i < labelPairs.length; i++)
    {
      const labelPair = labelPairs[i];
      labelPair.startLabel.posX = labelPair.startLabel.labelOnLeft ? regionPosX2 - SVGConstants.trackWidth : regionPosX2;
      labelPair.stopLabel.posX = labelPair.stopLabel.labelOnLeft ? regionPosX2 - SVGConstants.trackWidth : regionPosX2;
      if (Math.abs(labelPair.stopLabel.posY - labelPair.startLabel.posY) > 14)
      {
        labelPair.startLabel.isVisible = true;
        labelPair.stopLabel.isVisible = true;
        continue;
      }
    }
  }

  public get geneDatatrackSetIndex()
  {
    for (let i = 0; i < this.regions.length; i++)
    {
      for (let j = 0; j < this.regions[i].datatrackSets.length; j++)
      {
        if (this.regions[i].datatrackSets[j].type === 'gene')
        {
          return j;
        }
      }
    }

    return 0;
  }

  public setOrder(order: number) {
    this.order = order;
  }
}