import Species from '@/models/Species';
import Chromosome from '@/models/Chromosome';
import SyntenyRegion from '@/models/SyntenyRegion';
import { GeneDatatrack } from '@/models/DatatrackSection';
import Gene from '@/models/Gene';
import SyntenyRegionSet from '@/models/SyntenyRegionSet';
import { GenomicSectionFactory } from '@/models/GenomicSectionFactory';
import Block from "@/models/Block";
import { RenderType } from '@/models/GenomicSection';
import { Orientation } from '@/models/SyntenySection';
import { getThreshold } from './Shared';
import { createVariantDatatracks } from './VariantBuilder';
import logger from '@/logger';

/**
 * Create the off-backbone visual elements representing the large level 1 synteny
 * blocks.
 * 
 * @param syntenyData
 *   The reactive ref to the Main prop that stores our comparative genomic data
 *     we will use to build the off-backbone representations.
 * @param comparativeSpecies
 *   List of the comparative species, in the order we want the Datatracks created.
 * @param backboneChr
 *   The backbone chromosome.
 * 
 * @returns
 *   SyntenyRegionSets representing the off-backbone synteny data in the overview panel
 */
export async function createOverviewSyntenicRegionSets(syntenyData: Map<number, Block[]>, comparativeSpecies: Species[],
    backboneChr: Chromosome): Promise<SyntenyRegionSet[]>
{
  const syntenyRegionSets: SyntenyRegionSet[] = [];

  // TODO: This code is extremely similar to building synteny blocks WITH datatracks, need to reorganize this...
  let setOrder = 1;
  syntenyData.forEach((blocks, mapKey) => {
    const currSpecies = comparativeSpecies.find((compSpecies) => compSpecies.activeMap.key == mapKey);
    if (!currSpecies) return;

    const processedSyntenicRegions: SyntenyRegion[] = [];
    for (let blockIdx = 0; blockIdx < blocks.length; blockIdx++)
    {
      const blockInfo = blocks[blockIdx];
      //const blockGaps = blockInfo.gaps;
      const blockChrStr = blockInfo.chromosome.chromosome;


      // Create a factory for the creation of our "Regions" (Blocks, Gaps, etc)
      const factory = new GenomicSectionFactory(currSpecies.name, currSpecies.activeMap.name, blockChrStr,
        {start: 0, stop: backboneChr.seqLength}, 'overview'
      );

      // Create the SyntenySection representing the gapless block
      // Note: It's important to set start/stop based on orientation here as processing
      //   further down the chain relies on it.
      // TODO: this code makes me wonder if we cannot revisit the relationship between:
      //    SyntenyRegion / SyntenySection / GenomicSection
      const gaplessBlockSection = factory.createSyntenySection({
        start: (blockInfo.orientation === '-') ? blockInfo.stop : blockInfo.start,
        stop: (blockInfo.orientation === '-') ? blockInfo.start : blockInfo.stop,
        backboneAlignment: {start: blockInfo.backboneStart, stop: blockInfo.backboneStop},
        type: 'block',
        orientation: blockInfo.orientation,
        chainLevel: blockInfo.chainLevel,
        isGapless: true,
      });
      // Create the SyntenyRegion that covers the extent of the Block
      // NOTE: This might extend beyond the visible window, but we will try to only create
      //   any "gappy" GenomicSection blocks within the visible range to minimize DOM nodes
      //   that will ultimately be added to the DOM via the SVG.
      const currSyntenicRegion = new SyntenyRegion({
        species: currSpecies.name,
        mapName: currSpecies.activeMap.name,
        gaplessBlock: gaplessBlockSection,
      });
      // FIXME: Create a single visible block (ignoring gap data)
      currSyntenicRegion.syntenyBlocks.push(gaplessBlockSection);

      processedSyntenicRegions.push(currSyntenicRegion);
    }
    syntenyRegionSets.push(new SyntenyRegionSet(currSpecies.name, currSpecies.activeMap, processedSyntenicRegions, setOrder, 'overview'));
    setOrder++;
  });

  return syntenyRegionSets;
}

/**
 * This function uses our Synteny Data to create the DetailedPanel view of a region on
 * the Backbone chromosome. This traverses our data given the specified window of visible
 * basepairs on the Backbone, and creates a "SyntenicRegionSet" for each "Species".
 * 
 * @param syntenyData
 *     The reactive ref to the Main prop that stores our comparative genomic data
 *     we will use to build the off-backbone representations.
 * @param comparativeSpecies
 *     List of the comparative species, in the order we want the Datatracks created.
 * @param backboneStart
 *     The start of the visible range (in the backbone basepair coordinate scale).
 * @param backboneStop
 *     The stop of the visible range (in the backbone basepair coordinate scale).
 *
 * @returns
 *     The processed SyntenicRegionSets for each species.
 */
export async function createSyntenicRegionSets(syntenyData: Map<number, Block[]>, comparativeSpecies: Species[],
  backboneStart: number, backboneStop: number): Promise<SyntenyRegionSet[]>
{
  const syntenyRegionSets: SyntenyRegionSet[] = [];

  // Process each species of our synteny Tree separately
  if (syntenyData && syntenyData.size > 0)
  {
    let pos = 1;
    syntenyData.forEach((speciesSyntenyData, mapKey) => {
      // NOTE: In the future we are going to have to address how we will allow the
      //   possibility of a Species with >1 "active" map. For example, loading multiple
      //   assemblies for one Species to allow comparing assembly differences...
      const species = comparativeSpecies.find((species) => { return species.activeMap.key == mapKey; });
      if (!species)
      {
        logger.error(`Cannot find Species object for mapKey ${mapKey}!!`);
        return;
      }

      const syntenyRegionSet = syntenicSectionBuilder(speciesSyntenyData, species, pos,
          backboneStart, backboneStop, 'detailed');

      logger.log(`Completed build of Synteny for ${syntenyRegionSet?.mapName}, with ${syntenyRegionSet?.regions.length} regions`);

      // Add this to our final Array
      if (syntenyRegionSet) syntenyRegionSets.push(syntenyRegionSet);
      pos++;
    });
  }

  return syntenyRegionSets;
}


/**
 * Builds SyntenyRegions made up of SyntenySections (blocks/gaps) and DatatrackSections (genes, etc)
 * 
 * @param speciesSyntenyData
 *   An array of synteny Blocks belonging to a particular species
 * @param species
 *   The comparative Species model
 * @param setOrder
 *   The position that this list of SyntenyRegions will hold in the panel (1 is first SyntenyRegionSet, 2 is the 2nd, etc)
 * @param viewportStart
 *   The backbone start position of the viewport (otherwise known as the overview or detailed panel)
 * @param viewportStop
 *   The backbone stop position of the viewport (otherwise known as the overview or detailed panel)
 * @param renderType
 *   The type of RegionSet to create (overview or detailed).
 * @returns
 *   The renderable version of speciesSyntenyData represented as an array of type SyntenyRegion[]
 */
function syntenicSectionBuilder(speciesSyntenyData: Block[], species: Species, setOrder: number,
    viewportStart: number,  viewportStop: number, renderType: RenderType)
{
  const processedSyntenicRegions: SyntenyRegion[] = [];

  const currSpecies = species;
  const processVariantDensity = speciesSyntenyData.some((block) => block.variantPositions && block.variantPositions.positions.length > 0);
  let regionMaxCount = 0;
  let regionBinSize = 0;
  // const allGeneLabels: Label[] = [];

logger.debug(`About to loop over ${speciesSyntenyData.length} Blocks...`);
  // Step 1: Create syntenic sections for each VISIBLE block
  for (let index = 0; index < speciesSyntenyData.length; index++)
  {
    const blockInfo = speciesSyntenyData[index];
    const blockGaps = blockInfo.gaps;
    const blockGenes = blockInfo.genes;
    const blockChrStr = blockInfo.chromosome.chromosome;
    const blockVariantPositions = blockInfo.variantPositions;

    // Create a factory for the creation of our "Regions" (Blocks, Gaps, etc)
    const factory = new GenomicSectionFactory(currSpecies.name, currSpecies.activeMap.name, blockChrStr,
        { start: viewportStart, stop: viewportStop }, renderType
    );

    // Create the SyntenySection representing the gapless block
    // Note: It's important to set start/stop based on orientation here as processing
    //   further down the chain relies on it.
    // TODO: this code makes me wonder if we cannot revisit the relationship between:
    //    SyntenyRegion / SyntenySection / GenomicSection
logger.time('createSyntenySectionAndRegion');
    const gaplessBlockSection = factory.createSyntenySection({
      start: (blockInfo.orientation === '-') ? blockInfo.stop : blockInfo.start,
      stop: (blockInfo.orientation === '-') ? blockInfo.start : blockInfo.stop,
      backboneAlignment: { start: blockInfo.backboneStart, stop: blockInfo.backboneStop },
      type: 'block',
      orientation: blockInfo.orientation,
      chainLevel: blockInfo.chainLevel,
      isGapless: true,
    });
    // Create the SyntenyRegion that covers the extent of the Block
    // NOTE: This might extend beyond the visible window, but we will try to only create
    //   any "gappy" GenomicSection blocks within the visible range to minimize DOM nodes
    //   that will ultimately be added to the DOM via the SVG.
    const currSyntenicRegion = new SyntenyRegion({
      species: currSpecies.name,
      mapName: currSpecies.activeMap.name,
      gaplessBlock: gaplessBlockSection,
      genes: blockGenes,
    });
logger.timeEnd('createSyntenySectionAndRegion');

    // Step 2: Split the gapless Block into multiple GenomicSections based on gaps.
logger.time("splitBlockWithGaps");
    logger.log(`Splitting block w/ ${blockGaps.length} gaps`);
    currSyntenicRegion.splitBlockWithGaps(factory, blockGaps);
logger.timeEnd("splitBlockWithGaps");

    // Check if there are variants and build those data tracks
    if (blockVariantPositions && processVariantDensity)
    {
      const variantDatatracks = createVariantDatatracks(factory, blockVariantPositions.positions,
        blockInfo.start, blockInfo.stop, blockInfo.backboneStart, blockInfo.backboneStop, blockInfo.isBlockInverted(), blockInfo);
      currSyntenicRegion.addDatatrackSections(variantDatatracks.datatracks, 0, 'variant');
      regionBinSize = variantDatatracks.binSize;
      if (variantDatatracks.maxCount > regionMaxCount)
      {
        regionMaxCount = variantDatatracks.maxCount;
      }
    }

    // Step 3: For each (now processed) block, create a SyntenySection for each gene
    if (blockGenes && blockGenes.length > 0)
    {
      // Filter all genes to only those that are visible
logger.time("  filterVisibleGenes");
      const visibleGenes = blockGenes.filter((gene) => {
        if (!gene.backboneStart || !gene.backboneStop) return false;

        return (gene.backboneStart <= viewportStop 
          && gene.backboneStop >= viewportStart
          // Skip any genes that are deemed too small for rendering
          && Math.abs(gene.backboneStop - gene.backboneStart) >= getThreshold(viewportStop - viewportStart));
      });
logger.timeEnd("  filterVisibleGenes");

// logger.debug("Step 3: Create Syntenic Sections for each gene")
      // Step 3.1: Pass block data and gene data to gene processing pipeline
      // NOTE: We might want to instead associate block data with gene data, store data in an array, and pass all gene
      //   data at once for processing in order to avoid multiple passes of gene data for initial processing and then finding orthologs
let timerLabel = `  syntenicDataTrackBuilder(${visibleGenes.length})`;
logger.time(timerLabel);
      // const processedGeneInfo = {genomicData: [], orthologLines: [], geneIds: []};
// logger.log('Visible Gene list: ', visibleGenes);
      const processedGeneInfo = syntenicDatatrackBuilder(factory, visibleGenes, blockInfo.orientation);
// FIXME: I have a theory that the "Gene" object used to create the GeneDataTrack may be too heavy and not need references
//   for things like the Block it is owned by. Would like to explore this next potentially...
logger.timeEnd(timerLabel);

      // Get the index for the gene data track set, otherwise default to 0
timerLabel = `  addDatatrackSections(${processedGeneInfo.length})`;
logger.time(timerLabel);
      // let geneTrackIdx = currSyntenicRegion.datatrackSets.findIndex((set) => set.type === 'gene');
      // geneTrackIdx = geneTrackIdx === -1 ? 0 : geneTrackIdx;
      // currSyntenicRegion.addDatatrackSections(processedGeneInfo, geneTrackIdx, 'gene');

      // Add gene datatrack sections (this will always be the last datatrack set)
      const idx = currSyntenicRegion.datatrackSets.length;
      currSyntenicRegion.addDatatrackSections(processedGeneInfo, idx, 'gene');
logger.timeEnd(timerLabel);
     } else {
      // Add empty gene datatrack section so every region as one
      const idx = currSyntenicRegion.datatrackSets.length;
      currSyntenicRegion.addDatatrackSections([], idx, 'gene');
     }

    processedSyntenicRegions.push(currSyntenicRegion);
  }

  // Adjust variant datatrack colors now that all are processed
  if (processVariantDensity && regionMaxCount > 0)
  {
    for (let i = 0; i < processedSyntenicRegions.length; i++)
    {
      const variantIdx = processedSyntenicRegions[i].datatrackSets.findIndex((set) => set.type === 'variant');
      if (variantIdx !== -1)
      {
        processedSyntenicRegions[i].datatrackSets[variantIdx].datatracks.forEach((track: any) =>{
            track.setSectionColor(regionMaxCount);
        });
      }
    }
  }

  // Finished creating this Set:
logger.time("createSyntenyRegionSet");
  const regionSet = new SyntenyRegionSet(currSpecies.name, currSpecies.activeMap, processedSyntenicRegions, setOrder, renderType);
  regionSet.maxVariantCount = regionMaxCount;
  regionSet.variantBinSize = regionBinSize;
logger.timeEnd("createSyntenyRegionSet");
  return regionSet;
}


// TODO: Generalize away from genes and make more generic (can we build sections for both genes and variants using this method?)
/**
 * Builds DatatrackSections for genomic data passed (such as genes) for a given block.
 *
 * @param factory
 *   GenomicSectionFactory to be used for generating the DatatrackSections
 * @param genomicData
 *   Array of Genes that will be converted to DatatrackSections
 * @param orientation
 *   Orientation of the block that the gene belongs to
 *
 * @returns
 *   List of DatatrackSections mapped for the given block.
 */
function syntenicDatatrackBuilder(factory: GenomicSectionFactory, genomicData: Gene[], orientation: Orientation)
{
  // For each gene, build a GeneDatatrackSection element
  const processedGenomicData: GeneDatatrack[] = [];

let createStart = 0, pushStart = 0, createTotal = 0.0, pushTotal = 0.0;

  for (let idx = 0, len = genomicData.length; idx < len; idx++) {
    // Get backbone equivalents for gene data, or skip
    const genomicElement: Gene = genomicData[idx];
    if (genomicElement.backboneStart === null || genomicElement.backboneStop === null)
    {
      logger.error(`Genomic Element ${genomicElement.symbol} sent to render without a backbone alignment`);
      continue;
    }

createStart = performance.now();
    // Create DatatrackSection for each gene (account for inversion in start/stops)
    const geneDatatrackSection = factory.createGeneDatatrackSection({
      gene: genomicElement,
      start: (orientation === '-') ? genomicElement.stop : genomicElement.start,
      stop: (orientation === '-') ? genomicElement.start : genomicElement.stop,
      backboneAlignment: {
        start: genomicElement.backboneStart,
        stop: genomicElement.backboneStop
      }
    });
createTotal += (performance.now() - createStart);

pushStart = performance.now();
    processedGenomicData.push(geneDatatrackSection);
pushTotal += (performance.now() - pushStart);
  }

logger.debug(`    Create total: ${createTotal}`);
logger.debug(`    Push total: ${pushTotal}`);

  return processedGenomicData;
}

/**
 * TODO: Documentation
 */
// function convertSyntenicDataToBackboneData(genomicObject: SyntenyComponent | Gene, syntenyRegion: SyntenyRegion): BackboneAlignment
// {
//   const syntenySections = syntenyRegion.sortedSyntenicBlocksAndGaps;
//   const isInverted = syntenyRegion.gaplessBlock.isInverted;
//
//   // Orient gene start/stop based on synteny block orientation
//   const geneStart = syntenyRegion.gaplessBlock.isInverted ? genomicObject.stop : genomicObject.start;
//   const geneStop = syntenyRegion.gaplessBlock.isInverted ? genomicObject.start : genomicObject.stop;
//
//   // Find which block this gene starts in and determine a starting backbone position based on that block's "backbone bp/block bp" ratio
//   let startingSection: SyntenySection | null = null;
//   let endingSection: SyntenySection | null = null;
//   for (let i = 0; i < syntenySections.length; i++)
//   {
//     if (startingSection && endingSection)
//     {
//       break;
//     }
//
//     if (isInverted)
//     {
//       if (geneStart <= syntenySections[i].speciesStart && geneStart >= syntenySections[i].speciesStop)
//       {
//         startingSection = syntenySections[i];
//       }
//
//       // The ending section is when the gene stop
//       if (geneStop <= syntenySections[i].speciesStart && geneStop >= syntenySections[i].speciesStop)
//       {
//         endingSection = syntenySections[i];
//       }
//     }
//     else
//     {
//       if (geneStart >= syntenySections[i].speciesStart && geneStart <= syntenySections[i].speciesStop)
//       {
//         startingSection = syntenySections[i];
//       }
//
//       if (geneStop >= syntenySections[i].speciesStart && geneStop <= syntenySections[i].speciesStop)
//       {
//         endingSection = syntenySections[i];
//       }
//     }
//   }
//
//   let backboneStart;
//   let backboneStop;
//
//   if (startingSection)
//   {
//     const geneStartDiff = isInverted ? startingSection.speciesStart - geneStart : geneStart - startingSection.speciesStart;
//     const startBackboneDiff = Math.max(geneStartDiff, 0) * startingSection.blockRatio;
//     backboneStart = startingSection.backboneAlignment.start + startBackboneDiff;
//   }
//   else
//   {
//     // Default to top of first section
//     backboneStart = syntenySections[0].backboneAlignment.start;
//   }
//
//   if (endingSection)
//   {
//     const geneStopDiff = isInverted ? geneStop - endingSection.speciesStop : endingSection.speciesStop - geneStop;
//     const stopBackboneDiff = Math.max(geneStopDiff, 0) * endingSection.blockRatio;
//     backboneStop = endingSection.backboneAlignment.stop - stopBackboneDiff;
//   }
//   else
//   {
//     // Default to end of last section
//     backboneStop = syntenySections[syntenySections.length - 1].backboneAlignment.stop;
//   }
//
//   return {
//     start: backboneStart,
//     stop: backboneStop,
//   };
// }

/**
 * TODO: Remove if no longer needed for reference
 */
// function orthologLineBuilder(masterProcessedGenes: Map<number, LoadedGene>, processedSpecies: string, currGene: GeneDatatrack)
// {
//   const orthologLines: OrthologLine[] = [];
//   currGene.gene.orthologs.forEach((rgdId: number) => {
//     const loadedGene = masterProcessedGenes.get(rgdId);
//     if (loadedGene && loadedGene.backboneOrtholog != null)
//     {
//       const orthologLine = new OrthologLine({
//         backboneGene: loadedGene.backboneOrtholog, 
//         comparativeGene: currGene,
//       });
//       orthologLines.push(orthologLine);
//     }
//   });

//   return orthologLines;
// }