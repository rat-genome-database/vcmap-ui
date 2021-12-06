<template>
  <div class="grid col-3">
    <div class="col-12">
      <h4>Comparative Species ({{comparativeSpecies?.length}})</h4>
      <ul class="list-disc">
        <li v-for="species in comparativeSpecies" :key="species.name">
          <div>{{species.name}}</div>
        </li>
      </ul>
      <div class="grid">
        <div class="col-6">
          <p class="comparative-field">Synteny Threshold:</p>
        </div>
        <div class="col-6">
          <p class="comparative-field comparative-value">{{Resolution.BackbonePanel.getSyntenyThreshold()}}bp</p>
        </div>
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
.species-label
{
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}
.comparative-field
{
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  &.comparative-value
  {
    font-weight: bold;
  }
}
</style>
