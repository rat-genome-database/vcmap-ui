<template>
  <h6 class="display-6">Comparative Species</h6>
  <ul class="va-unordered">
    <li v-for="species in comparativeSpecies" :key="species.id">
      <p>{{species.name}}</p>
      <p class="species-description">{{species.syntenyString}}</p>
    </li>
  </ul>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  setup() {
    const comparativeSpecies = ref([
      { id: 1, name: 'Rattus Norvegicus', syntenyString: 'Synteny in chr1, chr4, chr11' },
      { id: 2, name: 'Equus Caballus', syntenyString: 'Synteny in chr2, chr7' }
    ]);

    return {
      comparativeSpecies
    };
  },
})
</script>

<style lang="scss" scoped>
.species-description
{
  margin-left: 0.25rem;
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}
</style>
