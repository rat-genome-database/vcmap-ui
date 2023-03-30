import Species from '@/models/Species';
import Chromosome from '@/models/Chromosome';
import SyntenyRegion from '@/models/SyntenyRegion';
import { LoadedGene, GeneDatatrack } from '@/models/DatatrackSection';
import Gene from '@/models/Gene';
import SyntenyRegionSet from '@/models/SyntenyRegionSet';
import OrthologLine from '@/models/OrthologLine';
import Label from '@/models/Label';
import { GenomicSectionFactory } from '@/models/GenomicSectionFactory';
import Block from "@/models/Block";
import {useLogger} from "vue-logger-plugin";
import { getThreshold } from './Threshold';

// FIXME: I don't think we can use the logger here...
const $log = useLogger();

/**
 * Create the off-backbone visual elements representing the large level 1 synteny
 * blocks.
 * @param syntenyData
 * @param comparativeSpecies
 * @param backboneChr
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
    const currMapName = currSpecies.activeMap.name ?? '';
    for (let blockIdx = 0; blockIdx < blocks.length; blockIdx++)
    {
      const blockInfo = blocks[blockIdx];
      const blockGaps = blockInfo.gaps;
      const blockChrStr = blockInfo.chromosome.chromosome;


      // Create a factory for the creation of our "Regions" (Blocks, Gaps, etc)
      const factory = new GenomicSectionFactory(currSpecies.name, currMapName, blockChrStr,
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
        mapName: currMapName,
        gaplessBlock: gaplessBlockSection,
      });
      // FIXME: Create a single visible block (ignoring gap data)
      currSyntenicRegion.syntenyBlocks.push(gaplessBlockSection);

      processedSyntenicRegions.push(currSyntenicRegion);
    }
    syntenyRegionSets.push(new SyntenyRegionSet(currSpecies.name, currMapName, processedSyntenicRegions, setOrder, 'overview', []));
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
 * @param backboneChr
 *     The backbone chromosome.
 * @param backboneStart
 *     The start of the visible range (in the backbone basepair coordinate scale).
 * @param backboneStop
 *     The stop of the visible range (in the backbone basepair coordinate scale).
 *
 * @returns
 *     The processed SyntenicRegionSets for each species.
 */
export async function createSyntenicRegionSets(syntenyData: Map<number, Block[]>, comparativeSpecies: Species[],
    backboneChr: Chromosome, backboneStart: number, backboneStop: number): Promise<SyntenyRegionSet[]>
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
        $log.error(`Cannot find Species object for mapKey ${mapKey}!!`);
        return;
      }

      const syntenyRegionSet = syntenicSectionBuilder(speciesSyntenyData, species, pos,
          backboneChr, backboneStart, backboneStop, 'detailed');

      console.log(`Completed build of Synteny for ${syntenyRegionSet.mapName}, with ${syntenyRegionSet.regions.length} regions`);

      // Add this to our final Array
      if (syntenyRegionSet) syntenyRegionSets.push(syntenyRegionSet);
      pos++;
    });
  }

  return syntenyRegionSets;
}


/**
 * Builds SyntenySections for blocks and gaps, and initiates processing for genes per block/section
 * 
 * TODO DOCUMENTATION
 * @param renderType
 *   The type of RegionSet to create (overview or detailed).
 * @returns
 *   A RegionSet that displays this Species data for the specified backbone window.
 */
function syntenicSectionBuilder(speciesSyntenyData: Block[], species: Species, setOrder: number,
    backboneChr: Chromosome, viewportStart: number,  viewportStop: number, renderType: 'overview' | 'detailed')
{
  //Step 1: For each species synteny data, create syntenic sections for each block
  const processedSyntenicRegions: SyntenyRegion[] = [];

  const currSpecies = species.name;
  const currMapName = species.activeMap.name;
  const allGeneLabels: Label[] = [];

console.debug(`About to loop over ${speciesSyntenyData.length} Blocks...`);
  // Step 1: Create syntenic sections for each VISIBLE block
  for (let index = 0; index < speciesSyntenyData.length; index++)
  {
    const blockInfo = speciesSyntenyData[index];
    const blockGaps = blockInfo.gaps;
    const blockGenes = blockInfo.genes;
    const blockChrStr = blockInfo.chromosome.chromosome;

    // Create a factory for the creation of our "Regions" (Blocks, Gaps, etc)
    const factory = new GenomicSectionFactory(currSpecies, currMapName, blockChrStr,
        { start: viewportStart, stop: viewportStop }, renderType
    );

    // Create the SyntenySection representing the gapless block
    // Note: It's important to set start/stop based on orientation here as processing
    //   further down the chain relies on it.
    // TODO: this code makes me wonder if we cannot revisit the relationship between:
    //    SyntenyRegion / SyntenySection / GenomicSection
console.time('createSyntenySectionAndRegion');
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
      species: currSpecies,
      mapName: currMapName,
      gaplessBlock: gaplessBlockSection,
    });
    // FIXME: Create a single visible block (ignoring gap data)
    currSyntenicRegion.syntenyBlocks.push(gaplessBlockSection);
console.timeEnd('createSyntenySectionAndRegion');

    // Step 2: Split the gapless Block into multiple GenomicSections based on gaps.
    //   Only do this for the region of the
// console.time("splitBlockWithGaps");
    // FIXME: Handle Gaps w/o precalculated backbone coordinates
    //currSyntenicRegion.splitBlockWithGaps(factory, blockGaps);
// console.timeEnd("splitBlockWithGaps");


    // Step 3: For each (now processed) block, create a SyntenySection for each gene
    if (blockGenes && blockGenes.length > 0 && gaplessBlockSection.chainLevel == 1)
    {
      // Filter all genes to only those that are visible
console.time("  filterVisibleGenes");
      const visibleGenes = blockGenes.filter((gene) => {
        if (!gene.backboneStart || !gene.backboneStop) return false;

        return (gene.backboneStart <= viewportStop 
          && gene.backboneStop >= viewportStart
          // Skip any genes that are deemed too small for rendering
          && Math.abs(gene.backboneStop - gene.backboneStart) >= getThreshold(viewportStop - viewportStart));
      });
console.timeEnd("  filterVisibleGenes");

// console.debug("Step 3: Create Syntenic Sections for each gene")
      // Step 3.1: Pass block data and gene data to gene processing pipeline
      // NOTE: We might want to instead associate block data with gene data, store data in an array, and pass all gene
      //   data at once for processing in order to avoid multiple passes of gene data for initial processing and then finding orthologs
let timerLabel = `  syntenicDataTrackBuilder(${visibleGenes.length})`;
console.time(timerLabel);
      // const processedGeneInfo = {genomicData: [], orthologLines: [], geneIds: []};
// console.log('Visible Gene list: ', visibleGenes);
      const processedGeneInfo = syntenicDatatrackBuilder(factory, visibleGenes, currSyntenicRegion);
// FIXME: I have a theory that the "Gene" object used to create the GeneDataTrack may be too heavy and not need references
//   for things like the Block it is owned by. Would like to explore this next potentially...
console.timeEnd(timerLabel);

      // Get the index for the gene data track set, otherwise default to 0
timerLabel = `  addDatatrackSections(${processedGeneInfo.length})`;
console.time(timerLabel);
      let geneTrackIdx = currSyntenicRegion.datatrackSets.findIndex((set) => set.type === 'gene');
      geneTrackIdx = geneTrackIdx === -1 ? 0 : geneTrackIdx;
      currSyntenicRegion.addDatatrackSections(processedGeneInfo, geneTrackIdx, 'gene');
console.timeEnd(timerLabel);
// console.time("  addOrthologLines");
      // FIXME: currSyntenicRegion.addOrthologLines(processedGeneInfo.orthologLines);
// console.timeEnd("  addOrthologLines");
      // FIXME (Unneeded?): currSyntenicRegion.geneIds = processedGeneInfo.geneIds;

      currSyntenicRegion.datatrackLabels = [];
console.time("  geneDataLabels");
      for (let i = 0; i < processedGeneInfo.length; i++)
      {
        const geneData = processedGeneInfo[i];
        if (geneData.label)
        {
          allGeneLabels.push(geneData.label);
        }
      }
console.timeEnd("  geneDataLabels");
    }

    processedSyntenicRegions.push(currSyntenicRegion);
  }

  // Finished creating this Set:
console.time("createSyntenyRegionSet");
  const regionSet = new SyntenyRegionSet(currSpecies, currMapName, processedSyntenicRegions, setOrder, renderType, allGeneLabels);
console.timeEnd("createSyntenyRegionSet");
  return regionSet;
}


//NOTE: Generalize away from genes and make more generic
/**
 * Builds DatatrackSections for genomic data passed (such as genes) for a given block.
 *
 * TODO: DOCUMENTATION
 *
 * @returns
 *   List of DatatrackSections mapped for the given block.
 */
function syntenicDatatrackBuilder(factory: GenomicSectionFactory, genomicData: Gene[], syntenyRegion: SyntenyRegion)
{
  // For each gene, build a GeneDatatrackSection element
  const processedGenomicData: GeneDatatrack[] = [];

let createStart = 0, pushStart = 0, createTotal = 0.0, pushTotal = 0.0;

  for (let idx = 0, len = genomicData.length; idx < len; idx++) {
    // Get backbone equivalents for gene data, or skip
    const genomicElement: Gene = genomicData[idx];
    if (genomicElement.backboneStart === null || genomicElement.backboneStop === null)
    {
      $log.error(`Genomic Element ${genomicElement.symbol} sent to render without a backbone alignment`);
      continue;
    }

createStart = performance.now();
    // Create DatatrackSection for each gene (account for inversion in start/stops)
    const geneDatatrackSection = factory.createGeneDatatrackSection({
      gene: genomicElement,
      start: (syntenyRegion.gaplessBlock.isInverted) ? genomicElement.stop : genomicElement.start,
      stop: (syntenyRegion.gaplessBlock.isInverted) ? genomicElement.start : genomicElement.stop,
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

console.debug(`    Create total: ${createTotal}`);
console.debug(`    Push total: ${pushTotal}`);

  // TODO: We might need to save all genes on the SyntenyRegion so that they can later be used when processing gene labels...
  //       (see how backbone gene labels are processed)

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
 * TODO: DOCUMENTATION
 * @param masterProcessedGenes
 * @param processedSpecies
 * @param currGene
 */
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