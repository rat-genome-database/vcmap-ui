import { ProcessedGenomicData } from "@/utils/BackboneBuilder";
import SVGConstants from "@/utils/SVGConstants";
import { mergeAndCreateGeneLabels } from "@/utils/GeneLabelMerger";
import BackboneSection from "./BackboneSection";
import DatatrackSection, { DatatrackSectionType } from "./DatatrackSection";
import DatatrackSet from "./DatatrackSet";
import { GenomicSet } from "./GenomicSet";
import Label, { GeneLabel, IntermediateGeneLabel } from "./Label";
import { calculateDetailedPanelSVGYPositionBasedOnBackboneAlignment, getDetailedPanelXPositionForBackboneDatatracks, isGenomicDataInViewport } from "@/utils/Shared";
import SpeciesMap from "./SpeciesMap";
import logger from "@/logger";

/**
 * Model for representing a set of Backbone sections and its datatrack sections
 */
export default class BackboneSet extends GenomicSet
{
  backbone: BackboneSection;
  datatrackSets: DatatrackSet[] = [];
  geneLabels: GeneLabel[] = [];
  // TODO: figure out if this is this best place for this,
  // because it's only relevant to variant density
  maxVariantCount?: number;
  variantBinSize?: number;

  constructor(backboneSection: BackboneSection, map: SpeciesMap, processedGenomicData?: ProcessedGenomicData)
  {
    super(backboneSection.speciesName, map);

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

    if (this.backbone.renderType === 'detailed')
    {
      console.time(`Create Backbone Gene Labels`);
      this.generateGeneLabels();
      console.timeEnd(`Create Backbone Gene Labels`);
    }
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
        section.posX1 = getDetailedPanelXPositionForBackboneDatatracks(this.backbone.posX2, index);
        //section.posX1 = this.backbone.posX2 + (SVGConstants.backboneDatatrackXOffset) * (index + 1) + (SVGConstants.backboneDatatrackXOffset * index);
        section.posX2 = section.posX1 + SVGConstants.dataTrackWidth;
        section.width = SVGConstants.dataTrackWidth;
        if (section.label)
        {
          section.label.posX = section.posX2;
        }
      });
    });
  }

  private generateGeneLabels()
  {
    if (this.backbone.backboneGenes == null || this.backbone.backboneGenes.length === 0)
    {
      return;
    }

    //
    // First, create our intermediate gene-labels before passing them to the label merge processing:

    // Get X position based on where the gene datatrack set is positioned
    let xPos: number | null = null;
    for (let i = 0; i < this.datatrackSets.length; i++)
    {
      if (this.datatrackSets[i].type === 'gene')
      {
        xPos = getDetailedPanelXPositionForBackboneDatatracks(this.backbone.posX2, i) + SVGConstants.dataTrackWidth;
        break;
      }
    }

    if (xPos == null)
    {
      logger.debug(`(BackboneSet) generateGeneLabels: xPos is null after iterating through DatatrackSets`);
      return;
    }

    const filteredGenes = this.backbone.backboneGenes
      .filter(g => isGenomicDataInViewport(g, this.backbone.windowSVGStart, this.backbone.windowStop));

    console.time(`Create intermediate labels`);
    // Create intermediate gene labels for all genes in the viewport:
    const intermediateLabels: IntermediateGeneLabel[] = [];
    for (let i = 0; i < filteredGenes.length; i++)
    {
      const g = filteredGenes[i];
      const yPos = calculateDetailedPanelSVGYPositionBasedOnBackboneAlignment(g.backboneStart, 
        g.backboneStop, this.backbone.windowStart, this.backbone.windowStop);
      intermediateLabels.push({
        gene: g,
        posY: yPos,
        posX: xPos,
      });
    }
    console.timeEnd('Create intermediate labels');

    //
    // Create the visible gene labels from our intermediate labels (apply merging logic as appropriate)
    this.geneLabels = mergeAndCreateGeneLabels(intermediateLabels);
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
    this.updateGeneLabelXPositions();
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
    this.updateGeneLabelXPositions();
  }

  public updateGeneLabelXPositions()
  {
    if (this.backbone.backboneGenes == null || this.backbone.backboneGenes.length === 0)
    {
      return;
    }

    // Get X position based on where the gene datatrack set is positioned
    let xPos: number | null = null;
    for (let i = 0; i < this.datatrackSets.length; i++)
    {
      if (this.datatrackSets[i].type === 'gene')
      {
        xPos = getDetailedPanelXPositionForBackboneDatatracks(this.backbone.posX2, i) + SVGConstants.dataTrackWidth;
        break;
      }
    }

    if (xPos == null)
    {
      logger.debug(`(BackboneSet) updateGeneLabelXPositions: xPos is null after iterating through DatatrackSets`);
      return;
    }

    for (let i = 0; i < this.geneLabels.length; i++)
    {
      this.geneLabels[i].posX = xPos;
    }
  }

  public get geneDatatrackSetIndex()
  {
    for (let i = 0; i < this.datatrackSets.length; i++)
    {
      if (this.datatrackSets[i].type === 'gene')
      {
        return i;
      }
    }

    return 0;
  }
}