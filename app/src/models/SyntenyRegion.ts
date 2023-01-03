import BackboneSection from './BackboneSection';
import SyntenySection from './SyntenySection';
import DatatrackSection from './DatatrackSection';
import Label from './Label';
import OrthologLine from './OrthologLine';
import GenomicSection from './GenomicSection';

interface SyntenyRegionParams
{
  species: string;
  mapName: string;
  gaplessBlock: SyntenySection;
}

//This model is used to store data for a syntenic region off-backbone
export default class SyntenyRegion
{
  gaplessBlock: SyntenySection;
  syntenyGaps: SyntenySection[] = [];                         // synteny gaps occupying this region
  syntenyBlocks: SyntenySection[] = [];                       // synteny blocks occupying this region
  datatrackSections: DatatrackSection[] = [];                 // DatatrackSections belonging to this SyntenyRegion
  orthologLines: OrthologLine[] = [];                         // OrthologLines belonging to this SyntenyRegion
  backboneSection: BackboneSection | undefined;               // backbone section that this synteny region is aligned to
  species: string = '';                                       // species that this region is from
  mapName: string = '';
  // NOTE: We should evaluate if we want this, if its just a copy of the references to the labels in SyntenyRegion.datatrackSections
  datatrackLabels: Label[] = [];                               // array of Label objects associated with the datatrackSections

  constructor(params: SyntenyRegionParams)
  {
    this.species = params.species;
    this.mapName = params.mapName;
    this.gaplessBlock = params.gaplessBlock;
  }

  public adjustSectionYPositionsBasedOnVisibleStartAndStop(visibleBackboneStart: number, visibleBackboneStop: number)
  {
    this.genomicSections.forEach(section => {
      section.adjustYPositionsBasedOnVisibleStartAndStop(visibleBackboneStart, visibleBackboneStop);
      section.recalculateLabelYPositions();
    });
    this.orthologLines.forEach(line => {
      line.setSVGPositions();
    });
  }

  public addSyntenyGaps(syntenyGap: SyntenySection[])
  {
    this.syntenyGaps.length > 0 ? this.syntenyGaps = this.syntenyGaps.concat(syntenyGap) : this.syntenyGaps = syntenyGap;
    this.syntenyGaps.sort((a, b) => a.posY1 - b.posY1);
  }

  public addSyntenyBlocks(syntenyBlock: SyntenySection[])
  {
    this.syntenyBlocks.length > 0 ? this.syntenyBlocks = this.syntenyBlocks.concat(syntenyBlock) : this.syntenyBlocks = syntenyBlock;
    this.syntenyBlocks.sort((a, b) => a.posY1 - b.posY1);
  }

  public addDatatrackSections(datatrackSection: DatatrackSection[])
  {
    this.datatrackSections.length > 0 ? this.datatrackSections = this.datatrackSections.concat(datatrackSection) : this.datatrackSections = datatrackSection;
  }

  public addOrthologLines(orthologLine: OrthologLine[])
  {
    this.orthologLines.length > 0 ? this.orthologLines = this.orthologLines.concat(orthologLine) : this.orthologLines = orthologLine;
  }

  private get genomicSections()
  {
    let genomicSections: GenomicSection[] = [this.gaplessBlock];
    genomicSections = genomicSections.concat(this.syntenyBlocks).concat(this.syntenyGaps).concat(this.datatrackSections);
    return genomicSections; 
  }
}