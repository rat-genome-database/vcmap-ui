import BackboneSection from '@/models/BackboneSection';
import SyntenySection from './SyntenySection';
import DatatrackSection from './DatatrackSection';
import DatatrackSet from './DatatrackSet';
import Label from './Label';
import OrthologLine from './OrthologLine';
import GenomicSection from './GenomicSection';
import { SyntenyComponent } from '@/api/SyntenyApi';
import { GenomicSectionFactory } from './GenomicSectionFactory';

const GAPS_THRESHOLD_MULTIPLIER = 10;

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
  datatrackSets: DatatrackSet[] = [];                         // Set of DatatrackSections belonging to this SytenyRegion
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
      section.adjustYPositionsBasedOnVisibleStartAndStop({ start: visibleBackboneStart, stop: visibleBackboneStop});
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

  public addDatatrackSections(datatrackSection: DatatrackSection[], datatrackSetIdx: number)
  {
    this.datatrackSets[datatrackSetIdx] && this.datatrackSets[datatrackSetIdx].datatracks.length > 0 ?
      this.datatrackSets[datatrackSetIdx].addDatatrackSections(datatrackSection) : this.datatrackSets[datatrackSetIdx] = new DatatrackSet(datatrackSection);
  }

  public addOrthologLines(orthologLine: OrthologLine[])
  {
    this.orthologLines.length > 0 ? this.orthologLines = this.orthologLines.concat(orthologLine) : this.orthologLines = orthologLine;
  }

  public splitBlockWithGaps(factory: GenomicSectionFactory, gaps: SyntenyComponent[], threshold: number)
  {
    // Clear old blocks and gaps in this region without losing reactivity
    this.syntenyBlocks.splice(0, this.syntenyBlocks.length);
    this.syntenyGaps.splice(0, this.syntenyGaps.length);

    const block = this.gaplessBlock;

    const gapsLine = factory.createSyntenySection({
      start: block.speciesStart,
      stop: block.speciesStop,
      backboneAlignment: block.backboneAlignment,
      type: 'gap',
      orientation: '+',
      chainLevel: block.chainLevel,
    });
    this.syntenyGaps.push(gapsLine);
  
    let lastGapBackboneStop = 0;
    let lastGapSpeciesStop = 0;

    // Filter gaps according to synteny threshold if present
    if (threshold != null)
    {
      gaps = gaps.filter(gap => {
        return ((gap.stop - gap.start) >= (threshold * GAPS_THRESHOLD_MULTIPLIER)) 
          && block.chainLevel === gap.chainLevel
          && (gap.backboneStop > block.windowBasePairRange.start || gap.backboneStart < block.windowBasePairRange.stop)
      });
    }

    if (gaps.length === 0)
    {
      // No gaps to split block with...
      this.syntenyBlocks.push(block);
      return;
    }

    gaps.forEach((gap, index) => {
      const blockBackboneStart = block.backboneAlignment.start;
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
        const blockSyntenicSection = factory.createSyntenySection({
          start: block.speciesStart, // Should be oriented correctly regardless of inversion since it was taken into account during gapless block creation
          stop: orientedGapStart,
          backboneAlignment: { start: block.backboneAlignment.start, stop: gap.backboneStart },
          type: 'block',
          orientation: block.orientation,
          chainLevel: block.chainLevel,
        });
  
        this.syntenyBlocks.push(blockSyntenicSection);
  
        lastGapBackboneStop = gap.backboneStop;
        lastGapSpeciesStop = orientedGapStop;
      }
      else if (lastGapBackboneStop && lastGapSpeciesStop && gap.backboneStart >= lastGapBackboneStop)
      {
        // Next gap start is after last processed section stop, so create block section and then gap section
        const blockSyntenicSection = factory.createSyntenySection({
          start: lastGapSpeciesStop, // Should be oriented correctly regardless of inversion, since previous processed section would take it into account
          stop: orientedGapStart,
          backboneAlignment: { start: lastGapBackboneStop, stop: gap.backboneStart, },
          type: 'block',
          orientation: block.orientation,
          chainLevel: block.chainLevel,
        });
        this.syntenyBlocks.push(blockSyntenicSection);
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
        const blockSyntenicSection = factory.createSyntenySection({
          start: lastGap.stop, // Should be oriented correctly regardless of inversion, since previous processed section would take it into account
          stop: gap.start,
          backboneAlignment: { start: lastGap.backboneStop, stop: gap.backboneStart, },
          type: 'block',
          orientation: block.orientation,
          chainLevel: block.chainLevel,
        });
  
        this.syntenyBlocks.push(blockSyntenicSection);
      }
    });
  
    // Check to see if the gapless block ends with a gap. If not, then create and process the last synteny block
    const finalGap = gaps[gaps.length - 1];
    if (finalGap && finalGap.backboneStop < block.backboneAlignment.stop)
    {
      const blockSyntenicSection = factory.createSyntenySection({
        start: block.isInverted ? finalGap.start : finalGap.stop,
        stop: block.speciesStop, // Should be oriented correctly regardless of inversion since it was taken into account during gapless block creation
        backboneAlignment: { start: finalGap.backboneStop, stop: block.backboneAlignment.stop, },
        type: 'block',
        orientation: block.orientation,
        chainLevel: block.chainLevel,
      });
  
      this.syntenyBlocks.push(blockSyntenicSection);
    }
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
    const allDatatracks = this.datatrackSets.flatMap((set) => set.datatracks);
    // TODO: need to make sure that this properly gives the correct information
    genomicSections = genomicSections.concat(this.syntenyBlocks).concat(this.syntenyGaps).concat(allDatatracks);
    return genomicSections;
  }
}