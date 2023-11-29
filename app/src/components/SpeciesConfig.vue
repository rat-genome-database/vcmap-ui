<template>
  <div>
    <div class="col-10 col-offset-1">
      <h2>
        Comparative Species
      </h2>
    </div>
    <div v-for="(species, index) in store.state.comparativeSpecies" :key="index">
      <div class="grid">
        <div class="col-4">
          {{ species.name }} ({{ species.activeMap.name }})
        </div>
        <div class="lg:col-1 md:col-1 sm:col-1">
          <Button @click="removeComparativeSpecies(index)" label="Remove" icon="pi pi-minus-circle" class="p-button-sm p-button-danger" />
        </div>
      </div>
    </div>
    <div>
      <Message severity="warn" closeable v-if="comparativeSpeciesSelections.length >= 4">Selecting 4 or more species might cause display errors</Message>
    </div>
    <div class="grid" v-for="(species, index) in comparativeSpeciesSelections" :key="index">
      <div class="col-4">
        <Dropdown 
          v-model="comparativeSpeciesSelections[index].typeKey" 
          :options="speciesOptions"
          @change="setPrimaryAssembly(index)"
          optionValue="typeKey"
          optionLabel="name" 
          placeholder="Comparative Species"
          />
      </div>
      <div class="col-4 text-left">
        <Dropdown 
          v-model="comparativeSpeciesSelections[index].mapKey"
          :disabled="comparativeSpeciesSelections[index].typeKey === 0"
          :options="getAssemblyOptionsForSpecies(index)"
          :optionLabel="getAssemblyOptionLabel"
          @change="checkAgainstBackboneSpeciesAndAssembly(comparativeSpeciesSelections[index])"
          optionValue="key"
          placeholder="Comparative Assembly"
          :class="{'border-warning': comparativeSpeciesSelections[index].showWarning}"
          />
        <small v-if="comparativeSpeciesSelections[index].showWarning" class="warning-text">Warning: Selected same species and assembly as the backbone</small>
      </div>
      <div class="lg:col-1 md:col-1 sm:col-1">
        <Button @click="removeTempComparativeSpecies(index)" label="Remove" icon="pi pi-minus-circle" class="p-button-sm p-button-danger" />
      </div>
    </div>
    <div class="col-11 col-offset-1 text-left">
      <Button
        @click="addTempComparativeSpecies"
        :label="(comparativeSpeciesLimitReached) ? 'Limit Reached' : 'Add Species'"
        :disabled="comparativeSpeciesLimitReached"
        icon="pi pi-plus-circle"
        class="p-button mb-2"
      />
    </div>
    <Button
      @click="updateComparativeSpecies"
      label="Update"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { key } from '@/store';
import Species from '@/models/Species';
import SpeciesMap from '@/models/SpeciesMap';
import SpeciesApi from '@/api/SpeciesApi';

const store = useStore(key);

interface ComparativeSpeciesSelection
{
  typeKey: number;
  mapKey: number;
  showWarning: boolean;
  visible: boolean;
}

interface Props
{
  onUpdate: (newSpeciesOrder: any, newComparativeSpecies: Species[]) => void,
}
const props = defineProps<Props>();

const speciesOptions = ref<Species[]>([]);
const comparativeSpeciesSelections = ref<ComparativeSpeciesSelection[]>([]);
const comparativeSpeciesLimitReached = computed(() => {
  return (comparativeSpeciesSelections.value.length >= 5);
});

onMounted(async () => {
  speciesOptions.value = await SpeciesApi.getSpecies();
})

function addTempComparativeSpecies()
{
  let currLength = comparativeSpeciesSelections.value.length;
  if (currLength < 5)
  {
    comparativeSpeciesSelections.value.push({ typeKey: 0, mapKey: 0, showWarning: false, visible: true });
  }
}

function setPrimaryAssembly(index: number)
{
  let selectedSpecies: Species | undefined;
  for (let i = 0; i < speciesOptions.value.length; i++)
  {
    if (speciesOptions.value[i].typeKey === comparativeSpeciesSelections.value[index].typeKey)
    {
      selectedSpecies = speciesOptions.value[i];
      break;
    }
  }

  if (selectedSpecies != null)
  {
    comparativeSpeciesSelections.value[index].mapKey = selectedSpecies.defaultMapKey;
  }

  checkAgainstBackboneSpeciesAndAssembly(comparativeSpeciesSelections.value[index]);
}

function checkAgainstBackboneSpeciesAndAssembly(selection: ComparativeSpeciesSelection)
{
  if (store.state.species != null && selection.typeKey === store.state.species.typeKey && selection.mapKey === store.state.species.activeMap.key)
  {
    selection.showWarning = true;
  }
  else
  {
    selection.showWarning = false;
  }
}

function getAssemblyOptionsForSpecies(index: number)
{
  if (comparativeSpeciesSelections.value.length <= index)
  {
    return [];
  }

  for (let i = 0; i < speciesOptions.value.length; i++)
  {
    if (speciesOptions.value[i].typeKey === comparativeSpeciesSelections.value[index].typeKey)
    {
      return speciesOptions.value[i].maps;
    }
  }

  return [];
}

function getAssemblyOptionLabel(assembly: SpeciesMap)
{
  return assembly.primaryRefAssembly ? `${assembly.name} (primary)` : assembly.name;
}

function removeTempComparativeSpecies(index: number)
{
  comparativeSpeciesSelections.value.splice(index, 1);
}

function removeComparativeSpecies(index: number)
{
  const comparativeSpecies = store.state.comparativeSpecies;
  comparativeSpecies.splice(index, 1);
}

function updateComparativeSpecies() {
  const speciesOrder: any = {};
  const backboneKey = store.state.species?.activeMap.key || 0;
  speciesOrder[backboneKey.toString()] = 0;
  const comparativeSpecies: Species[] = [...store.state.comparativeSpecies];
  let currentOrder = 0;
  comparativeSpecies.forEach((s: Species) => {
    if (s.visible) {
      currentOrder++;
      speciesOrder[s.activeMap.key] = currentOrder;
    }
  });
  comparativeSpeciesSelections.value.forEach(s => {
    if (s.typeKey === 0)
    {
      return;
    }

    for (let i = 0; i < speciesOptions.value.length; i++)
    {
      if (speciesOptions.value[i].typeKey === s.typeKey)
      {
        const selectedSpecies = speciesOptions.value[i].copy();
        for (let j = 0; j < selectedSpecies.maps.length; j++)
        {
          if (selectedSpecies.maps[j].key === s.mapKey)
          {
            selectedSpecies.activeMap = selectedSpecies.maps[j];
            selectedSpecies.visible = s.visible;
            // Only increment and set order if species is visible
            if (selectedSpecies.visible) {
              currentOrder++;
              speciesOrder[selectedSpecies.activeMap.key] = currentOrder;
            }
            break;
          }
        }
        comparativeSpecies.push(selectedSpecies);
        break;
      }
    }
  });
  comparativeSpeciesSelections.value = [];
  props.onUpdate(speciesOrder, comparativeSpecies);
}
</script>