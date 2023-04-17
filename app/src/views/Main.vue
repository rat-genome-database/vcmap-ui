<template>
  <HeaderPanel />
  <!-- <Button
    label="INSPECT (Main)"
    @click="onInspectPressed"
  /> -->
  <!--
  <Button
    class="p-button-info"
    label="Load Backbone Variants"
    @click="loadBackboneVariants"
  />
  <Button
    class="p-button-info"
    label="Load Synteny Variants"
    @click="loadSyntenyVariants"
  />
  -->
  <div class="grid">
    <div class="col-9">
      <SVGViewbox
        :geneList="geneList"
        :synteny-tree="syntenyTree"
        :orthologs="orthologs"
        :loading="isLoading"
        :variant-positions-list="variantPositionsList"
      />
      <Toast />
    </div>
    <div class="col-3">
      <SelectedDataPanel :selected-data="store.state.selectedData" :gene-list="geneList" :orthologs="orthologs"/>
    </div>
  </div>
  <VCMapDialog 
    v-model:show="showDialog" 
    :header="dialogHeader" 
    :message="dialogMessage"
    :theme="dialogTheme"
    :show-back-button="showDialogBackButton"
    :on-confirm-callback="onProceedWithErrors"
  />
</template>

<script lang="ts" setup>
import SVGViewbox from '@/components/SVGViewbox.vue';
import HeaderPanel from '@/components/HeaderPanel.vue';
import SelectedDataPanel from '@/components/SelectedDataPanel.vue';
import { useStore } from 'vuex';
import { key } from '@/store';
import {nextTick, onMounted, ref, watch} from 'vue';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import Gene from "@/models/Gene";
import Block, { Gap, GenomicPosition } from "@/models/Block";
import SyntenyApi, {SpeciesSyntenyData} from "@/api/SyntenyApi";
import Chromosome from "@/models/Chromosome";
import GeneApi from "@/api/GeneApi";
import {useLogger} from "vue-logger-plugin";
import BackboneSelection from "@/models/BackboneSelection";
import VCMapDialog from '@/components/VCMapDialog.vue';
import useDialog from '@/composables/useDialog';
import { adjustSelectionWindow } from '@/utils/DataPanelHelpers';
import { backboneOverviewError, missingComparativeSpeciesError, noRegionLengthError, noSyntenyFoundError } from '@/utils/VCMapErrors';
import { isGenomicDataInViewport, getThreshold } from '@/utils/Shared';
import { OrthologPair } from '@/models/OrthologLine';
import { isOrthologLineInView } from '@/utils/OrthologHandler';
import { buildVariantPositions } from '@/utils/VariantBuilder';
import VariantPositions from '@/models/VariantPositions';

// TODO: Can we figure out a better way to handle blocks with a high chainlevel?
const MAX_CHAINLEVEL = 2;
const MAX_CHAINLEVEL_GENES = 1;

const store = useStore(key);
const $log = useLogger();
const toast = useToast();

const { showDialog, dialogHeader, dialogMessage, showDialogBackButton, dialogTheme, onError } = useDialog();

const isLoading = ref(false);
const proceedAfterError = ref(false);

// Our synteny tree keyed by MapId
// TODO: Consider adding a map for mapKey -> Species
// TODO: Where to keep the backbone? Always index == 0?? (confusing)
// TODO: Combined with above, we could create a structure that has these properties
const syntenyTree = ref(new Map<number, Block[]>());


// Our gene list keyed by rgdId
// TODO: Need to prefix this list with species to ensure no collisions across different assemblies
const geneList = ref(new Map<number, Gene>());
// NOTE: Switch to a shallow ref to see the genelist size get out of sync on the child components
//   despite the inspect button showing the correct Map in the console. This is the classic loss
//   of reactivity, which we should be okay with since this data will only be used internally
//   (never for on screen objects that need to stay in sync with this data). Those objects that
//   need to stay in sync with the data will mostly be created / removed / updated immediately
//   following a change in viewport position (which we will be reactive to, using the store).
//   They will need to know about these objects in main -- but this will already be updated
//   because we will process all of this data AFTER every API call, but BEFORE a viewport change
//   is committed to the store.
//
//   In theory, we could use triggerRef when we are ready too, but I cannot seem to get that to
//   work the way I expect (only updates the template for Main, not SelectedDataPanel)
// const geneList = shallowRef(new Map<number, Gene>());

// Our list of variantPositions that have been loaded/generated
const variantPositionsList = ref<VariantPositions[]>([]);

const orthologs = ref<OrthologPair[]>([]);

// TODO TEMP
// TODO: temp ignore here, should remove once this method is actively being used
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const onInspectPressed = () => {
  console.debug('Gene List:', geneList);
  console.debug('Synteny Tree:', syntenyTree);
  // NOTE: I cannot seem to get this to force child updates when using a shallowRef???
  //triggerRef(geneList);

  console.debug('Selected Data:', store.state.selectedData);

  // Specific analysis (Mcur1): Compare selectedData after commit to data from this.geneList
  // SelectedData[]
  // store.state.selectedData?.forEach((selectedData) => {
  //   let gene = (selectedData.genomicSection as Gene);
  //   console.log('Gene data (selectedData):', gene.symbol, gene.rgdId, gene.chromosome, gene.block);
  // });
  //
  // // this.geneList
  // geneList.value.forEach((gene) => {
  //   if (gene.symbol == 'Mcur1')
  //     console.log('Gene data (geneList):', gene.symbol, gene.rgdId, gene.chromosome, gene.block);
  // });
};
// TODO endTEMP

/**
 * Main watches this hook for the appropriate time to query the API and construct our
 * memory models representing the Comparative Map Configuration. If Main is getting
 * mounted, it is safe to clear out our old data structures
 * (Lifecycle hook)
 */
onMounted(initVCMapProcessing);

/**
 * Watch for requested navigation operations (zoom in/out, navigate up/down stream).
 */
watch(() => store.state.detailedBasePairRequest, async () => {
  isLoading.value = true;
  // Grab blocks and genes with using a threshold of approximately .25 of a pixel
  if (store.state.detailedBasePairRequest && store.state.chromosome && store.state.species)
  {
    $log.debug(`Detailed Base Pair range change request detected (${store.state.detailedBasePairRequest?.start},
       ${store.state.detailedBasePairRequest?.stop}).`);

    await queryAndProcessSyntenyForBasePairRange(store.state.chromosome, store.state.detailedBasePairRequest.start, store.state.detailedBasePairRequest.stop, store.state.species.activeMap.key);

    triggerDetailedPanelProcessing(store.state.chromosome, store.state.detailedBasePairRequest.start, store.state.detailedBasePairRequest.stop);
    // Data processing done, ready to complete request
    store.dispatch('setDetailedBasePairRequest', null);
  }
  else if (store.state.chromosome == null || store.state.species == null)
  {
    $log.error(`DetailedBasePairRequest: Missing data required for querying and processing synteny`, store.state.chromosome, store.state.species);
  }
  isLoading.value = false;
});

/**
 * Start all processing based on the user's configuration.
 * 
 * + Query for synteny and genes
 * + Create memory models for our comparative maps
 * + Handle any errors that may come up
 * + Trigger the conversion of our memory models into their renderable representations (handled by SVGViewbox.vue)
 */
async function initVCMapProcessing()
{
  isLoading.value = true;

  $log.debug('Creating memory models for our Comparative Map view');
  store.dispatch('setConfigurationLoaded', false);

  // Clear out old structures
  // TODO: Ensure circular references are not going to cause memory leaks
  syntenyTree.value = new Map();
  geneList.value = new Map();

  // Check for required data
  if (checkForConfigurationErrors())
  {
    isLoading.value = false;
    return;
  }

  if (!store.state.chromosome || !store.state.species)
  {
    // Shouldn't get to this point since these values are checked in `checkForConfigurationErrors()`, just checking for null here to satisfy the type checking
    isLoading.value = false;
    return;
  }

  // Query the Genes API

  const slowAPI = setTimeout(() => {
    showToast('warn', 'Loading Impact', 'API is taking a while to respond, please be patient', 5000);
  }, 15000);

  let comparativeSpeciesIds: number[] = [];
  store.state.comparativeSpecies.map(species => comparativeSpeciesIds.push(species.defaultMapKey));
  const backboneGenes: Gene[] = await GeneApi.getGenesByRegion(
      store.state.chromosome.chromosome,
      0, store.state.chromosome.seqLength,
      store.state.species.activeMap.key, store.state.species.name,
      comparativeSpeciesIds);

  // Process response
  // TODO: Should we add a "Block" for the backbone first?
  backboneGenes.forEach((geneData) => {
    geneList.value.set(geneData.rgdId, geneData);
  });

  // Preload off-backbone large blocks and genes
  let threshold = getThreshold(store.state.chromosome.seqLength);
  const speciesSyntenyDataArray = await SyntenyApi.getSyntenicRegions({
    backboneChromosome: store.state.chromosome,
    start: 0,
    stop: store.state.chromosome.seqLength,
    optional: {
      includeGenes: true,
      includeOrthologs: true,
      threshold: threshold,
    },
    comparativeSpecies: store.state.comparativeSpecies,
  });

  if (speciesSyntenyDataArray == undefined)
  {
    $log.error('SpeciesSyntenyDataArray is undefined after querying for syntenic regions');
    isLoading.value = false;
    clearTimeout(slowAPI);
    return;
  }

  if (!proceedAfterError.value && someSyntenyResultsAreMissing(speciesSyntenyDataArray))
  {
    isLoading.value = false;
    clearTimeout(slowAPI);
    return;
  }

  clearTimeout(slowAPI);
  
  //TODO: Add message for variant impact on processing time
  const slowProcessing = setTimeout(() => {
    let message = '';
    if (store.state.comparativeSpecies.length > 2)
      message = 'Currently processing data, please be patient. Longer times may be due to the large number of species in the selected region';
    else
      message = 'Currently processing data, please be patient. Longer times may be due due to the large number of genes in the selected region';

    showToast('warn', 'Loading Impact', message, 5000);
  }, 3000);

  processSynteny(speciesSyntenyDataArray, 0, store.state.chromosome.seqLength, store.state.species.activeMap.key);

  //
  // Adjust the selected start and stop based on our configuration mode (load by gene vs load by position)
  let selectionStart = 0;
  let selectionStop = store.state.chromosome.seqLength;
  if (store.getters.isLoadByGene && store.state.gene != null)
  {
    // Load By Gene
    const loadedGene = store.state.gene;
    const newWindow = adjustSelectionWindow(loadedGene, geneList.value, store);

    selectionStart = newWindow.start;
    selectionStop = newWindow.stop;
  }
  else if (store.getters.isLoadByPosition && store.state.startPos != null && store.state.stopPos != null)
  {
    //
    // Load By Position
    selectionStart = Math.max(0, store.state.startPos);
    selectionStop = Math.min(store.state.stopPos, store.state.chromosome.seqLength);
  }

  // If the selection range is different than the entire chromosome, re-query for the detailed panel
  if (selectionStart !== 0 || selectionStop !== store.state.chromosome.seqLength)
  {
    // Query synteny at threshold determined by selected base pair range (for detailed panel)
    await queryAndProcessSyntenyForBasePairRange(store.state.chromosome, selectionStart, selectionStop, store.state.species.activeMap.key);
  }

  // Kick off the OverviewPanel load
  store.dispatch('setConfigurationLoaded', true);
  // Kick off DetailedPanel load
  triggerDetailedPanelProcessing(store.state.chromosome, selectionStart, selectionStop);

  clearTimeout(slowProcessing);
  isLoading.value = false;
}

/**
 * Process a synteny block response (with genes, gaps, and orthologs) from the API.
 * TODO: We might need to control the number of chainLevel >= 2 we add, these are excessive...
 */
function processSynteny(speciesSyntenyDataArray : SpeciesSyntenyData[] | undefined, backboneStart: number, backboneStop: number, backboneMapKey: number)
{
  // Make sure we have something to do
  if (!speciesSyntenyDataArray)
  {
    $log.debug('Process Synteny called without an array of SpeciesSyntenyData (check API response)');
    return;
  }
  if (!store.state.chromosome)
  {
    $log.error('Process Synteny called without a Chromosome on the state');
    return;
  }

  let tree: Map<number, Block[]> = syntenyTree.value;
  let backboneChr = store.state.chromosome; // TODO: This is proxied, not sure why? Also not sure it matters...
  $log.debug(`Processing ${speciesSyntenyDataArray.length} species of Synteny Data...`);

  //
  // For each off-backbone species in our response, loop the region data
  // NOTE: DO NOT use .forEach() loops in this processing. The size of the speciesSyntenyDataArray
  //   is significant and should not be subject to code that potentially might clone data or create
  //   extra structures.
  for (let speciesIdx = 0; speciesIdx < speciesSyntenyDataArray.length; speciesIdx++) {
    // Check if we need to create a new structure for this mapKey (species)
    if (!tree.has(speciesSyntenyDataArray[speciesIdx].mapKey)) tree.set(speciesSyntenyDataArray[speciesIdx].mapKey, []);
    let knownSpeciesBlocks = tree.get(speciesSyntenyDataArray[speciesIdx].mapKey) ?? [];

    // For each region (block), compare to *all* our existing structures
    // NOTE: If we can afford to do it, might make sense to change our SyntenyApi to build
    //   our block structure, so we can more quickly identify new data and add to our tree.
    $log.debug(`  Processing ${speciesSyntenyDataArray[speciesIdx].regionData.length} blocks of Synteny Data...`);
    for (let blockIdx = 0, len = speciesSyntenyDataArray[speciesIdx].regionData.length; blockIdx < len; blockIdx++) {
      const blockData = speciesSyntenyDataArray[speciesIdx].regionData[blockIdx];
      $log.debug(`  Processing block with ${blockData.gaps.length} gaps, and ${blockData.genes.length} genes...`);
      // NOTE: We cannot process everything...
      //   Skip any blocks with chainLevel > MAX_CHAINLEVEL, and any
      //   blocks outside the range [backboneStart, backboneStop].
      if (blockData.block.chainLevel > MAX_CHAINLEVEL) continue;
      // TODO: See if we can get Marek to just not even send these!
      if (blockData.block.backboneStart > backboneStop || blockData.block.backboneStop < backboneStart) continue;

      let targetBlock: Block | null = null;

      let blockSearch = knownSpeciesBlocks.filter((b) => {
        // NOTE: we consider two blocks the same if the "chainLevel", "backboneStart", and "backboneStop" are identical
        //   There are potentially situations where start & stop are identical but this duplicated off-backbone
        //   syntenic region appears in multiple different places on the same backbone.
        // TODO: In these cases we need to handle our gene references differently (by grabbing from
        //  our existing dataset instead of using the new objects from the SyntenyApi)
        return (b.chainLevel == blockData.block.chainLevel &&
            b.backboneStart == blockData.block.backboneStart && b.backboneStop == blockData.block.backboneStop);
      });

      let existingBlockGapCountChanged = false;
      if (blockSearch.length == 0)
      {
        // Create a newly discovered block
        $log.debug(`Found new Synteny block for ${speciesSyntenyDataArray[speciesIdx].speciesName} (chr ${blockData.block.chromosome})`);
        let newBlock = new Block({
          backbone: backboneChr,
          chromosome: new Chromosome({mapKey: blockData.block.mapKey, chromosome: blockData.block.chromosome}),
          chainLevel: blockData.block.chainLevel,
          orientation: blockData.block.orientation,
          backboneStart: blockData.block.backboneStart,
          backboneStop: blockData.block.backboneStop,
          start: blockData.block.start,
          stop: blockData.block.stop,
        });

        console.time("AddGapsNewBlock");
        // Gaps (add ALL)
        newBlock.addGaps(blockData.gaps, backboneStart, backboneStop);
        console.timeEnd("AddGapsNewBlock");

        knownSpeciesBlocks.push(newBlock);
        targetBlock = newBlock;
      }
      else if (blockSearch.length == 1)
      {
        // Use an existing block
        // Keep the reference to this block from our tree
        targetBlock = blockSearch[0];
        existingBlockGapCountChanged = (targetBlock.gaps.length !== blockData.gaps.length);

        const timerLabel = `AddGapsExistingBlock(${targetBlock.gaps.length}, ${blockData.gaps.length})`;
        console.time(timerLabel);
        targetBlock?.addGaps(blockData.gaps, backboneStart, backboneStop);
        console.timeEnd(timerLabel);
      }
      else
      {
        // Shouldn't ever happen (TODO: warn the user)
        $log.error('OH NO! Discovered duplicate blocks in our tree!');
      }

      if (blockData.block.chainLevel > MAX_CHAINLEVEL_GENES)
      {
        // Skip saving any genes that are above our defined max chainlevel for genes
        console.log(`Skipping ${blockData.genes.length} genes due to chain level filter`);
        continue;
      }

      // Handle genes (we need to inspect all of them even in the case of a new block)
      console.time(`ProcessGenesForBlock`);
      for (let geneIdx = 0, numGenes = blockData.genes.length; geneIdx < numGenes; geneIdx++) {
        // Use any existing genes if we have already loaded one
        const geneData = blockData.genes[geneIdx];
        let gene = geneList.value.get(geneData.rgdId) ?? geneData;
        // NOTE: It is possible for a gene from a new block to exist on another block
        //   This situation comes up often when there are small blocks that a representing
        //   a region of a chromosome that is already part of a larger block we have loaded.
        //   In that case, we consider want to consider the larger block the "primary" block.
        // TODO: This code is assuming the largest block is loaded first, but that is not
        //   going to always be the case. However, it should work for most situations and
        //   is a reasonable initial implementation.
        if (gene.block === null && targetBlock)
        {
          // New gene
          // TODO: Not the best conditional here. A very large targetBlock that is just barely inside
          //  the viewport will return "true" and cause us to do some more intensive processing on gene
          //  positions than perhaps we should. See if we can get a bit more precise here...
          isGenomicDataInViewport(targetBlock, backboneStart, backboneStop)
            ? processAlignmentsOfGeneInsideOfViewport(gene, targetBlock)
            : processAlignmentsOfGeneOutsideOfViewport(gene, targetBlock);

          // This gene has no parent block -- assign to target block
          // console.log(`Gene ${gene.symbol} without parent block, assigning to block ${targetBlock.chromosome.chromosome} (${targetBlock.start}, ${targetBlock.stop})`);
          gene.block = targetBlock;
          // TODO: sort OR use addGene() approach here?
          targetBlock.genes.push(gene);
        }
        else if (gene.block && targetBlock && existingBlockGapCountChanged 
          && isGenomicDataInViewport(targetBlock, backboneStart, backboneStop)) // TODO: See above TODO referring to this conditional
        {
          // Existing gene that is in view and the gap count changed
          processAlignmentsOfGeneInsideOfViewport(gene, targetBlock);
        }

        // Add any new genes to our geneList (cross-referencing our Blocks)
        // TODO: sort OR use addGene() approach here?
        if (gene && !geneList.value.get(gene.rgdId)) geneList.value.set(gene.rgdId, gene);
      }
      console.timeEnd(`ProcessGenesForBlock`);
    }
  }

  console.time(`ProcessOrthologs`);
  processOrthologs(geneList.value, backboneMapKey, backboneStart, backboneStop);
  console.timeEnd(`ProcessOrthologs`);
}

/**
 * Determines gene backbone alignments without taking gaps into account. This should be good enough
 * to approximate the angle of ortholog lines as they go off screen.
 * 
 * @param gene 
 * @param targetBlock 
 */
function processAlignmentsOfGeneOutsideOfViewport(gene: Gene, targetBlock: Block)
{
  // Calculate gene backbone position
  let blockRatio = Math.abs(targetBlock.backboneStop - targetBlock.backboneStart) / Math.abs(targetBlock.stop - targetBlock.start);
  if (targetBlock.orientation == '+')
  {
    // Forward oriented block
    // TODO: Some edge cases might not be handled properly with this simplification
    gene.backboneStart = Math.floor(targetBlock.backboneStart + (gene.start - targetBlock.start) * blockRatio);
    gene.backboneStop = Math.floor(targetBlock.backboneStart + (gene.stop - targetBlock.start) * blockRatio);
  }
  else
  {
    // Reverse oriented block
    // TODO: Some edge cases might not be handled properly with this simplification
    gene.backboneStart = Math.floor(targetBlock.backboneStart + (targetBlock.stop - gene.stop) * blockRatio);
    gene.backboneStop = Math.floor(targetBlock.backboneStart + (targetBlock.stop - gene.start) * blockRatio);
  }

  // Ensure genes don't extend beyond the range of our block
  // NOTE: This is very important for small block sections near break points
  if (gene.backboneStart < targetBlock.backboneStart) gene.backboneStart = targetBlock.backboneStart;
  if (gene.backboneStop > targetBlock.backboneStop) gene.backboneStop = targetBlock.backboneStop;
}

/**
 * Determines gene backbone alignments while taking into account the gaps of the target block. This is important for
 * properly positioning genes that are in view. This function relies on gaps being sorted in ascending order.
 * 
 * @param gene 
 * @param targetBlock 
 */
function processAlignmentsOfGeneInsideOfViewport(gene: Gene, targetBlock: Block)
{
  // Only use gaps at the same level as the target block
  // NOTE: This should really always be level 1, since we only process genes that come back on level 1 blocks
  //   We will need to adjust the implementation to handle overlapping gaps if we start needing to process 
  //   level 2 stuff...
  const gaps = targetBlock.gaps.filter(g => g.chainLevel === targetBlock.chainLevel);
  if (gaps.length === 0)
  {
    // Process gene alignments for gapless blocks just like how we'd process alignments
    // that are outside of the viewport
    processAlignmentsOfGeneOutsideOfViewport(gene, targetBlock);
    return;
  }

  // Find the block/gap where the gene starts, and the block/gap where the gene ends
  let startingSection: GenomicPosition | undefined;
  let endingSection: GenomicPosition | undefined;
  let previousGap: Gap | undefined;
  for (let i = 0; i < gaps.length; i++)
  { 
    const gap = gaps[i];
    if (!startingSection)
    {
      // Looking for starting section...
      if (gene.start < gap.start)
      {
        // Starts before this gap
        // TODO: The logic for determining backboneStart/Stop here can be kind of confusing to wrap your head around. I wonder if
        //   there is a clearer way to code this. previousGap and gap flip-flop depending on orientation of the block.
        startingSection = {
          start: previousGap?.stop ?? targetBlock.start,
          stop: gap.start,
          backboneStart: (targetBlock.orientation === '-') ? gap.backboneStop : previousGap?.backboneStop ?? targetBlock.backboneStart,
          backboneStop: (targetBlock.orientation === '-') ? previousGap?.backboneStart ?? targetBlock.backboneStop : gap.backboneStart,
        };
      }
      else if (gene.start >= gap.start && gene.start <= gap.stop)
      {
        // Starts inside of this gap
        startingSection = {
          start: gap.start,
          stop: gap.stop,
          backboneStart: gap.backboneStart,
          backboneStop: gap.backboneStop,
        };
      }
    }
    
    // NOTE: Not using an else here because the endingSection might be the same as the startingSection.
    //   Need to evaluate the same gap even if startingSection has just been found.
    if (startingSection && !endingSection)
    {
      // Looking for ending section...
      if (gene.stop < gap.start)
      {
        // Ends before this gap
        // TODO: The logic for determining backboneStart/Stop here can be kind of confusing to wrap your head around. I wonder if
        //   there is a clearer way to code this. previousGap and gap flip-flop depending on orientation of the block.
        endingSection = {
          start: previousGap?.stop ?? targetBlock.start,
          stop: gap.start,
          backboneStart: (targetBlock.orientation === '-') ? gap.backboneStop : previousGap?.backboneStop ?? targetBlock.backboneStart,
          backboneStop: (targetBlock.orientation === '-') ? previousGap?.backboneStart ?? targetBlock.backboneStop : gap.backboneStart,
        };
      }
      else if (gene.stop >= gap.start && gene.stop <= gap.stop)
      {
        // Ends inside of this gap
        endingSection = {
          start: gap.start,
          stop: gap.stop,
          backboneStart: gap.backboneStart,
          backboneStop: gap.backboneStop,
        };
      }
    }

    if (i === gaps.length - 1 && targetBlock.stop > gap.stop && (!startingSection || !endingSection))
    {
      // If the last gap was just analyzed and no starting/ending section has been found, then
      // the missing section(s) should be the final "block" after the last gap
      const lastSection = {
        start: gap.stop,
        stop: targetBlock.stop,
        backboneStart: (targetBlock.orientation === '-') ? targetBlock.backboneStart : gap.backboneStop,
        backboneStop: (targetBlock.orientation === '-') ? gap.backboneStart : targetBlock.backboneStop,
      };

      if (!startingSection) startingSection = lastSection;
      if (!endingSection) endingSection = lastSection;
    }

    previousGap = gap;

    if (startingSection && endingSection)
    {
      break;
    }
  }

  if (!startingSection || !endingSection)
  {
    // Something went wrong...
    $log.error(`Gene backbone alignment could not be determined based on block with gaps. See debug logs.`);
    $log.debug(gene, targetBlock);
    // Fallback to processing without accounting for gaps
    processAlignmentsOfGeneOutsideOfViewport(gene, targetBlock);
    return;
  }

  // Calculate backbone alignments based on starting/ending section blockRatios and orientations
  const startingSectionRatio = Math.abs(startingSection.backboneStop - startingSection.backboneStart) / Math.abs(startingSection.stop - startingSection.start);
  const endingSectionRatio = Math.abs(endingSection.backboneStop - endingSection.backboneStart) / Math.abs(endingSection.stop - endingSection.start);

  if (targetBlock.orientation === '+')
  {
    // Forward oriented block
    // TODO: Some edge cases might not be handled properly with this simplification
    gene.backboneStart = Math.floor(startingSection.backboneStart + (gene.start - startingSection.start) * startingSectionRatio);
    gene.backboneStop = Math.floor(endingSection.backboneStart + (gene.stop - endingSection.start) * endingSectionRatio);
  }
  else
  {
    // Reverse oriented block
    // TODO: Some edge cases might not be handled properly with this simplification
    gene.backboneStart = Math.floor(endingSection.backboneStart + (endingSection.stop - gene.stop) * endingSectionRatio);
    gene.backboneStop = Math.floor(startingSection.backboneStart + (startingSection.stop - gene.start) * startingSectionRatio);
  }

  // Ensure genes don't extend beyond the range of our block
  // NOTE: This is very important for small block sections near break points
  if (gene.backboneStart < targetBlock.backboneStart) gene.backboneStart = targetBlock.backboneStart;
  if (gene.backboneStop > targetBlock.backboneStop) gene.backboneStop = targetBlock.backboneStop;
}

/**
 * Iterates through the gene list and pairs up off-backbone genes with their backbone orthologs
 * 
 * @param geneList
 *   list of all genes loaded in memory
 * @param backboneMapKey
 *   the map key of the backbone (used to determine which genes are backbone genes)
 * @param visibleBackboneStart
 *   backbone start basepair of the viewport
 * @param visibleBackboneStop
 *   backbone stop basepair of the viewport
 */
function processOrthologs(geneList: Map<number, Gene>, backboneMapKey: number, visibleBackboneStart: number, visibleBackboneStop: number)
{
  const threshold = getThreshold(visibleBackboneStop - visibleBackboneStart);

  $log.debug(`Process orthologs for visible range: ${visibleBackboneStart} - ${visibleBackboneStop} [threshold: ${threshold}]`);
  const offBackboneGenesWithOrthologs = Array.from(geneList.values()).filter(g => {
    if (g.backboneStart == null || g.backboneStop == null)
    {
      return false;
    }

    return g.mapKey !== backboneMapKey && g.orthologs != null && g.orthologs.length > 0;
  });

  const orthologPairs: OrthologPair[] = [];
  for (let i = 0; i < offBackboneGenesWithOrthologs.length; i++)
  {
    const offBackboneGene = offBackboneGenesWithOrthologs[i];
    const orthologs = offBackboneGenesWithOrthologs[i].orthologs;
    for (let j = 0; j < orthologs.length; j++)
    {
      const potentialBackboneGene = geneList.get(orthologs[j]);
      if (potentialBackboneGene != undefined && potentialBackboneGene.mapKey === backboneMapKey 
        && isOrthologLineInView(potentialBackboneGene, offBackboneGene, visibleBackboneStart, visibleBackboneStop)
      )
      {
        orthologPairs.push({
          backboneGene: potentialBackboneGene.clone(),
          offBackboneGene: offBackboneGene.clone(),
        });
      }
    }
  }

  $log.debug(`Ortholog pairs (determined be visible): ${orthologPairs.length}`);
  orthologs.value = orthologPairs;
}

async function queryAndProcessSyntenyForBasePairRange(backboneChromosome: Chromosome, start: number, stop: number, backboneMapKey: number)
{
  $log.debug(`Querying for specific base pair range: ${start} - ${stop}`);
  const slowAPI = setTimeout(() => {
    console.log('API is taking longer than usual to respond...');
    showToast('warn', 'Loading Impact', 'API is taking a while to respond, please be patient', 5000);
  }, 15000);

  let threshold = getThreshold(stop - start);
  const speciesSyntenyDataArray = await SyntenyApi.getSyntenicRegions({
    backboneChromosome: backboneChromosome,
    start: start,
    stop: stop,
    optional: {
      includeGenes: true,
      includeOrthologs: true,
      threshold: threshold,
    },
    comparativeSpecies: store.state.comparativeSpecies,
  });
  
  clearTimeout(slowAPI);

  // Process response
  processSynteny(speciesSyntenyDataArray, start, stop, backboneMapKey);
}

function triggerDetailedPanelProcessing(backboneChromosome: Chromosome, selectionStart: number, selectionStop: number)
{
  let selection = store.state.selectedBackboneRegion;

  // This object does not retain its functions if we are getting it off of local storage (e.g. after refreshing the page) due to it being saved as a plain object
  // We need to recreate the BackboneSelection object so that we can call `setViewportSelection()` on it later...
  selection = new BackboneSelection(backboneChromosome);

  selection.setViewportSelection(selectionStart, selectionStop);
  // Trigger the detailed panel to begin its processing
  store.dispatch('setBackboneSelection', selection);
}

/**
 * Checks for possible configuration errors and shows a dialog if found.
 * TODO: Make this a bit more robust so that if multiple errors are found, we can show them all
 * 
 * @returns {boolean} true if errors are detected
 */
function checkForConfigurationErrors()
{
  // Error if backbone chromosome or species is not specified
  if (store.state.chromosome == null || store.state.species == null)
  {
    onError(backboneOverviewError, backboneOverviewError.message, false);
    return true;
  }

  // Error if backbone info is invalid length while loading by position
  if (store.getters.isLoadByPosition && (store.state.startPos == null || store.state.stopPos == null || (store.state.stopPos - store.state.startPos) <= 0))
  {
    onError(noRegionLengthError, noRegionLengthError.message, false);
    return true;
  }

  // Error if no comparative species
  if (store.state.comparativeSpecies.length === 0)
  {
    onError(missingComparativeSpeciesError, missingComparativeSpeciesError.message, false);
    return true;
  }

  return false;
}

function showNoResultsDialog()
{
  onError(noSyntenyFoundError, noSyntenyFoundError.message, true, 'No Results');
}

function showPartialResultsDialog(speciesWithMissingSynteny: SpeciesSyntenyData[])
{
  const errMessage = `We did not find syntenic regions for the following species: ${speciesWithMissingSynteny.map(s => `${s.speciesName} (${s.mapName})`).join(', ')}`;
  onError(new Error(errMessage), errMessage, true, 'Missing Results');
}

/**
 * Checks if synteny was found for all off-backbone species/maps
 * 
 * @param speciesSyntenyDataArray
 *   Data returned from Synteny API call
 *   
 * @returns
 *   true if some synteny results are missing (error), false if synteny was returned for all species
 */
function someSyntenyResultsAreMissing(speciesSyntenyDataArray: SpeciesSyntenyData[]): boolean
{
  const resultsFound = speciesSyntenyDataArray.some(syntenyData => syntenyData.regionData.length > 0);
  if (!resultsFound)
  {
    showNoResultsDialog();
    return true;
  }
  else if (speciesSyntenyDataArray.some(syntenyData => syntenyData.regionData.length === 0))
  {
    // If only some results were found -- notify user about which ones produced no results
    const speciesWithMissingSyntenyData = speciesSyntenyDataArray.filter(syntenyData => syntenyData.regionData.length === 0);
    showPartialResultsDialog(speciesWithMissingSyntenyData);
    return true;
  }

  return false;
}

function onProceedWithErrors()
{
  proceedAfterError.value = true;
  initVCMapProcessing();
}

function showToast(severity: string, title: string, details: string, duration: number)
{
  toast.add({severity: severity, summary: title, detail: details, life: duration });
}

// TODO: temp ignore here, should remove once this method is actively being used
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function loadBackboneVariants() {
  isLoading.value = true;
  const chromosome = store.state.chromosome;
  const backboneSpecies = store.state.species;
  const backboneRegion = store.state.selectedBackboneRegion;
  const stop = backboneRegion?.viewportSelection?.basePairStop;
  const speciesMap = store.state.species?.activeMap;
  if (chromosome && stop && speciesMap && backboneSpecies)
  {
    // Check if this variantPosition set has been loaded
    const matchIdx = variantPositionsList.value.findIndex((positions) => (
      positions.mapKey === speciesMap.key && positions.blockStart === 0 && positions.blockStop === chromosome.seqLength
    ));
    if (matchIdx === -1)
    {
      const variantPositions = await buildVariantPositions(
        chromosome.chromosome,
        0,
        chromosome.seqLength,
        0,
        chromosome.seqLength,
        speciesMap.key
      );
      if (variantPositions.positions.length > 0)
      {
        variantPositionsList.value.push(variantPositions);
      }
      else
      {
        showToast('warn', 'No Variants Found', 'There were no variants found for the given chromosome', 5000);
      }
    }
  }
  isLoading.value = false;
}

// TODO: temp ignore here, should remove once this method is actively being used
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function loadSyntenyVariants() {
  isLoading.value = true;
  let foundSomeVariants = false;
  let variantPromises: Promise<void>[] = [];
  syntenyTree.value.forEach( async (blockSet) => {
    variantPromises.push(...blockSet.map( async (block) => {
      const variantRes = await buildVariantPositions(
        block.chromosome.chromosome,
        block.start,
        block.stop,
        block.backboneStart,
        block.backboneStop,
        block.chromosome.mapKey
      );
      if (variantRes)
      {
        if (!foundSomeVariants && variantRes.positions.length > 0)
        {
          foundSomeVariants = true;
        }
        block.variantPositions = variantRes;
        // NOTE: adding to variantPositionList is how we tell SVGViewbox to update
        // the backbone variants, but if we push the responses here SVGViewbox will
        // update everytime a request completes
        // So we need a better way to tell SVGViewbox to update
        // variantPositionsList.value.push(variantRes);
      }
    }));
  });
  await Promise.allSettled(variantPromises);
  isLoading.value = false;
  if (!foundSomeVariants)
  {
    showToast('warn', 'No Variants Found', 'There were no variants found for the given regions.', 5000);
  }
  store.dispatch('setIsUpdatingVariants', true);
}
</script>