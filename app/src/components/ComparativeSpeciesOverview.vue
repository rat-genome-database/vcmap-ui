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
  { id: 1, name: 'Rat', syntenyString: 'Synteny in chr1, chr4, chr11' },
  { id: 2, name: 'Horse', syntenyString: 'Synteny in chr2, chr7' }
]);

</script>

<style lang="scss" scoped>
.species-label
{
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}
</style>
