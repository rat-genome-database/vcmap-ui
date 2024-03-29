import SyntenySection from './SyntenySection';
import DatatrackSection, { DatatrackSectionType } from './DatatrackSection';
import DatatrackSet from './DatatrackSet';
import { GeneLabel } from './Label';
import { GenomicSectionFactory } from './GenomicSectionFactory';
import { Gap } from "@/models/Block";
import Gene from './Gene';
import { isGenomicDataInViewport } from '@/utils/Shared';
import logger from '@/logger';

//this class is used to store info of interest for synteny regions/associated blocks in the data panel
export interface SyntenyRegionInfo
{
  blockCount?: number
  gapCount?: number; 
  geneCount?: number;
  variantCount?: number;
}

interface SyntenyRegionParams
{
  species: string;
  mapName: string;
  gaplessBlock: SyntenySection;
  genes?: Gene[];
}

//This model is used to store data for a syntenic region off-backbone
export default class SyntenyRegion
{
  // TODO: Can this instead be a reference to our Block model from the synteny tree?
  gaplessBlock: SyntenySection;             // The full block representing this region (no gaps)
  syntenyGaps: SyntenySection[] = [];       // synteny gaps occupying this region
  syntenyBlocks: SyntenySection[] = [];     // synteny blocks occupying this region
  datatrackSets: DatatrackSet[] = [];       // Set of DatatrackSections belonging to this SytenyRegion
  species: string = '';                     // species that this region is from
  mapName: string = '';
  geneDatatrackLabels: GeneLabel[] = [];    // array of Label objects associated with the datatrackSections
  genes: Gene[] = [];                       // All genes associated with this SyntenyRegion (the block that this region represents) -- note: will be empty for overview SyntenyRegions since genes aren't needed

  constructor(params: SyntenyRegionParams)
  {
    this.species = params.species;
    this.mapName = params.mapName;
    this.gaplessBlock = params.gaplessBlock;
    this.genes = params.genes ? params.genes.map(g => g.clone()) : [];
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

  /**
   * Add datatrack sections to this region. If the datatrack sections are genes, the gene labels will be re-processed.
   */
  public addDatatrackSections(datatrackSection: DatatrackSection[], datatrackSetIdx: number, type: DatatrackSectionType)
  {
    this.datatrackSets[datatrackSetIdx] && this.datatrackSets[datatrackSetIdx].datatracks.length > 0 ?
      this.datatrackSets[datatrackSetIdx].addDatatrackSections(datatrackSection) : this.datatrackSets[datatrackSetIdx] = new DatatrackSet(datatrackSection, type);
  }

  // TODO: Wonder if we should move this method back out of this class to a utils file? It might help make each of these
  // SyntenyRegion objects a bit lighter...
  public splitBlockWithGaps(factory: GenomicSectionFactory, gaps: Gap[])
  {
    // Do the following:
    // 1. Filter out any gaps that do not match the chain level of this block
    //   NOTE: This ensures we don't split up level 1 blocks with level 2 gaps, etc... things get weird above level 1.
    //     There can be overlapping gaps and gaps inside of other gaps that would make the logic a bit more complicated.
    //     We'd possibly need to filter out any gaps that are inside of other gaps or combine overlapping gaps into one 
    //     larger gap...
    // 2. Filter out any gaps that are not in the viewport (detailed panel)
    // 3. Sort gaps in order of backbone position
    //   NOTE: This is really important for inverted blocks. The code below is
    //     is written in a way that expects the gaps to go in order of how they 
    //     align against the backbone
    logger.time(`Sort gaps for splitBlockWithGaps`);
    const sortedGaps = [...gaps]
      .filter(g => {
        return g.chainLevel === this.gaplessBlock.chainLevel
          && isGenomicDataInViewport(g, this.gaplessBlock.windowBasePairRange.start, this.gaplessBlock.windowBasePairRange.stop);
      })
      .sort((a, b) => a.backboneStart - b.backboneStart);
    logger.timeEnd(`Sort gaps for splitBlockWithGaps`);

    logger.info(` splitBlockWithGaps: filtered ${gaps.length} down gaps to ${sortedGaps.length}`);

    this.syntenyBlocks = [];
    this.syntenyGaps = [];

    const block = this.gaplessBlock;

    // TODO: Should we start rendering individual gap sections again? Pros/cons?
    const gapsLine = factory.createSyntenySection({
      start: block.speciesStart,
      stop: block.speciesStop,
      backboneAlignment: block.backboneAlignment,
      type: 'gap',
      orientation: '+',
      chainLevel: block.chainLevel,
    });
    this.syntenyGaps.push(gapsLine);

    if (sortedGaps.length === 0)
    {
      // No gaps to split block with...
      this.syntenyBlocks.push(block);
      return;
    }

    let lastGapBackboneStop = 0;
    let lastGapSpeciesStop = 0;
    sortedGaps.forEach((gap, index) => {
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
    const finalGap = sortedGaps[sortedGaps.length - 1];
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
}