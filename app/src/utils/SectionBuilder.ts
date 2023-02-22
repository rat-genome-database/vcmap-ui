import Species from '@/models/Species';
import Chromosome from '@/models/Chromosome';
import BackboneSection, { RenderType } from '@/models/BackboneSection';
import SyntenySection from '@/models/SyntenySection';
import SyntenyRegion from '@/models/SyntenyRegion';
import { LoadedGene, GeneDatatrack } from '@/models/DatatrackSection';
import SyntenyApi, { SpeciesSyntenyData, SyntenyRequestParams, SyntenyComponent } from '@/api/SyntenyApi';
import Gene from '@/models/Gene';
import SyntenyRegionSet from '@/models/SyntenyRegionSet';
import OrthologLine from '@/models/OrthologLine';
import Label from '@/models/Label';

export interface LoadedBlock
{
  [speciesName:string]: { [chromosome: string]: [SyntenySection] }
}

const GAPS_THRESHOLD_MULTIPLIER = 10;

/**
 * This function retrieves syntenic data and initiates the processing pipeline to create syntenic regions. 
 * Syntenic regions are comprised of syntenic sections representing blocks and gaps.  
 * 
 * @param comparativeSpecies    list of species to get comparative data for
 * @param backboneChr           backbone chromosome
 * @param backboneStart         backbone start basepair
 * @param backboneStop          backbone stop basepair
 * @param windowStart           window start basepair
 * @param windowStop            window stop basepair
 * @param syntenyThreshold      synteny threshold for querying synteny data NOTE: this could become a range for cached requerying
 * @param isComparative         whether or not to draw comparative data NOTE: worth separating into two functions for overview and detailed panel (or datatracks and no datatracks)
 * @returns                     processed syntenic regions for each species
 */
export async function createSyntenicRegionsAndDatatracks(comparativeSpecies: Species[], backboneChr: Chromosome, backboneStart: number, backboneStop: number, windowStart: number, windowStop: number, syntenyThreshold: number, isComparative: boolean, masterBlockMap: Map<number, LoadedBlock>, masterGeneMap?: Map<number, LoadedGene>)
{
  //Step 1: Get syntenic data for each species
  const syntenyApiParams: SyntenyRequestParams = {
    backboneChromosome: backboneChr,
    start: backboneStart,
    stop: backboneStop,
    optional: {
      threshold: syntenyThreshold,
    },
    comparativeSpecies: comparativeSpecies,
  };

  if (isComparative)
  {
    // For detailed panel, get genes...
    syntenyApiParams.optional.includeGenes = true;
    syntenyApiParams.optional.includeOrthologs = true;
  }

  const speciesSyntenyDataArray = await SyntenyApi.getSyntenicRegions(syntenyApiParams);

  //Step 2: Pass data to block processing pipeline per species
  if (speciesSyntenyDataArray && speciesSyntenyDataArray.length > 0)
  {
    const syntenyRegionSets: SyntenyRegionSet[] = [];
    speciesSyntenyDataArray.forEach((speciesSyntenyData, index) => {
      const syntenyRegionSet = syntenicSectionBuilder(
        speciesSyntenyData, 
        windowStart, 
        windowStop, 
        syntenyThreshold, 
        (isComparative) ? 'detailed' : 'overview',
        index + 1,
        masterBlockMap,
        masterGeneMap,
      );
      syntenyRegionSets.push(syntenyRegionSet);
    });

    //Step 3: Capture processed data and return to caller for drawing
    return {
      syntenyRegionSets: syntenyRegionSets, 
      masterGeneMap: masterGeneMap,
      masterBlockMap: masterBlockMap,
    };
  }
  else
  {
    console.log("No syntenic data returned for species");
    return {
      syntenyRegionSets: ([] as SyntenyRegionSet[]),
      masterGeneMap: new Map<number, LoadedGene>(),
      masterBlockMap: new Map<number, LoadedBlock>(),
    };
  }
}


/**
 * Builds SyntenySections for blocks and gaps, and initiates processing for genes per block/section
 * 
 * @param allSyntenyData           list of species and other informational data
 * @param windowStart              backbone start basepair       
 * @param windowStop               backbone stop basepair
 * @param threshold                synteny threshold (unnecessary?)
 * @param renderType               overview or detailed
 * @returns                        processed syntenic regions for each species
 */
export function syntenicSectionBuilder(speciesSyntenyData: SpeciesSyntenyData, windowStart: number,  windowStop: number, threshold: number, renderType: 'overview' | 'detailed', setOrder: number, masterBlockMap: Map<number, LoadedBlock>, masterGeneMap?: Map<number, LoadedGene>, )
{
  //Step 1: For each species synteny data, create syntenic sections for each block
  const processedSyntenicRegions: SyntenyRegion[] = [];

  const currSpecies = speciesSyntenyData.speciesName;
  const currMap = speciesSyntenyData.mapName;
  // Only process level 1 and level 2 blocks
  const regionInfo = speciesSyntenyData.regionData.filter(r => r.block.chainLevel === 1 || r.block.chainLevel === 2);
  const allGeneLabels: Label[] = [];
  
  //Step 1.1: Create syntenic sections for each block - 1:1 mapping returned from API
  regionInfo.forEach((region) => {
    const blockInfo = region.block;
    const blockGaps = region.gaps;
    const blockGenes = region.genes;
    const blockChromosome = blockInfo.chromosome;
    

    //Step 1.2: Record backbone mapping for each block as BackboneSection and store in each section 
    //NOTE: BackboneSection may be drawn or may be used as a data storage method on section models, TBD
    const blockBackboneSection = new BackboneSection({
      start: blockInfo.backboneStart, 
      stop: blockInfo.backboneStop, 
      windowStart: windowStart, 
      windowStop: windowStop,
      speciesName: currSpecies,
      renderType: renderType,
    });

    // Create gapless block
    // Note: It's important to set start/stop based on orientation here as processing further down the chain relies on it
    const gaplessSyntenyBlock = new SyntenySection({
      start: (blockInfo.orientation === '-') ? blockInfo.stop : blockInfo.start, 
      stop: (blockInfo.orientation === '-') ? blockInfo.start : blockInfo.stop,
      backboneSection: blockBackboneSection, 
      type: 'block', 
      orientation: blockInfo.orientation, 
      chromosome: new Chromosome({chromosome: blockInfo.chromosome, mapKey: blockInfo.mapKey}), 
      chainLevel: blockInfo.chainLevel,
      isGapless: true,
    });

    const gaplessBlockObject: LoadedBlock = { [currSpecies]: { [blockChromosome]: [gaplessSyntenyBlock] } };

    //already have blocks for this bp position, check further to see if its a new block or a duplicate
    if (masterBlockMap && masterBlockMap.has(gaplessSyntenyBlock.speciesStart))
    {
      const oldBlock = masterBlockMap.get(gaplessSyntenyBlock.speciesStart);

      //if the block is already in the map, check to see if its a duplicate
      if (oldBlock && oldBlock[currSpecies] && oldBlock[currSpecies][blockChromosome])
      {
        const isNewBlock = checkIfNewBlock(gaplessSyntenyBlock, oldBlock[currSpecies][blockChromosome]);
        if (isNewBlock)
        {
          //add the new block to the map
          oldBlock[currSpecies][blockChromosome].push(gaplessSyntenyBlock);
        }
        else
        {
          //block already processed/loaded, skip this loop of processing
          return;
        }
      }
    }
    //no blocks for this bp position, add it
    else if (masterBlockMap)
    {
      masterBlockMap.set(gaplessSyntenyBlock.speciesStart, gaplessBlockObject);
    }

    const currSyntenicRegion = new SyntenyRegion({ species: currSpecies, mapName: currMap, gaplessBlock: gaplessSyntenyBlock });
    //Step 1.3: Convert SyntenicSection data to SVG values
    //NOTE: These values possibly will be self calculated on model creation

    //Step 1.4: Create BlockLabels for each block

    //filter gap sizes to only include gaps that are larger than the threshold
    const gaps = blockGaps.filter(g => { 
      return (g.stop - g.start) >= (threshold * GAPS_THRESHOLD_MULTIPLIER) && g.chainLevel === blockInfo.chainLevel; 
    });
    //Step 2: For each (now processed) block, create syntenic sections for each gap
    if (gaps.length > 0)
    {
      //Step 2.1: Create syntenic sections for each gap - 1:1 mapping returned from API

      //Step 2.2: Record threshold level these gaps were returned at

      //Step 2.3 store processed gap data in block
      const processedBlockAndGaps = splitBlockWithGaps(gaplessSyntenyBlock, gaps, threshold, renderType);
      currSyntenicRegion.addSyntenyGaps(processedBlockAndGaps.processedGaps);
      currSyntenicRegion.addSyntenyBlocks(processedBlockAndGaps.processedBlocks);
    }
    else
    {
      //no gaps for this section
      currSyntenicRegion.addSyntenyBlocks([gaplessSyntenyBlock]);
    }
      

    //Step 3: For each (now processed) block, create syntenic sections for each gene
    if (blockGenes && blockGenes.length > 0 && gaplessSyntenyBlock.chainLevel == 1 && masterGeneMap != null)
    {
      //Step 3.1: Pass block data and gene data to gene processing pipeline
      //NOTE: We might want to instead associate block data with gene data, store data in an array, and pass all gene data at once for processing in order to avoid multiple passes of gene data for initial processing and then finding orthologs
      const processedGeneInfo = syntenicDatatrackBuilder(blockGenes, currSyntenicRegion, windowStart, windowStop, true, renderType, masterGeneMap);
      currSyntenicRegion.addDatatrackSections(processedGeneInfo.genomicData);
      currSyntenicRegion.addOrthologLines(processedGeneInfo.orthologLines);
      currSyntenicRegion.geneIds = processedGeneInfo.geneIds;

      currSyntenicRegion.datatrackLabels = [];
      for (let i = 0; i < processedGeneInfo.genomicData.length; i++)
      {
        const geneData = processedGeneInfo.genomicData[i];
        if (geneData.label)
        {
          allGeneLabels.push(geneData.label);
        }
      }

      /* if(region.block.backboneStart == 68121445)
      {
        console.log('GENES', processedGeneInfo);
      } */
      
      //Step 3.2: Capture processed gene data and store in block
      //Step 3.3: Capture returned map of processed genes and add to master map of processed genes
    }

    currSyntenicRegion.gaplessBlock = gaplessSyntenyBlock;
    
    processedSyntenicRegions.push(currSyntenicRegion);
  });

  const syntenyRegionSet = new SyntenyRegionSet(
    currSpecies, 
    currMap, 
    processedSyntenicRegions, 
    setOrder, 
    renderType, 
    speciesSyntenyData, 
    threshold, 
    allGeneLabels
  );
  
  return syntenyRegionSet;
}


//NOTE: Generalize away from genes and make more generic
/**
 * Builds DatatrackSections for genomic data passed (such as genes) for a given block
 * 
 * @returns list of DatatrackSections mapped for the given block
 * @param genomicData             genomic data for current block
 * @param blockInfo               info about block (start, stop, etc)
 */
function syntenicDatatrackBuilder(genomicData: Gene[], syntenyRegion: SyntenyRegion, windowStart: number, windowStop: number, isGene: boolean, renderType: RenderType, masterGeneMap: Map<number, LoadedGene>)
{
  //Step 1: For each gene, convert to backbone equivalents using blockInfo and blockRatio
  const processedGenomicData: GeneDatatrack[] = [];
  const processedGeneIds: number[] = [];
  const processedOrthologs: OrthologLine[] = [];
  if (isGene)
  {
    genomicData.forEach((genomicElement: Gene) => {
      //Get backbone equivalents for gene data
      const backboneEquivalents = convertSyntenicDataToBackboneData(genomicElement, syntenyRegion);
      const currSpecies = genomicElement.speciesName.toLowerCase();

      //Create gene backbone section
      const geneBackboneSection = new BackboneSection({
        start: backboneEquivalents.backboneStart, 
        stop: backboneEquivalents.backboneStop, 
        windowStart: windowStart, 
        windowStop: windowStop, 
        renderType, 
        speciesName: currSpecies,
      });
      
      //Create DatatrackSection for each gene (account for inversion in start/stops)
      const geneDatatrackSection = new GeneDatatrack(
        {
          start: syntenyRegion.gaplessBlock.isInverted ? genomicElement.stop : genomicElement.start,
          stop: syntenyRegion.gaplessBlock.isInverted ? genomicElement.start : genomicElement.stop,
          backboneSection: geneBackboneSection,
        }, 
        genomicElement
      );

      if (!processedGeneIds.includes(genomicElement.rgdId))
      {
        processedGeneIds.push(genomicElement.rgdId);
      }
      const loadedGene = masterGeneMap.get(genomicElement.rgdId);
      if (loadedGene)
      {
        if (loadedGene.genes[currSpecies])
        {
          /* let newGeneFlag = true;
          loadedGene.genes[currSpecies].forEach((gene: GeneDatatrack) => 
          {
            if (gene.backboneSection.start == geneDatatrackSection.backboneSection.start)
            {
              newGeneFlag = false;
            }
          });

          if (newGeneFlag)
          {
            loadedGene.genes[currSpecies].push(geneDatatrackSection);
          } */
          return;
        }
        else
        {
          loadedGene.genes[currSpecies] = [geneDatatrackSection];
        }
      }
      else
      {
        masterGeneMap.set(genomicElement.rgdId, {
          genes: {
            [currSpecies]: [geneDatatrackSection]
          }
        });
      }

      const geneOrthologs = genomicElement.orthologs;
      if (geneOrthologs && geneOrthologs.length > 0)
      {
        const orthologLines: OrthologLine[] = orthologLineBuilder(masterGeneMap, currSpecies, geneDatatrackSection);
        
        if (orthologLines)
        {
          orthologLines.forEach((orthologLine: OrthologLine) => {
            processedOrthologs.push(orthologLine);
          });
        }
      }
      processedGenomicData.push(geneDatatrackSection);
    });
  }

  processedGenomicData.sort((a, b) => a.speciesStart - b.speciesStart);
  return { genomicData: processedGenomicData, masterGeneMap: masterGeneMap, orthologLines: processedOrthologs, geneIds: processedGeneIds };

  //Step 4: Capture gene as processed in a map to return for finding ortholog
}

function convertSyntenicDataToBackboneData(genomicObject: SyntenyComponent | Gene, syntenyRegion: SyntenyRegion)
{
  const syntenySections = syntenyRegion.sortedSyntenicBlocksAndGaps;
  const isInverted = syntenyRegion.gaplessBlock.isInverted;

  // Orient gene start/stop based on synteny block orientation
  const geneStart = syntenyRegion.gaplessBlock.isInverted ? genomicObject.stop : genomicObject.start;
  const geneStop = syntenyRegion.gaplessBlock.isInverted ? genomicObject.start : genomicObject.stop;

  // Find which block this gene starts in and determine a starting backbone position based on that block's "backbone bp/block bp" ratio
  let startingSection: SyntenySection | null = null;
  let endingSection: SyntenySection | null = null;
  for (let i = 0; i < syntenySections.length; i++)
  {
    if (startingSection && endingSection)
    {
      break;
    }

    if (isInverted)
    {
      if (geneStart <= syntenySections[i].speciesStart && geneStart >= syntenySections[i].speciesStop)
      {
        startingSection = syntenySections[i];
      }

      // The ending section is when the gene stop
      if (geneStop <= syntenySections[i].speciesStart && geneStop >= syntenySections[i].speciesStop)
      {
        endingSection = syntenySections[i];
      }
    }
    else
    {
      if (geneStart >= syntenySections[i].speciesStart && geneStart <= syntenySections[i].speciesStop)
      {
        startingSection = syntenySections[i];
      }

      if (geneStop >= syntenySections[i].speciesStart && geneStop <= syntenySections[i].speciesStop)
      {
        endingSection = syntenySections[i];
      }
    }
  }

  let backboneStart;
  let backboneStop;

  if (startingSection)
  {
    const geneStartDiff = isInverted ? startingSection.speciesStart - geneStart : geneStart - startingSection.speciesStart;
    const startBackboneDiff = Math.max(geneStartDiff, 0) * startingSection.blockRatio;
    backboneStart = startingSection.backboneSection.start + startBackboneDiff;
  }
  else
  {
    // Default to top of first section
    backboneStart = syntenySections[0].backboneSection.start;
  }

  if (endingSection)
  {
    const geneStopDiff = isInverted ? geneStop - endingSection.speciesStop : endingSection.speciesStop - geneStop;
    const stopBackboneDiff = Math.max(geneStopDiff, 0) * endingSection.blockRatio;
    backboneStop = endingSection.backboneSection.stop - stopBackboneDiff;
  }
  else
  {
    // Default to end of last section
    backboneStop = syntenySections[syntenySections.length - 1].backboneSection.stop;
  }

  return {
    backboneStart,
    backboneStop,
  };
}


function orthologLineBuilder(masterProcessedGenes: Map<number, LoadedGene>, processedSpecies: string, currGene: GeneDatatrack)
{
  const orthologLines: OrthologLine[] = [];
  currGene.gene.orthologs.forEach((rgdId: number) => {
    const loadedGene = masterProcessedGenes.get(rgdId);
    if (loadedGene && loadedGene.backboneOrtholog != null)
    {
      const orthologLine = new OrthologLine({
        backboneGene: loadedGene.backboneOrtholog, 
        comparativeGene: currGene,
      });
      orthologLines.push(orthologLine);
    }
  });

  return orthologLines;
}

/**
 * Splits a raw block into multiple blocks with the given gap data
 * @param block 
 * @param gaps 
 */
function splitBlockWithGaps(block: SyntenySection, gaps: SyntenyComponent[], threshold: number, renderType: RenderType)
{
  const processedGaps: SyntenySection[] = [];
  const processedBlocks: SyntenySection[] = [];
  const chromosome = block.chromosome;
  const windowStart = block.backboneSection.windowStart; // The start bp of the corresponding backbone section in the visible window
  const windowStop = block.backboneSection.windowStop; // The stop bp of the corresponding backbone section in the visible window
  const gapsLine = new SyntenySection({
    start: block.speciesStart,
    stop: block.speciesStop,
    backboneSection: block.backboneSection,
    threshold: threshold,
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

      if (lastGap.backboneStop > gap.backboneStart && lastGap.backboneStop > gap.backboneStop)
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
  if (finalGap.backboneStop < block.backboneSection.stop)
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

  return { processedGaps: processedGaps, processedBlocks: processedBlocks };
}


function checkIfNewBlock(block: SyntenySection, blocks: SyntenySection[])
{
  let isNewBlock = true;
  blocks.forEach((loadedBlock: SyntenySection) => {
    if (loadedBlock.backboneSection.start == block.backboneSection.start && loadedBlock.backboneSection.stop == block.backboneSection.stop)
    {
      isNewBlock = false;
      return;
    }
  });

  return isNewBlock;
}