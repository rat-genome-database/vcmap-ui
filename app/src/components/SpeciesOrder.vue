<template>
  <div>Species Order Component</div>
  <div class="orderRowContainer">
    <template v-for="(species, index) in speciesList" :key="index">
      <div class="orderRow">
        <Button
          icon="pi pi-angle-up"
          text
          class="arrowButton"
          :disabled="index === 0"
          @click="moveSpeciesUp(species.mapKey, index)"
        />
        <div>{{ species.speciesName }}</div>
        <Button
          icon="pi pi-angle-down"
          text
          class="arrowButton"
          size="small"
          :disabled="index === speciesList.length - 1"
          @click="moveSpeciesDown(species.mapKey, index)"
        />
      </div>
    </template>
  </div>
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
    Object.keys(speciesOrder).forEach((key) => {
      const value = speciesOrder[key];
      if (value === i) {
        let speciesName = '';
        if (backboneSpecies?.activeMap.key.toString() === key) {
          speciesName = `${backboneSpecies.name} (${backboneSpecies.activeMap.name})`;
        } else {
          comparativeSpecies.forEach((species) => {
            if (species.activeMap.key.toString() === key) {
              speciesName = `${species.name} (${species.activeMap.name})`;
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
  const newSpeciesOrder: any = {};
  for (let i = 0; i < speciesList.value.length; i++) {
    const currentSpecies = speciesList.value[i];
    if (i === index - 1) {
       newSpeciesOrder[currentSpecies.mapKey.toString()] = index;
    } else if (i === index) {
       newSpeciesOrder[currentSpecies.mapKey.toString()] =  index - 1;
    } else {
       newSpeciesOrder[currentSpecies.mapKey.toString()] = i;
    }
  }
  store.dispatch('setSpeciesOrder', newSpeciesOrder);
}

function moveSpeciesDown(key: number, index: number) {
  const newSpeciesOrder: any = {};
  for (let i = 0; i < speciesList.value.length; i++) {
    const currentSpecies = speciesList.value[i];
    if (i === index + 1) {
       newSpeciesOrder[currentSpecies.mapKey.toString()] = index;
    } else if (i === index) {
       newSpeciesOrder[currentSpecies.mapKey.toString()] =  index + 1;
    } else {
       newSpeciesOrder[currentSpecies.mapKey.toString()] =  i;
    }
  }
  store.dispatch('setSpeciesOrder', newSpeciesOrder);
}
</script>

<style lang="scss" scoped>
.orderRow
{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}

.orderRowContainer
{
  max-width: max-content;
}

.arrowButton
{
  height: 1rem;
  width: 1rem;
  background-color: white;
  color: #2196F3;
  border-color: white;
  &:hover {
    background-color: white;
    color: #2196F3;
  }
}
</style>
