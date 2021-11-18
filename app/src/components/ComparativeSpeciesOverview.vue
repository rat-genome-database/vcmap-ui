<template>
  <div class="grid col-4">
    <div class="col-12">
      <h4>Comparative Species ({{comparativeSpecies?.length}})</h4>
      <ul class="list-disc">
        <li v-for="species in comparativeSpecies" :key="species.name">
          <div>{{species.name}}</div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Species from '@/models/Species';
import { onMounted, ref } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
let comparativeSpecies = ref<Species[] | null>(null);

onMounted(() => {
  comparativeSpecies.value = [store.getters.getComparativeSpeciesOne, store.getters.getComparativeSpeciesTwo];
});
</script>

<style lang="scss" scoped>
.species-label
{
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}
</style>
