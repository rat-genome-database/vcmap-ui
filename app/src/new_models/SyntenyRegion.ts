import BackboneSection from './BackboneSection';
import SyntenySection from './SyntenySection';
import DatatrackSection from './DatatrackSection';
import Label from './Label';
import SVGConstants from '@/utils/SVGConstants';

interface SyntenyRegionParams
{
  species: string;
  mapName: string;
  gaplessBlock: SyntenySection;
  order: number;
  renderType: 'overview' | 'detailed';
}

function getOverviewPanelXOffset(order: number)
{
  return order * -80;
}

function getDetailedPanelXOffsetForSynteny(order: number)
{
  return order * 120 + 100;
}

function getDetailedPanelXOffsetForDatatracks(order: number)
{
  return getDetailedPanelXOffsetForSynteny(order) + (order * 30);
}

//This model is used to store data for a syntenic region offbackbone
export default class SyntenyRegion
{
  gaplessBlock: SyntenySection;
  syntenyGaps: SyntenySection[] = [];                         // synteny gaps occupying this region
  syntenyBlocks: SyntenySection[] = [];                       // synteny blocks occupying this region
  datatrackSections: DatatrackSection[] = [];                 // DatatrackSections belonging to this SyntenyRegion
  backboneSection: BackboneSection | undefined;               // backbone section that this synteny region is aligned to
  species: string = '';                                       // species that this region is from
  mapName: string = '';
  //chromosome: Chromosome = new Chromosome();                // chromosome that this region is from
  // NOTE: We should evaluate if we want this, if its just a copy of the references to the labels in SyntenyRegion.datatrackSections
  datatrackLabels: Label[] = [];                               // array of Label objects associated with the datatrackSections
  order: number = 1;                                           // what order or "column" this region belongs to (1 is first species synteny track from the backbone, 2 is second, etc...)
  renderType: 'overview' | 'detailed' = 'overview';

  constructor(params: SyntenyRegionParams)
  {
    this.species = params.species;
    this.mapName = params.mapName;
    this.gaplessBlock = params.gaplessBlock;
    this.order = params.order;
    this.renderType = params.renderType;
  }

  public addSyntenyGaps(syntenyGap: SyntenySection[])
  {
    this.syntenyGaps.length > 0 ? this.syntenyGaps = this.syntenyGaps.concat(syntenyGap) : this.syntenyGaps = syntenyGap;
    this.syntenyGaps.sort((a, b) => a.posY1 - b.posY1);
    this.setSyntenyGapXPositions(this.syntenyGaps);
  }

  public addSyntenyBlocks(syntenyBlock: SyntenySection[])
  {
    this.syntenyBlocks.length > 0 ? this.syntenyBlocks = this.syntenyBlocks.concat(syntenyBlock) : this.syntenyBlocks = syntenyBlock;
    this.syntenyBlocks.sort((a, b) => a.posY1 - b.posY1);
    this.setSyntenyBlockXPositions(this.syntenyBlocks);
  }

  public addDatatrackSections(datatrackSection: DatatrackSection[])
  {
    this.datatrackSections.length > 0 ? this.datatrackSections = this.datatrackSections.concat(datatrackSection) : this.datatrackSections = datatrackSection;
    this.setDatatrackSectionXPositions(this.datatrackSections);
  }

  private setSyntenyGapXPositions(sections: SyntenySection[])
  {
    sections.forEach(section => {
      let blockPosX1: number = 0;
      if (this.renderType === 'overview')
      {
        blockPosX1= getOverviewPanelXOffset(this.order) + SVGConstants.backboneXPosition;
      }
      else if (this.renderType === 'detailed')
      {
        blockPosX1 = getDetailedPanelXOffsetForSynteny(this.order) + SVGConstants.selectedBackboneXPosition;
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
        section.posX1 = getOverviewPanelXOffset(this.order) + SVGConstants.backboneXPosition;
      }
      else if (this.renderType === 'detailed')
      {
        section.posX1 = getDetailedPanelXOffsetForSynteny(this.order) + SVGConstants.selectedBackboneXPosition;
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
        section.posX1 = getOverviewPanelXOffset(this.order) + SVGConstants.backboneXPosition;
      }
      else if (this.renderType === 'detailed')
      {
        section.posX1 = getDetailedPanelXOffsetForDatatracks(this.order) + SVGConstants.selectedBackboneXPosition;
      }

      section.posX2 = section.posX1 + SVGConstants.dataTrackWidth;
      section.width = Math.abs(section.posX2 - section.posX1);
    });
  }
}