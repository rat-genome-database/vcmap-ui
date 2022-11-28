import Species from '../models/Species';
import Chromosome from '../models/Chromosome';
import BackboneSection from '@/new_models/BackboneSection';
import SyntenySection from '@/new_models/SyntenySection';
import SyntenyRegion from '@/new_models/SyntenyRegion';
import DatatrackSection from '@/new_models/DatatrackSection';
import SyntenyApi, { SpeciesSyntenyData, SyntenyRequestParams } from '../new_api/SyntenyApi';


/**
 * This function retrieves syntenic data and initiates the processing pipeline to create syntenic regions. 
 * Syntenic regions are comprised of syntenic sections representing blocks and gaps.  
 * 
 * @param comparativeSpecies    list of species to get comparative data for
 * @param backboneChr           backbone chromosome
 * @param backboneStart         backbone start basepair
 * @param backboneStop          backbone stop basepair
 * @param basePairToHeightRatio base pair to height ratio/drawn SVG to basepair ratio
 * @param syntenyThreshold      synteny threshold for querying synteny data NOTE: this could become a range for cached requerying
 * @param startingSVGYPos       starting Y position for drawing SVG (always the same?)
 * @param isComparative         whether or not to draw comparative data NOTE: worth separating into two functions for overview and detailed panel (or datatracks and no datatracks)
 * @returns                     processed syntenic regions for each species
 */
export async function createSyntenicRegionsAndDatatracks(comparativeSpecies: Species[], backboneChr: Chromosome, backboneStart: number, backboneStop: number, basePairToHeightRatio: number, syntenyThreshold: number, startingSVGYPos: number, isComparative: boolean)
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
  }

  const speciesSyntenyDataArray = await SyntenyApi.getSyntenicRegions(syntenyApiParams);

  //Step 2: Pass data to block processing pipeline per species
  if (speciesSyntenyDataArray)
  {
    const syntenicRegions = syntenicSectionBuilder(speciesSyntenyDataArray, backboneStart, backboneStop, basePairToHeightRatio, syntenyThreshold);

    //Step 3: Capture processed data and return to caller for drawing
    return syntenicRegions;
  }
  else
  {
    console.log("No syntenic data returned for species");
    return;
  }
}


/**
 * Builds SyntenySections for blocks and gaps, and initiates processing for genes per block/section
 * 
 * @param speciesSyntenyData       list of species and other informational data
 * @param backboneStart            backbone start basepair       
 * @param backboneStop             backbone stop basepair
 * @param startingSVGYPos          starting Y position for drawing SVG (always the same?)
 * @param basePairToHeightRatio    base pair to height ratio/drawn SVG to basepair ratio
 * @param threshold                synteny threshold (unnecessary?)
 * @returns                        processed syntenic regions for each species
 */
function syntenicSectionBuilder(SyntenyData: SpeciesSyntenyData[], backboneStart: number, backboneStop: number, basePairToHeightRatio: number, threshold: number)
{
  //Step 1: For each species synteny data, create syntenic sections for each block
  const processedSyntenicRegions: SyntenyRegion[] = [];
  for (const speciesSyntenyData of SyntenyData)
  {
    const currSpecies = speciesSyntenyData.speciesName;
    const regionInfo = speciesSyntenyData.regionData;
    const currSyntenicRegion: SyntenyRegion = new SyntenyRegion({species: currSpecies});
    
    //Step 1.1: Create syntenic sections for each block - 1:1 mapping returned from API
    regionInfo.forEach((region) => {
      const blockInfo = region.block;
      const blockLength = blockInfo.stop - blockInfo.start;
      const blockRatio = (blockInfo.backboneStop - blockInfo.backboneStart) / blockLength;
      const blockGaps = region.gaps;
      const blockGenes = region.genes;
      
      //Step 1.2: Record backbone mapping for each block as BackboneSection and store in each section 
      //NOTE: BackboneSection may be drawn or may be used as a data storage method on section models, TBD
      const blockBackboneSection = new BackboneSection({ start: blockInfo.backboneStart, stop: blockInfo.backboneStop, windowStart: backboneStart, windowStop: backboneStop });
      const blockSyntenicSection = new SyntenySection({ start: blockInfo.start, stop: blockInfo.stop, backboneSection: blockBackboneSection, type: 'block' });

      //Step 1.3: Convert SyntenicSection data to SVG values
      //NOTE: These values possibly will be self calculated on model creation

      //Step 1.4: Create BlockLabels for each block

      //Step 2: For each (now processed) block, create syntenic sections for each gap
      const processedGaps: SyntenySection[] = [];
      if (blockGaps)
      {
        //Step 2.1: Create syntenic sections for each gap - 1:1 mapping returned from API

        //Step 2.2: Record threshold level these gaps were returned at

        //Step 2.3 store processed gap data in block
        blockGaps.forEach((gap) => {
          const gapBackboneSection = new BackboneSection({ start: gap.backboneStart, stop: gap.backboneStop, windowStart: backboneStart, windowStop: backboneStop });
          const gapSyntenicSection = new SyntenySection({ start: gap.start, stop: gap.stop, backboneSection: gapBackboneSection, threshold: threshold, type: 'gap' });

          currSyntenicRegion.addSyntenyGap(gapSyntenicSection);
        });
      }
        

      //Step 3: For each (now processed) block, create syntenic sections for each gene
      if (blockGenes)
      {
        //Step 3.1: Pass block data and gene data to gene processing pipeline
        //NOTE: We might want to instead associate block data with gene data, store data in an array, and pass all gene data at once for processing in order to avoid multiple passes of gene data for initial processing and then finding orthologs
        const processedGeneInfo = syntenicDatatrackBuilder(blockGenes, blockInfo);
        //Step 3.2: Capture processed gene data and store in block
        //Step 3.3: Capture returned map of processed genes and add to master map of processed genes
      }

      currSyntenicRegion.addSyntenyBlock(blockSyntenicSection);
    });

    processedSyntenicRegions.push(currSyntenicRegion);
  }

  return processedSyntenicRegions;

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
 * @param blockRatio              ratio of block to backbone
 */
function syntenicDatatrackBuilder(genomicData: Object[], blockInfo: Object)
{
  //Step 1: For each gene, convert to backbone equivalents using blockInfo and blockRatio

  //Step 2: Convert backbone equivalents to SVG equivalents using basePairToHeightRatio and startingSVGYPos

  //Step 3: Create datatrack for each gene

  //Step 4: Create DatatrackLabels for each gene

  //Step 4: Capture gene as processed in a map to return for finding orthologs
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

