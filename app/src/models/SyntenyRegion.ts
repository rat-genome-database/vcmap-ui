import BackboneSection, { RenderType } from '@/models/BackboneSection';
import SyntenySection from './SyntenySection';
import DatatrackSection from './DatatrackSection';
import Label from './Label';
import OrthologLine from './OrthologLine';
import GenomicSection from './GenomicSection';
import { SyntenyComponent } from '@/api/SyntenyApi';

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
  rawGaps: SyntenyComponent[] = [];                           // raw synteny gaps from the API
  syntenyGaps: SyntenySection[] = [];                         // synteny gaps occupying this region
  syntenyBlocks: SyntenySection[] = [];                       // synteny blocks occupying this region
  datatrackSections: DatatrackSection[] = [];                 // DatatrackSections belonging to this SyntenyRegion
  geneIds: number[] = [];                                     // Gene IDs belonging to genes in this SyntenyRegion
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

  public splitBlockWithGaps(gaps: SyntenyComponent[], windowStart:number, windowStop: number, renderType: RenderType)
  {
    this.syntenyBlocks = [];
    this.syntenyGaps = [];

    const block = this.gaplessBlock;
    const processedGaps: SyntenySection[] = [];
    const processedBlocks: SyntenySection[] = [];
    const chromosome = block.chromosome;

    const gapsLine = new SyntenySection({
      start: block.speciesStart,
      stop: block.speciesStop,
      backboneSection: block.backboneSection,
      type: 'gap',
      chromosome: chromosome,
      chainLevel: block.chainLevel,
      orientation: '+',
    });
    processedGaps.push(gapsLine);
  
    let lastGapBackboneStop = 0;
    let lastGapSpeciesStop = 0;
  
    gaps.forEach((gap, index) => {
      const blockBackboneStart = block.backboneSection.start;
      const gapBackboneStart = gap.backboneStart;
  
      const orientedGapStart = (block.isInverted) ? gap.stop : gap.start;
      const orientedGapStop = (block.isInverted) ? gap.start : gap.stop;
  
      if (index === 0 && (gapBackboneStart <= blockBackboneStart))
      {
        // Block starts off with a gap
        lastGapBackboneStop = gap.backboneStop;
        lastGapSpeciesStop = orientedGapStop;
      }
      else if (index === 0)
      {
        //First gap start not before block start, so create block section and then gap section
        const blockBackboneSection = new BackboneSection({
          start: block.backboneSection.start,
          stop: gap.backboneStart,
          windowStart: windowStart,
          windowStop: windowStop,
          renderType: renderType
        });
        const blockSyntenicSection = new SyntenySection({
          start: block.speciesStart, // Should be oriented correctly regardless of inversion since it was taken into account during gapless block creation
          stop: orientedGapStart,
          backboneSection: blockBackboneSection,
          type: 'block',
          orientation: block.orientation,
          chromosome: chromosome,
          chainLevel: block.chainLevel,
        });
  
        processedBlocks.push(blockSyntenicSection);
  
        lastGapBackboneStop = gap.backboneStop;
        lastGapSpeciesStop = orientedGapStop;
      }
      else if (lastGapBackboneStop && lastGapSpeciesStop && gap.backboneStart >= lastGapBackboneStop)
      {
        // Next gap start is after last processed section stop, so create block section and then gap section
        const blockBackboneSection = new BackboneSection({
          start: lastGapBackboneStop,
          stop: gap.backboneStart,
          windowStart: windowStart,
          windowStop: windowStop,
          renderType: renderType,
        });
        const blockSyntenicSection = new SyntenySection({
          start: lastGapSpeciesStop, // Should be oriented correctly regardless of inversion, since previous processed section would take it into account
          stop: orientedGapStart,
          backboneSection: blockBackboneSection,
          type: 'block',
          orientation: block.orientation,
          chromosome: chromosome,
          chainLevel: block.chainLevel,
        });
  
        processedBlocks.push(blockSyntenicSection);
        lastGapBackboneStop = gap.backboneStop;
        lastGapSpeciesStop = orientedGapStop;
      }
      else
      {
        const lastGap = gaps[gaps.length - 1];
  
        if (lastGap && lastGap.backboneStop > gap.backboneStart && lastGap.backboneStop > gap.backboneStop)
        {
          // current gap is encompassed by last gap (safe-guard)
          return;
        }
  
        // TODO: Unsure if anything ever makes it here... may need to investigate
        const blockBackboneSection = new BackboneSection({
          start: lastGap.backboneStop,
          stop: gap.backboneStart,
          windowStart: windowStart,
          windowStop: windowStop,
          renderType: renderType,
        });
        const blockSyntenicSection = new SyntenySection({
          start: lastGap.stop, // Should be oriented correctly regardless of inversion, since previous processed section would take it into account
          stop: gap.start,
          backboneSection: blockBackboneSection,
          type: 'block',
          orientation: block.orientation,
          chromosome: chromosome,
          chainLevel: block.chainLevel,
        });
  
        processedBlocks.push(blockSyntenicSection);
      }
    });
  
    // Check to see if the gapless block ends with a gap. If not, then create and process the last synteny block
    const finalGap = gaps[gaps.length - 1];
    if (finalGap && finalGap.backboneStop < block.backboneSection.stop)
    {
      const blockBackboneSection = new BackboneSection({
        start: finalGap.backboneStop,
        stop: block.backboneSection.stop,
        windowStart: windowStart,
        windowStop: windowStop,
        renderType: renderType,
      });
      const blockSyntenicSection = new SyntenySection({
        start: block.isInverted ? finalGap.start : finalGap.stop,
        stop: block.speciesStop, // Should be oriented correctly regardless of inversion since it was taken into account during gapless block creation
        backboneSection: blockBackboneSection,
        type: 'block',
        orientation: block.orientation,
        chromosome: chromosome,
        chainLevel: block.chainLevel,
      });
  
      processedBlocks.push(blockSyntenicSection);
    }
  
    this.syntenyBlocks = processedBlocks;
    this.syntenyGaps = processedGaps;
  }

  public get sortedSyntenicBlocksAndGaps()
  {
    let blocksAndGaps: SyntenySection[] = this.syntenyBlocks;
    blocksAndGaps = blocksAndGaps.concat(this.syntenyGaps);
    blocksAndGaps.sort((a, b) => {
      // If inverted, sections with largest speciesStart should be at the front of the array
      return (this.gaplessBlock.isInverted) ? (a.speciesStart - b.speciesStart) * -1 : (a.speciesStart - b.speciesStart);
    });

    return blocksAndGaps;
  }

  private get genomicSections()
  {
    let genomicSections: GenomicSection[] = [this.gaplessBlock];
    genomicSections = genomicSections.concat(this.syntenyBlocks).concat(this.syntenyGaps).concat(this.datatrackSections);
    return genomicSections; 
  }
}