<template>
  <div>Species Order Component</div>
  <template v-for="(species, index) in speciesList" :key="index">
    <div class="orderRow">
      <Button icon="pi pi-angle-up" @click="moveSpeciesUp(species.mapKey, index)"/>
      <Button icon="pi pi-angle-down" @click="moveSpeciesDown(species.mapKey, index)"/>
      <div>{{ species.speciesName }}</div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { key } from '@/store';

const store = useStore(key);
const speciesList = computed(() => {
  const list: any[] = [];
  const speciesOrder = store.state.speciesOrder;
  const backboneSpecies = store.state.species;
  const comparativeSpecies = store.state.comparativeSpecies;
  const numSpecies = comparativeSpecies.length + 1;
  for (let i = 0; i < numSpecies; i++) {
    speciesOrder.forEach((value, key) => {
      if (value === i) {
        let speciesName = '';
        if (backboneSpecies?.activeMap.key === key) {
          speciesName = backboneSpecies.name;
        } else {
          comparativeSpecies.forEach((species) => {
            if (species.activeMap.key === key) {
              speciesName = species.name;
            }
          })
        }
        list.push({mapKey: key, speciesName: speciesName});
      }
    })
  }

  return list;
});

function moveSpeciesUp(key: number, index: number) {
  const newSpeciesMap = new Map();
  for (let i = 0; i < speciesList.value.length; i++) {
    const currentSpecies = speciesList.value[i];
    if (i === index - 1) {
       newSpeciesMap.set(currentSpecies.mapKey, index);
    } else if (i === index) {
       newSpeciesMap.set(currentSpecies.mapKey, index - 1);
    } else {
       newSpeciesMap.set(currentSpecies.mapKey, index);
    }
  }
  store.dispatch('setSpeciesOrder', newSpeciesMap);
}

function moveSpeciesDown(key: number, index: number) {
  const newSpeciesMap = new Map();
  for (let i = 0; i < speciesList.value.length; i++) {
    const currentSpecies = speciesList.value[i];
    if (i === index + 1) {
       newSpeciesMap.set(currentSpecies.mapKey, index);
    } else if (i === index) {
       newSpeciesMap.set(currentSpecies.mapKey, index + 1);
    } else {
       newSpeciesMap.set(currentSpecies.mapKey, index);
    }
  }
  store.dispatch('setSpeciesOrder', newSpeciesMap);
}
</script>

<style lang="scss" scoped>
.orderRow
{
  display: flex;
  align-items: center;
}
</style>
