<template>
  <h6 class="display-6">Backbone</h6>
  <p v-if="backboneSpecies" class="species-label" data-test="backbone-overview-species">Species: {{backboneSpecies.name}}</p>
</template>

<script lang="ts" setup>
import Species from '@/models/Species';
import { onMounted, ref } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

let backboneSpecies = ref<Species | null>(null);

onMounted(() => {
  backboneSpecies.value = store.getters.getSpecies;
});
</script>

<style lang="scss">
.species-label
{
  margin-top: 1rem;
}
</style>
