import Species from '@/new_models/Species';
import Chromosome from '@/new_models/Chromosome';
import BackboneSection, { RenderType } from '@/new_models/BackboneSection';
import SyntenySection from '@/new_models/SyntenySection';
import SyntenyRegion from '@/new_models/SyntenyRegion';
import DatatrackSection from '@/new_models/DatatrackSection';
import SyntenyApi, { SpeciesSyntenyData, SyntenyRequestParams, SyntenyComponent } from '../new_api/SyntenyApi';
import Gene from '@/new_models/Gene';
import SyntenyRegionSet from '@/new_models/SyntenyRegionSet';


const GENES_DATA_TRACK_THRESHOLD_MULTIPLIER = 5;
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
export async function createSyntenicRegionsAndDatatracks(comparativeSpecies: Species[], backboneChr: Chromosome, backboneStart: number, backboneStop: number, windowStart: number, windowStop: number, syntenyThreshold: number, isComparative: boolean)
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
  if (speciesSyntenyDataArray)
  {
    const syntenicRegions = syntenicSectionBuilder(speciesSyntenyDataArray, windowStart, windowStop, syntenyThreshold, (isComparative) ? 'detailed' : 'overview');
    console.log(speciesSyntenyDataArray);
    //Step 3: Capture processed data and return to caller for drawing
    return syntenicRegions;
  }
  else
  {
    console.log("No syntenic data returned for species");
    return [];
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
function syntenicSectionBuilder(allSyntenyData: SpeciesSyntenyData[], windowStart: number,  windowStop: number, threshold: number, renderType: 'overview' | 'detailed')
{
  //Step 1: For each species synteny data, create syntenic sections for each block
  const syntenyRegionSets: SyntenyRegionSet[] = [];
  allSyntenyData.forEach((speciesSyntenyData, index) => {
    const processedSyntenicRegions: SyntenyRegion[] = [];

    const currSpecies = speciesSyntenyData.speciesName;
    const currMap = speciesSyntenyData.mapName;
    const regionInfo = speciesSyntenyData.regionData;
    
    //Step 1.1: Create syntenic sections for each block - 1:1 mapping returned from API
    regionInfo.forEach((region) => {
      const blockInfo = region.block;
      const blockLength = blockInfo.stop - blockInfo.start;
      const blockRatio = (blockInfo.backboneStop - blockInfo.backboneStart) / blockLength;
      const blockGaps = region.gaps;
      const blockGenes = region.genes;
      

      //Step 1.2: Record backbone mapping for each block as BackboneSection and store in each section 
      //NOTE: BackboneSection may be drawn or may be used as a data storage method on section models, TBD
      const blockBackboneSection = new BackboneSection({
        start: blockInfo.backboneStart, 
        stop: blockInfo.backboneStop, 
        windowStart: windowStart, 
        windowStop: windowStop,
        renderType: renderType,
      });
      const blockSyntenicSection = new SyntenySection({
        start: blockInfo.start, 
        stop: blockInfo.stop, 
        backboneSection: blockBackboneSection, 
        type: 'block', 
        orientation: blockInfo.orientation, 
        chromosome: new Chromosome({chromosome: blockInfo.chromosome, mapKey: blockInfo.mapKey}), 
        chainLevel: blockInfo.chainLevel,
      });

      const currSyntenicRegion = new SyntenyRegion({ species: currSpecies, mapName: currMap, gaplessBlock: blockSyntenicSection });
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
        const processedBlockAndGaps = splitBlockWithGaps(blockSyntenicSection, gaps, threshold, renderType);
        currSyntenicRegion.addSyntenyGaps(processedBlockAndGaps.processedGaps);
        currSyntenicRegion.addSyntenyBlocks(processedBlockAndGaps.processedBlocks);
      }
      else
      {
        //no gaps for this section
        currSyntenicRegion.addSyntenyBlocks([blockSyntenicSection]);
      }
        

      //Step 3: For each (now processed) block, create syntenic sections for each gene
      if (blockGenes && blockGenes.length > 0)
      {
        //Step 3.1: Pass block data and gene data to gene processing pipeline
        //NOTE: We might want to instead associate block data with gene data, store data in an array, and pass all gene data at once for processing in order to avoid multiple passes of gene data for initial processing and then finding orthologs
        const processedGeneInfo = syntenicDatatrackBuilder(blockGenes, blockSyntenicSection, blockRatio, windowStart, windowStop, renderType);
        currSyntenicRegion.addDatatrackSections(processedGeneInfo);
        //Step 3.2: Capture processed gene data and store in block
        //Step 3.3: Capture returned map of processed genes and add to master map of processed genes

      }

      currSyntenicRegion.gaplessBlock = blockSyntenicSection;
      processedSyntenicRegions.push(currSyntenicRegion);
    });

    syntenyRegionSets.push(new SyntenyRegionSet(currSpecies, currMap, processedSyntenicRegions, index + 1, renderType));
  });

  return syntenyRegionSets;

  //Step 4: Pass block, processed genes, list of orthologs, and master map of processed genes to ortholog processing pipeline
    //Step 4.1: Capture returned ortholog lines and store in block (or on gene/datatrack?)

  //Step 5: After all block and datatrack processing is complete, create syntenic regions for each species
}


//NOTE: Generalize away from genes and make more generic
/**
 * Builds DatatrackSections for genomic data passed (such as genes) for a given block
 * 
 * @returns list of DatatrackSections mapped for the given block
 * @param genomicData             genomic data for current block
 * @param blockInfo               info about block (start, stop, etc)
 */
function syntenicDatatrackBuilder(genomicData: SyntenyComponent[] | Gene[], syntenyBlock: SyntenySection, blockRatio: number, windowStart: number, windowStop: number, renderType: RenderType)
{
  //Step 1: For each gene, convert to backbone equivalents using blockInfo and blockRatio
  const processedGenomicData: DatatrackSection[] = [];
  genomicData.forEach((genomicElement: SyntenyComponent | Gene) => {
    //Get backbone equivalents for gene data
    const backboneEquivalents = convertSyntenicDataToBackboneData(genomicElement, syntenyBlock, blockRatio);

    //Create gene backbone section
    const geneBackboneSection = new BackboneSection({ start: backboneEquivalents.backboneStart, stop: backboneEquivalents.backboneStop, windowStart: windowStart, windowStop: windowStop, renderType });

    //Create DatatrackSection for each gene
    const geneDatatrackSection = new DatatrackSection({ start: genomicElement.start, stop: genomicElement.stop, backboneSection: geneBackboneSection, type: 'gene', });
    processedGenomicData.push(geneDatatrackSection);
  });

  processedGenomicData.sort((a, b) => a.speciesStart - b.speciesStart);
  return processedGenomicData;

  //Step 4: Create DatatrackLabels for each gene

  //Step 4: Capture gene as processed in a map to return for finding orthologs
}

function convertSyntenicDataToBackboneData(genomicObject: SyntenyComponent | Gene, blockInfo: SyntenySection, blockRatio: number)
{
  //First calculate the difference between the start of the block and the start of the gene
  const geneStartDiff = genomicObject.start - blockInfo.speciesStart;

  //Convert the difference to backbone equivalents
  const geneStartBackboneDiff = geneStartDiff * blockRatio;
  const geneBackboneStart = blockInfo.backboneSection.start + geneStartBackboneDiff;

  //Calculate height and stop of gene in backbone equivalents
  const geneLength = genomicObject.stop - genomicObject.start;
  const geneBackboneLength = geneLength * blockRatio;
  const geneBackboneStop = geneBackboneStart + geneBackboneLength;

  return { backboneStart: geneBackboneStart, backboneStop: geneBackboneStop, backboneDiff: geneStartBackboneDiff, };
}


function orthologLineBuilder(processedGenes: Object[], orthologs: Object[], masterProcessedGenes: Object[])
{
  //Step 1: For each gene, find corresponding processed gene ortholog in master map

  //Step 2: Create ortholog lines for each processed gene

  //Step 3: Capture ortholog lines and info in processed gene
}

function updateCachedData()
{
  //Step 1: Check if cached data is available

}

/**
 * Splits a raw block into multiple blocks with the given gap data
 * @param block 
 * @param gaps 
 */
function splitBlockWithGaps(block: SyntenySection, gaps: SyntenyComponent[], threshold: number, renderType: RenderType)
{
  let lastProcessedSection: SyntenySection | null = null;
  const processedGaps: SyntenySection[] = [];
  const processedBlocks: SyntenySection[] = [];
  
  gaps.forEach((gap, index) => {
    const blockStart = block.backboneSection.start;
    const gapStart = gap.backboneStart;

    if (index === 0 && (gapStart <= blockStart))
    {
      // Block starts off with a gap
      const gapBackboneSection = new BackboneSection({ start: gap.backboneStart, stop: gap.backboneStop, windowStart: block.backboneSection.windowStart, windowStop: block.backboneSection.windowStop, renderType: renderType });
      const gapSyntenicSection = new SyntenySection({ start: gap.start, stop: gap.stop, backboneSection: gapBackboneSection, threshold: threshold, type: 'gap', chromosome: new Chromosome({chromosome: gap.chromosome, mapKey: gap.mapKey}), chainLevel: gap.chainLevel, });
      processedGaps.push(gapSyntenicSection);

      const blockBackboneSection = new BackboneSection({ start: gap.backboneStop, stop: block.backboneSection.stop, windowStart: block.backboneSection.windowStart, windowStop: block.backboneSection.windowStop, renderType: renderType });
      const blockSyntenicSection = new SyntenySection({ start: gap.stop, stop: block.speciesStart, backboneSection: blockBackboneSection, threshold: threshold, type: 'block', chromosome: new Chromosome({chromosome: block.chromosome.chromosome, mapKey: block.chromosome.mapKey}), chainLevel: gap.chainLevel, });
      processedBlocks.push(blockSyntenicSection);
      lastProcessedSection = blockSyntenicSection;
    }
    else if (index === 0)
    {
      //First gap start not before block start, so create block section and then gap section
      const blockBackboneSection = new BackboneSection({ start: block.backboneSection.start, stop: gap.backboneStart, windowStart: block.backboneSection.windowStart, windowStop: block.backboneSection.windowStop, renderType: renderType });
      const blockSyntenicSection = new SyntenySection({ start: block.speciesStart, stop: gap.start, backboneSection: blockBackboneSection, type: 'block', orientation: block.orientation, chromosome: new Chromosome({chromosome: gap.chromosome, mapKey: gap.mapKey}), chainLevel: block.chainLevel, });

      const gapBackboneSection = new BackboneSection({ start: gap.backboneStart, stop: gap.backboneStop, windowStart: block.backboneSection.windowStart, windowStop: block.backboneSection.windowStop, renderType: renderType });
      const gapSyntenicSection = new SyntenySection({ start: gap.start, stop: gap.stop, backboneSection: gapBackboneSection, threshold: threshold, type: 'gap', chromosome: new Chromosome({chromosome: gap.chromosome, mapKey: gap.mapKey}), chainLevel: gap.chainLevel });

      processedBlocks.push(blockSyntenicSection);
      processedGaps.push(gapSyntenicSection);

      lastProcessedSection = gapSyntenicSection;
    }
    else if (lastProcessedSection && gap.backboneStart >= lastProcessedSection.backboneSection.stop)
    {
      //Next gap start is after last processed section stop, so create block section and then gap section
      const blockBackboneSection = new BackboneSection({ start: lastProcessedSection.backboneSection.stop, stop: gap.backboneStart, windowStart: block.backboneSection.windowStart, windowStop: block.backboneSection.windowStop, renderType: renderType });
      const blockSyntenicSection = new SyntenySection({ start: lastProcessedSection.speciesStop, stop: gap.start, backboneSection: blockBackboneSection, type: 'block', orientation: block.orientation, chromosome: new Chromosome({chromosome: gap.chromosome, mapKey: gap.mapKey}), chainLevel: block.chainLevel, });

      const gapBackboneSection = new BackboneSection({ start: gap.backboneStart, stop: gap.backboneStop, windowStart: block.backboneSection.windowStart, windowStop: block.backboneSection.windowStop, renderType: renderType });
      const gapSyntenicSection = new SyntenySection({ start: gap.start, stop: gap.stop, backboneSection: gapBackboneSection, threshold: threshold, type: 'gap', chromosome: new Chromosome({chromosome: gap.chromosome, mapKey: gap.mapKey}), chainLevel: gap.chainLevel, });

      processedBlocks.push(blockSyntenicSection);
      processedGaps.push(gapSyntenicSection);
      lastProcessedSection = gapSyntenicSection;
    }
    else
    {
      const lastGap = processedGaps[processedGaps.length - 1];

      if (lastGap.backboneSection.stop > gap.backboneStart && lastGap.backboneSection.stop > gap.backboneStop)
      {
        ///current gap is encompassed by last gap
        return;
      }

      const blockBackboneSection = new BackboneSection({ start: lastGap.backboneSection.stop, stop: gap.backboneStart, windowStart: block.backboneSection.windowStart, windowStop: block.backboneSection.windowStop, renderType: renderType });
      const blockSyntenicSection = new SyntenySection({ start: lastGap.speciesStop, stop: gap.start, backboneSection: blockBackboneSection, type: 'block', orientation: block.orientation, chromosome: new Chromosome({chromosome: gap.chromosome, mapKey: gap.mapKey}), chainLevel: block.chainLevel, });

      const gapBackboneSection = new BackboneSection({ start: gap.backboneStart, stop: gap.backboneStop, windowStart: block.backboneSection.windowStart, windowStop: block.backboneSection.windowStop, renderType: renderType });
      const gapSyntenicSection = new SyntenySection({ start: gap.start, stop: gap.stop, backboneSection: gapBackboneSection, threshold: threshold, type: 'gap', chromosome: new Chromosome({chromosome: gap.chromosome, mapKey: gap.mapKey}), chainLevel: gap.chainLevel, });

      processedBlocks.push(blockSyntenicSection);
      processedGaps.push(gapSyntenicSection);
    }
  });

  const finalGap = gaps[gaps.length - 1];
  if (finalGap.backboneStop < block.backboneSection.stop)
  {
    const blockBackboneSection = new BackboneSection({ start: finalGap.backboneStop, stop: block.backboneSection.stop, windowStart: block.backboneSection.windowStart, windowStop: block.backboneSection.windowStop, renderType: renderType });
    const blockSyntenicSection = new SyntenySection({ start: finalGap.stop, stop: block.backboneSection.stop, backboneSection: blockBackboneSection, type: 'block', orientation: block.orientation, chromosome: new Chromosome({chromosome: finalGap.chromosome, mapKey: finalGap.mapKey}), chainLevel: block.chainLevel, });

    processedBlocks.push(blockSyntenicSection);
  }
  
  return { processedGaps: processedGaps, processedBlocks: processedBlocks };
}