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

const store = useStore(key);

const syntenyTree = ref(new Map<number, Block>());
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
const geneList = ref(new Map<number, Gene>());
const onInspectPressed = () => {
  console.debug(geneList);
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

watch(() => store.state.detailedBasePairRange, async () => {
  console.log('Detailed Base Pair range just changed...');
  console.log('  If this were instead a "requested" change, I would kick off API processing');
  console.log('  and once completed, I would actually change detailedBasePairRange resulting');
  console.log('  in SVG changes based on my current data in Main');


  // Example call -- Grab blocks with using a high threshold (.25 of a pixel)
  if (store.state.chromosome)
  {
    let threshold = Math.round(store.state.chromosome.seqLength / (PANEL_SVG_STOP - PANEL_SVG_START) / 4);
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
    // TODO For each off-backbone species, loop the region data
    // TODO For each region (block), compare to our existing structures, if new -- create and add
    // TODO For each gene in geneList, identify appropriate block and reference it
  }
});
</script>