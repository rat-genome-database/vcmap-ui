<template>
  <div class="grid unpadded col-4">
    <div class="col-12">
      <h4>Comparative Species ({{comparativeSpecies?.length}})</h4>
      <div class="grid unpadded">
        <div class="col-5">Displaying:</div>
        <div class="col-7 bold">{{comparativeSpecies?.map(s => s.name).join(', ')}}</div>
        <div class="col-5">Synteny Threshold:</div>
        <div class="col-7 bold">{{Resolution.ComparativePanel.getSyntenyThreshold()}}bp</div>
        <div class="col-5">Zoom Level:</div>
        <div class="col-7 bold">1x</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Species from '@/models/Species';
import { onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { Resolution } from '@/utils/Resolution';

const store = useStore();
let comparativeSpecies = ref<Species[] | null>(null);

onMounted(() => {
  comparativeSpecies.value = [];
  
  if (store.getters.getComparativeSpeciesOne)
  {
    comparativeSpecies.value.push(store.getters.getComparativeSpeciesOne as Species);
  }

  if (store.getters.getComparativeSpeciesTwo)
  {
    comparativeSpecies.value.push(store.getters.getComparativeSpeciesTwo as Species);
  }
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
