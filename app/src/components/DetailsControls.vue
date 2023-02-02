<template>
  <div class="grid unpadded col-7">
    <div class="col-12">
      <h4>Details</h4>
      <div class="grid unpadded">
        <div class="col-3">Displaying:</div>
        <div class="col-9 bold">{{store.state.species?.name}} chr{{store.state.chromosome?.chromosome}}:{{displayedSpeciesRegionLabel}}</div>
        <div class="col-3">Comparative Species:</div>
        <div class="col-9 bold">{{comparativeSpeciesText}}</div>
        <div class="col-3">Synteny Threshold:</div>
        <div class="col-9 bold">{{Formatter.addCommasToBasePair(store.state.detailsSyntenyThreshold)}}bp</div>
        <div class="col-3">Zoom Level:</div>
        <div class="col-9 bold"><Zoom /></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Species from '@/models/Species';
import { computed } from 'vue';
import { useStore } from 'vuex';
import Zoom from '@/components/Zoom.vue';
import { Formatter } from '@/utils/Formatter';
import { key } from '@/store';

const store = useStore(key);

const displayedSpeciesRegionLabel = computed(() => {
  const selectedRegion = store.state.selectedBackboneRegion;
  if (selectedRegion && selectedRegion.viewPortSelection && selectedRegion.viewPortSelection.svgHeight > 0)
  {
    return `${Formatter.addCommasToBasePair(selectedRegion.viewPortSelection.basePairStart)}-${Formatter.addCommasToBasePair(selectedRegion.viewPortSelection.basePairStop)}`;
  }
  
  return '';
});

const comparativeSpeciesText = computed(() => {
  let text = '';
  store.state.comparativeSpecies.forEach((species: Species) => {
    if (text.length > 0)
    {
      text += ', ';
    }

    text += `${species.name} (${species.activeMap.name})`;
  });

  return text;
});
</script>
