<template>
  <div class="grid unpadded col-4">
    <div class="col-12">
      <h4>Details</h4>
      <div class="grid unpadded">
        <div class="col-5">Displaying:</div>
        <div class="col-7 bold">{{displayedSpeciesText}}</div>
        <div class="col-5">Synteny Threshold:</div>
        <div class="col-7 bold">{{Formatter.addCommasToBasePair(store.getters.getDetailsSyntenyThreshold)}}bp</div>
        <div class="col-5">Zoom Level:</div>
        <div class="col-7 bold"><Zoom :min="1" /></div>
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

const store = useStore();

const displayedSpeciesText = computed(() => {
  let text = '';
  store.getters.getComparativeSpecies.forEach((species: Species) => {
    if (text.length > 0)
    {
      text += ', ';
    }

    text += `${species.name} (${species.activeMap.name})`;
  });

  return text;
});
</script>
