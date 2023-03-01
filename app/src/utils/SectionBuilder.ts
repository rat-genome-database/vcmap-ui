import Species from '@/models/Species';
import Chromosome from '@/models/Chromosome';
import SyntenySection from '@/models/SyntenySection';
import SyntenyRegion from '@/models/SyntenyRegion';
import { LoadedGene, GeneDatatrack } from '@/models/DatatrackSection';
import SyntenyApi, { SpeciesSyntenyData, SyntenyRegionData, SyntenyRequestParams, SyntenyComponent } from '@/api/SyntenyApi';
import Gene from '@/models/Gene';
import SyntenyRegionSet from '@/models/SyntenyRegionSet';
import OrthologLine from '@/models/OrthologLine';
import Label from '@/models/Label';
import { GenomicSectionFactory } from '@/models/GenomicSectionFactory';
import { BackboneAlignment } from '@/models/GenomicSection';

export interface LoadedBlock
{
  [speciesName:string]: { [chromosome: string]: [SyntenySection] }
}

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
export async function createSyntenicRegionsAndDatatracks(comparativeSpecies: Species[], backboneChr: Chromosome, backboneStart: number, backboneStop: number, windowStart: number, windowStop: number, syntenyThreshold: number, isComparative: boolean, masterBlockMap: Map<number, LoadedBlock>, masterGeneMap?: Map<number, LoadedGene>, updateCache?: boolean)
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
        updateCache ?? false
      );

      if (syntenyRegionSet)
      {
        syntenyRegionSets.push(syntenyRegionSet);
      }
    });

    //Step 3: Capture processed data and return to caller for drawing
    if (updateCache)
    {
      return {
        syntenyRegionSets: syntenyRegionSets,
        gapData: speciesSyntenyDataArray, 
        masterGeneMap: masterGeneMap,
        masterBlockMap: masterBlockMap,
      };
    }
    else
    {
      return {
        syntenyRegionSets: syntenyRegionSets, 
        masterGeneMap: masterGeneMap,
        masterBlockMap: masterBlockMap,
      };
    }
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
export function syntenicSectionBuilder(speciesSyntenyData: SpeciesSyntenyData, windowStart: number,  windowStop: number, threshold: number, renderType: 'overview' | 'detailed', setOrder: number, masterBlockMap: Map<number, LoadedBlock>, masterGeneMap?: Map<number, LoadedGene>, updateCache?: boolean)
{
  //Step 1: For each species synteny data, create syntenic sections for each block
  const processedSyntenicRegions: SyntenyRegion[] = [];

  const currSpecies = speciesSyntenyData.speciesName;
  const currMap = speciesSyntenyData.mapName;
  // Only process level 1 and level 2 blocks
  const regionInfo = speciesSyntenyData.regionData.filter(r => r.block.chainLevel === 1 || r.block.chainLevel === 2);
  const allGeneLabels: Label[] = [];
  
  //Step 1.1: Create syntenic sections for each block - 1:1 mapping returned from API
  for (let index = 0; index < regionInfo.length; index++)
  {
    const region: SyntenyRegionData = regionInfo[index];
    const blockInfo = region.block;
    const blockGaps = region.gaps;
    const blockGenes = region.genes;
    const blockChromosome = blockInfo.chromosome;

    // Create all syntenic and datatrack sections with same species, chromosome, visible window range, etc
    const factory = new GenomicSectionFactory(
      currSpecies, 
      currMap, 
      blockChromosome, 
      { start: windowStart, stop: windowStop }, 
      renderType
    );

    // Create gapless block
    // Note: It's important to set start/stop based on orientation here as processing further down the chain relies on it
    const gaplessSyntenyBlock = factory.createSyntenySection({
      start: (blockInfo.orientation === '-') ? blockInfo.stop : blockInfo.start, 
      stop: (blockInfo.orientation === '-') ? blockInfo.start : blockInfo.stop,
      backboneAlignment: { start: blockInfo.backboneStart, stop: blockInfo.backboneStop },
      type: 'block',
      orientation: blockInfo.orientation,
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
        continue;
      }
    }
    //no blocks for this bp position, add it
    else if (masterBlockMap)
    {
      masterBlockMap.set(gaplessSyntenyBlock.speciesStart, gaplessBlockObject);
    }

    const currSyntenicRegion = new SyntenyRegion({
      species: currSpecies, 
      mapName: currMap, 
      gaplessBlock: gaplessSyntenyBlock,
    });

    // Step 2: Split up the gapless blocks with their gaps
    currSyntenicRegion.splitBlockWithGaps(factory, blockGaps, threshold);
      

    //Step 3: For each (now processed) block, create syntenic sections for each gene
    if (blockGenes && blockGenes.length > 0 && gaplessSyntenyBlock.chainLevel == 1 && masterGeneMap != null)
    {
      //Step 3.1: Pass block data and gene data to gene processing pipeline
      //NOTE: We might want to instead associate block data with gene data, store data in an array, and pass all gene data at once for processing in order to avoid multiple passes of gene data for initial processing and then finding orthologs
      const processedGeneInfo = syntenicDatatrackBuilder(factory, blockGenes, currSyntenicRegion, true, masterGeneMap);
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
    }
    
    processedSyntenicRegions.push(currSyntenicRegion);

    if (updateCache)
    {
      regionInfo.splice(index, 1);
      index--;
    }
  }

  const syntenyRegionSet = new SyntenyRegionSet(
    processedSyntenicRegions, 
    setOrder, 
    renderType, 
    speciesSyntenyData,
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
function syntenicDatatrackBuilder(factory: GenomicSectionFactory, genomicData: Gene[], syntenyRegion: SyntenyRegion, isGene: boolean, masterGeneMap: Map<number, LoadedGene>)
{
  //Step 1: For each gene, convert to backbone equivalents using blockInfo and blockRatio
  const processedGenomicData: GeneDatatrack[] = [];
  const processedGeneIds: number[] = [];
  const processedOrthologs: OrthologLine[] = [];

  if (isGene)
  {
    genomicData.forEach((genomicElement: Gene) => {
      //Get backbone equivalents for gene data
      const geneBackboneAlignment = convertSyntenicDataToBackboneData(genomicElement, syntenyRegion);
      const currSpecies = genomicElement.speciesName.toLowerCase();

      //Create DatatrackSection for each gene (account for inversion in start/stops)
      const geneDatatrackSection = factory.createGeneDatatrackSection({
        gene: genomicElement, 
        start: (syntenyRegion.gaplessBlock.isInverted) ? genomicElement.stop : genomicElement.start,
        stop: (syntenyRegion.gaplessBlock.isInverted) ? genomicElement.start : genomicElement.stop,
        backboneAlignment: geneBackboneAlignment,
      });

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
  else
  {
    console.error('Unable to process unknown datatrack type');
  }

  processedGenomicData.sort((a, b) => a.speciesStart - b.speciesStart);
  return { genomicData: processedGenomicData, masterGeneMap: masterGeneMap, orthologLines: processedOrthologs, geneIds: processedGeneIds };

  //Step 4: Capture gene as processed in a map to return for finding ortholog
}

function convertSyntenicDataToBackboneData(genomicObject: SyntenyComponent | Gene, syntenyRegion: SyntenyRegion): BackboneAlignment
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
    backboneStart = startingSection.backboneAlignment.start + startBackboneDiff;
  }
  else
  {
    // Default to top of first section
    backboneStart = syntenySections[0].backboneAlignment.start;
  }

  if (endingSection)
  {
    const geneStopDiff = isInverted ? geneStop - endingSection.speciesStop : endingSection.speciesStop - geneStop;
    const stopBackboneDiff = Math.max(geneStopDiff, 0) * endingSection.blockRatio;
    backboneStop = endingSection.backboneAlignment.stop - stopBackboneDiff;
  }
  else
  {
    // Default to end of last section
    backboneStop = syntenySections[syntenySections.length - 1].backboneAlignment.stop;
  }

  return {
    start: backboneStart,
    stop: backboneStop,
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