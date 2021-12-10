<template>
  <div class="grid unpadded col-4">
    <div class="col-12">
      <h4>Comparative Species ({{comparativeSpecies?.length}})</h4>
      <div class="grid unpadded">
        <div class="col-5">Displaying:</div>
        <div class="col-7 bold">{{comparativeSpecies?.map(s => s.name).join(', ')}}</div>
        <div class="col-5">Synteny Threshold:</div>
        <div class="col-7 bold">{{syntenyThreshold}}bp</div>
        <div class="col-5">Zoom Level:</div>
        <div class="col-7 bold"><Zoom type="comparative" :min="1" /></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Species from '@/models/Species';
import { computed } from 'vue';
import { useStore } from 'vuex';
import Zoom from '@/components/Zoom.vue';

const store = useStore();

const comparativeSpecies = computed(() => {
  let species = [];
  if (store.getters.getComparativeSpeciesOne)
  {
    species.push(store.getters.getComparativeSpeciesOne as Species);
  }

  if (store.getters.getComparativeSpeciesTwo)
  {
    species.push(store.getters.getComparativeSpeciesTwo as Species);
  }

  return species;
});

const syntenyThreshold = computed(() => {
  return store.getters.getComparativeSyntenyThreshold;
});
</script>

<style lang="scss" scoped>
.grid
{
  &.unpadded
  {
    padding: 0;
    div[class^="col-"]
    {
      padding-top: 0;
      padding-bottom: 0;
    }
  }

  div.bold
  {
    font-weight: bold;
  }
}
</style>
