<template>
  <div class="grid col-4">
    <div class="col-12">
      <h4>Comparative Species</h4>
      <ul class="list-disc">
        <li v-for="species in comparativeSpecies" :key="species.id">
          <div>{{species.name}}</div>
          <div>{{species.syntenyString}}</div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const comparativeSpecies = ref([
  { id: 1, name: 'Bonobo', syntenyString: 'Level 1 synteny found across 11 different chromosomes' }
]);

</script>

<style lang="scss" scoped>
.species-label
{
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}
</style>
