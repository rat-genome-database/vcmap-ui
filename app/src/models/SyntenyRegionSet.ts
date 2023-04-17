import SVGConstants from "@/utils/SVGConstants";
import { GenomicSet } from "./GenomicSet";
import Label, { GeneLabel } from "./Label";
import SyntenyRegion from "./SyntenyRegion";
import SyntenySection from "./SyntenySection";
import DatatrackSet from "./DatatrackSet";
import { mergeGeneLabels } from "@/utils/GeneLabelMerger";
import Gene from "./Gene";
import { getDetailedPanelXPositionForDatatracks, getDetailedPanelXPositionForSynteny } from "@/utils/Shared";

const LEVEL_2_WIDTH_MULTIPLIER = 0.75;

function getOverviewPanelXPosition(order: number)
{
  return (order * -80) + SVGConstants.backboneXPosition;
}

/**
 * Model for representing a set of SyntenyRegions for the same species and map
 */
export default class SyntenyRegionSet extends GenomicSet
{
  regions: SyntenyRegion[] = [];
  order: number = 1;
  renderType: 'overview' | 'detailed' = 'overview';
  // TODO: figure out if this is this best place for this,
  // because it's only relevant to variant density
  maxVariantCount?: number;

  constructor(speciesName: string, mapName: string, regions: SyntenyRegion[], order: number, renderType: 'overview' | 'detailed')
  {
    super(speciesName, mapName);
    this.regions = regions;
    this.order = order;
    this.renderType = renderType;

    this.setRegionXPositionsBasedOnOrder();
    this.createTitleLabels();
    this.sortBasePairLabels();
    
    console.time(`Process Gene Labels`);
    this.processGeneLabelsInAllRegions();
    console.timeEnd(`Process Gene Labels`);
  }

  public processGeneLabelsInAllRegions()
  {
    // Gather all gene labels across the gene datatracks belonging to this SyntenyRegionSet
    const geneLabels: GeneLabel[] = [];
    const genes: Gene[] = [];
    this.regions.forEach(r => {
      geneLabels.push(...r.geneDatatrackLabels);
      genes.push(...r.genes);
    });

    mergeGeneLabels(geneLabels, genes);
  }

  public addRegions(regions: SyntenyRegion[])
  {
    this.regions.length > 0 ? this.regions = this.regions.concat(regions) : this.regions = regions;
    this.setRegionXPositionsBasedOnOrder();
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
        this.setDatatrackSectionXPositions(region.datatrackSets);
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

  private setDatatrackSectionXPositions(datatrackSets: DatatrackSet[])
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
  }

  private sortBasePairLabels()
  {
    const labelPosX = getOverviewPanelXPosition(this.order) + SVGConstants.trackWidth;
    const labelPairs = this.regions.map((region) =>{
      return {startLabel: region.gaplessBlock.startLabel, stopLabel: region.gaplessBlock.stopLabel};
    });
    labelPairs.sort((a, b) =>
        (Math.abs(b.startLabel.posY - b.stopLabel.posY)) - Math.abs((a.startLabel.posY - a.stopLabel.posY)));
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

  public get geneLabels()
  {
    return this.regions.map(r => r.geneDatatrackLabels).flat();
  }
}