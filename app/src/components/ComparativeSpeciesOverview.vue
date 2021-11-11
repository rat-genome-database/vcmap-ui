<template>
  <h6 class="display-6">Comparative Species</h6>
  <ul class="va-unordered">
    <li v-for="species in comparativeSpecies" :key="species.id">
      <p>{{species.name}}</p>
      <p class="species-description">{{species.syntenyString}}</p>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const comparativeSpecies = ref([
  { id: 1, name: 'Rat', syntenyString: 'Synteny in chr1, chr4, chr11' },
  { id: 2, name: 'Horse', syntenyString: 'Synteny in chr2, chr7' }
]);

</script>

<style lang="scss" scoped>
.species-description
{
  margin-left: 0.25rem;
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}
</style>
