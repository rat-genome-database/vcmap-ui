<template>
  <HeaderPanel />
  <p>Gene List size: {{ geneList.size }}</p>
  <Button
    label="INSPECT (Main)"
    @click="onInspectPressed"
  />
  <div class="grid">
    <div class="col-9">
      <SVGViewbox :geneList="geneList" @new-genes="newGenesFromChild"/>
    </div>
    <div class="col-3">
      <SelectedDataPanel :selected-data="store.state.selectedData" :geneList="geneList"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import SVGViewbox from '@/components/SVGViewbox.vue';
import HeaderPanel from '@/components/HeaderPanel.vue';
import SelectedDataPanel from '@/components/SelectedDataPanel.vue';
import { useStore } from 'vuex';
import { key } from '@/store';
import {ref, shallowRef, triggerRef, watch} from 'vue';
import Gene from "@/models/Gene";
import Block from "@/models/Block";
import SyntenyApi from "@/api/SyntenyApi";
import { PANEL_SVG_START, PANEL_SVG_STOP} from '@/utils/SVGConstants';
import Chromosome from "@/models/Chromosome";

const store = useStore(key);

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

const newGenesFromChild = (newGenes: Gene[]) => {
  console.log(`New genes from Child (${newGenes.length})`);
  newGenes.forEach((newGene) => {
    //if (geneList.value.has(newGene.rgdId)) console.debug(`Event contained Duplicate`, newGene);
    // TODO: Important that we clone the "newGene" object here in the future
    geneList.value.set(newGene.rgdId, newGene);
  });
};
// TODO endTEMP

// Watch for requested navigation operations (zoom in/out, navigate up/down stream)
watch(() => store.state.detailedBasePairRange, async () => {
  console.log('Detailed Base Pair range just changed...');
  console.log('  If this were instead a "requested" change, I would kick off API processing');
  console.log('  and once completed, I would actually change detailedBasePairRange resulting');
  console.log('  in SVG changes based on my current data in Main');


  // Example call -- Grab blocks with using a high threshold (.25 of a pixel)
  if (store.state.chromosome)
  {
    let threshold = Math.round(
        (store.state.detailedBasePairRange.stop - store.state.detailedBasePairRange.start) /
        (PANEL_SVG_STOP - PANEL_SVG_START) / 4
    );
    const speciesSyntenyDataArray = await SyntenyApi.getSyntenicRegions({
      backboneChromosome: store.state.chromosome,
      start: store.state.detailedBasePairRange.start,
      stop: store.state.detailedBasePairRange.stop,
      optional: {
        threshold: threshold,
      },
      comparativeSpecies: store.state.comparativeSpecies,
    });

    // Process response
    if (speciesSyntenyDataArray)
    {
      let tree:Map<number, Block[]> = syntenyTree.value;
      let backboneChr = store.state.chromosome; // TODO: This is proxied, not sure why? Also not sure it matters...

      // For each off-backbone species in our response, loop the region data
      speciesSyntenyDataArray.forEach((speciesResponse) => {
        // Check if we need to create a new structure for this mapKey (species)
        if (!tree.has(speciesResponse.mapKey)) tree.set(speciesResponse.mapKey, []);
        let knownSpeciesBlocks = tree.get(speciesResponse.mapKey) ?? [];

        // For each region (block), compare to *all* our existing structures
        // NOTE: If we can afford to do it, might make sense to change our SyntenyApi to build
        //   our block structure, so we can more quickly identify new data and add to our tree.
        speciesResponse.regionData.forEach((blockData) => {
          let targetBlock;

          let blockSearch = knownSpeciesBlocks.filter((b) => {
            // NOTE: we consider two blocks the same if the "chainLevel", "backboneStart", and "backboneStop" are identical
            //   There are potentially situations where start & stop are identical but this duplicated off-backbone
            //   syntenic region appears in multiple different places on the same backbone.
            // TODO: In these cases we need to handle our gene references differently (by grabbing from
            //   our existing dataset instead of using the new objects from the SyntenyApi)
            return (b.chainLevel == blockData.block.chainLevel &&
                b.backboneStart == blockData.block.backboneStart && b.backboneStop == blockData.block.backboneStop);
          });

          if (blockSearch.length == 0)
          {
            // Add a newly discovered block
            console.debug(`Found new Synteny block for ${speciesResponse.speciesName} (chr ${blockData.block.chromosome})`);
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
            // Gaps
            blockData.gaps.forEach((gapData) => {
              newBlock.gaps.push({ start: gapData.start, stop: gapData.stop });
            });
            // TODO: newBlock.genes = blockData.genes;
            knownSpeciesBlocks.push(newBlock);
            targetBlock = newBlock;
          }
          else if (blockSearch.length == 1)
          {
            // Keep the reference to this block from our tree
            targetBlock = blockSearch[1];
            // TODO: Inspect and add any new gaps for this block
            // TODO: Inspect and add any new genes for this block
          }
          else
          {
            // Shouldn't ever happen (TODO: warn the user)
            console.error('OH NO! Discovered duplicate blocks in our tree!');
          }

          // Add any new genes to our geneList (cross-referencing our Blocks)
          targetBlock?.genes.forEach((gene) => {
            if (gene && !geneList.value.get(gene.rgdId)) geneList.value.set(gene.rgdId, gene);
          });
        });

      });
    }
  }
});
</script>