<template>
  <HeaderPanel />
  <Button
    label="INSPECT (Main)"
    @click="onInspectPressed"
  />
  <div class="grid">
    <div class="col-9">
      <SVGViewbox :geneList="geneList" :synteny-tree="syntenyTree"/>
    </div>
    <div class="col-3">
      <SelectedDataPanel :selected-data="store.state.selectedData" :gene-list="geneList"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import SVGViewbox from '@/components/SVGViewbox.vue';
import HeaderPanel from '@/components/HeaderPanel.vue';
import SelectedDataPanel from '@/components/SelectedDataPanel.vue';
import { useStore } from 'vuex';
import { key } from '@/store';
import {onMounted, ref, shallowRef, triggerRef, watch} from 'vue';
import Gene from "@/models/Gene";
import Block, {Gap} from "@/models/Block";
import SyntenyApi, {SpeciesSyntenyData} from "@/api/SyntenyApi";
import { PANEL_SVG_START, PANEL_SVG_STOP} from '@/utils/SVGConstants';
import Chromosome from "@/models/Chromosome";
import router from "@/router";
import GeneApi from "@/api/GeneApi";
import {useLogger} from "vue-logger-plugin";

// TODO: Can we figure out a better way to handle blocks with a high chainlevel?
const MAX_CHAINLEVEL = 2;

const store = useStore(key);
const $log = useLogger();


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

// TODO TEMP
const onInspectPressed = () => {
  console.debug(geneList);
  console.debug(syntenyTree);
  // NOTE: I cannot seem to get this to force child updates when using a shallowRef???
  //triggerRef(geneList);
};
// TODO endTEMP

/**
 * Main watches this hook for the appropriate time to query the API and construct our
 * memory models representing the Comparative Map Configuration. If Main is getting
 * mounted, it is safe to clear out our old data structures
 * (Lifecycle hook)
 */
onMounted(async () => {
  $log.debug('Creating memory models for our Comparative Map view');

  // Clear out old structures
  // TODO: Ensure circular references are not going to cause memory leaks
  syntenyTree.value = new Map();
  geneList.value = new Map();

  // Check for required data
  if (!store.state.chromosome || !store.state.species)
  {
    // FIXME: Improve this UX / notify the user / etc
    $log.error('Cannot load Main -- no chromosome in state');
    await router.push('/');
    return;
  }

  // Query the Genes API
  let comparativeSpeciesIds: number[] = [];
  store.state.comparativeSpecies.map((species: { defaultMapKey: number; }) => comparativeSpeciesIds.push(species.defaultMapKey));
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
  let threshold = Math.round((store.state.chromosome.seqLength) / (PANEL_SVG_STOP - PANEL_SVG_START) / 4
  );
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
  processSynteny(speciesSyntenyDataArray);
});

/**
 * Watch for requested navigation operations (zoom in/out, navigate up/down stream).
 */
watch(() => store.state.detailedBasePairRequest, async () => {
  // Grab blocks and genes with using a threshold of approximately .25 of a pixel
  if (store.state.detailedBasePairRequest && store.state.chromosome)
  {
    $log.debug(`Detailed Base Pair range change request detected (${store.state.detailedBasePairRequest?.start},
       ${store.state.detailedBasePairRequest?.stop}).`);

    let threshold = Math.round(
        (store.state.detailedBasePairRequest.stop - store.state.detailedBasePairRequest.start) /
        (PANEL_SVG_STOP - PANEL_SVG_START) / 4
    );
    const speciesSyntenyDataArray = await SyntenyApi.getSyntenicRegions({
      backboneChromosome: store.state.chromosome,
      start: store.state.detailedBasePairRange.start,
      stop: store.state.detailedBasePairRange.stop,
      optional: {
        includeGenes: true,
        includeOrthologs: true,
        threshold: threshold,
      },
      comparativeSpecies: store.state.comparativeSpecies,
    });

    // Process response
    processSynteny(speciesSyntenyDataArray);


    // Data processing done, ready to complete request
    let selection = store.state.selectedBackboneRegion;
    selection?.setViewportSelection(store.state.detailedBasePairRequest.start, store.state.detailedBasePairRequest.stop,
        store.state.overviewBasePairToHeightRatio);
    console.log('Backbone selection', selection);
    store.dispatch('setBackboneSelection', selection);
    store.dispatch('setDetailedBasePairRequest', null);
  }
});

/**
 * Process a synteny block response (with genes, gaps, and orthologs) from the API.
 * TODO: We might need to control the number of chainLevel >= 2 we add, these are excessive...
 */
// TODO: Handle orthologs
function processSynteny(speciesSyntenyDataArray : SpeciesSyntenyData[] | undefined)
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

  let tree:Map<number, Block[]> = syntenyTree.value;
  let backboneChr = store.state.chromosome; // TODO: This is proxied, not sure why? Also not sure it matters...
  $log.debug(`Processing ${speciesSyntenyDataArray.length} blocks of Synteny Data...`);

  // For each off-backbone species in our response, loop the region data
  speciesSyntenyDataArray.forEach((speciesResponse) => {
    // Check if we need to create a new structure for this mapKey (species)
    if (!tree.has(speciesResponse.mapKey)) tree.set(speciesResponse.mapKey, []);
    let knownSpeciesBlocks = tree.get(speciesResponse.mapKey) ?? [];

    // For each region (block), compare to *all* our existing structures
    // NOTE: If we can afford to do it, might make sense to change our SyntenyApi to build
    //   our block structure, so we can more quickly identify new data and add to our tree.
    speciesResponse.regionData.forEach((blockData) => {
      //
      if (blockData.block.chainLevel > MAX_CHAINLEVEL) return;

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

      if (blockSearch.length == 0)
      {
        // Create a newly discovered block
        $log.debug(`Found new Synteny block for ${speciesResponse.speciesName} (chr ${blockData.block.chromosome})`);
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
        // NOTE: Avoiding callback based forEach here for performance reasons
        let gaps: Gap[] = [];
        for (let i = 0, len = blockData.gaps.length; i < len; i++)
        {
          gaps.push(new Gap({start: blockData.gaps[i].start, stop: blockData.gaps[i].stop}));
        }
        newBlock.addGaps(gaps);
        console.timeEnd("AddGapsNewBlock");

        knownSpeciesBlocks.push(newBlock);
        targetBlock = newBlock;
      }
      else if (blockSearch.length == 1)
      {
        // Use an existing block
        // Keep the reference to this block from our tree
        targetBlock = blockSearch[0];

        console.time("AddGapsExistingBlock");
        // NOTE: Avoiding callback based forEach here for performance reasons
        let gaps: Gap[] = [];
        for (let i = 0, len = blockData.gaps.length; i < len; i++)
        {
          gaps.push(new Gap({start: blockData.gaps[i].start, stop: blockData.gaps[i].stop}));
        }
        targetBlock?.addGaps(gaps);
        console.timeEnd("AddGapsExistingBlock");
      }
      else
      {
        // Shouldn't ever happen (TODO: warn the user)
        $log.error('OH NO! Discovered duplicate blocks in our tree!');
      }

      // Handle genes (we need to inspect all of them even in the case of a new block)
      blockData.genes.forEach((geneData) => {
        // Use any existing genes if we have already loaded one
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
          // This gene is new -- assign a Block and calculate backbone positioning
          gene.block = targetBlock;
          let blockRatio = Math.abs(targetBlock.backboneStop - targetBlock.backboneStart) / Math.abs(targetBlock.stop - targetBlock.start);
          if (targetBlock.orientation == '+')
          {
            // Forward oriented block
            // TODO: Some edge cases might not be handled properly with this simplification
            gene.backboneStart = targetBlock.backboneStart + (gene.start - targetBlock.start) * blockRatio;
            gene.backboneStop = targetBlock.backboneStart + (gene.stop - targetBlock.start) * blockRatio;
          }
          else
          {
            // Reverse oriented block
            // TODO: Some edge cases might not be handled properly with this simplification
            gene.backboneStart = targetBlock.backboneStart + (targetBlock.stop - gene.stop) * blockRatio;
            gene.backboneStop = targetBlock.backboneStart + (targetBlock.stop - gene.start) * blockRatio;
          }

          // Ensure genes don't extend beyond the range of our block
          // NOTE: This is very important for small block sections near break points
          if (gene.backboneStart < targetBlock.backboneStart) gene.backboneStart = targetBlock.backboneStart;
          if (gene.backboneStop > targetBlock.backboneStop) gene.backboneStop = targetBlock.backboneStop;
        }
        targetBlock?.genes.push(gene);
        // TODO: sort OR use addGene() approach here
      });

      // Add any new genes to our geneList (cross-referencing our Blocks)
      targetBlock?.genes.forEach((gene) => {
        if (gene && !geneList.value.get(gene.rgdId)) geneList.value.set(gene.rgdId, gene);
      });
    });

  });
}
</script>