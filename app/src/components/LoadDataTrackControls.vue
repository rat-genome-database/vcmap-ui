<template>
  <h3>Variants</h3>
  <div class="content-container">
    <div class="track-item-container">
      <div class="grid" v-for="(item, index) in dataTrackItems" :key="index">
        <div class="col-4">
          <Dropdown 
            v-model="dataTrackItems[index].species"
            :options="speciesOptions"
            optionValue="activeMap"
            optionLabel="label"
            placeholder="Species"
            @change="onConfirmLoadDataTrack"
          />
        </div>
        <div class="col-1">
          <Button @click="removeDataTrackItem(index)" label="Remove" icon="pi pi-minus-circle" class="p-button-sm p-button-danger" />
        </div>
      </div>
    </div>
    <Button
      label="Add Variants"
      icon="pi pi-plus-circle"
      class="p-button mb-2"
      @click="onAddDataTrack"
    />
  </div>
</template>
  
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { key } from '@/store';
import Species from '@/models/Species';
// import SpeciesApi from '@/api/SpeciesApi';
import SpeciesMap from '@/models/SpeciesMap';
import logger from '@/logger';

interface Emits
{
  (eventName: 'variant-change', mapKeys: number[]): void,
}

interface DataTrackItem
{
  species: SpeciesMap;
}

const store = useStore(key);
const emit = defineEmits<Emits>();

// refs
const dataTrackItems = ref<DataTrackItem[]>([]);
const speciesOptions = ref<Species[]>([]);

// // Dropdown selection options:
// const sourceOptions = [{name: 'API', key: 0},{name: 'File Upload', key: 1}];
// // data type options:
// const dataTypeOptions = [{name: 'QTL', key: 0},{name: 'Variants', key: 1}]

onMounted(prepopulateConfigOptions);

watch(() => store.state.comparativeSpecies, prepopulateConfigOptions);

const onConfirmLoadDataTrack = () => {
  const selectedMapKeys: number[] = [];
  dataTrackItems.value.forEach((item) => {
    if (item.species) {
      selectedMapKeys.push(item.species.key);
    }
  });

  emit('variant-change', selectedMapKeys);
};

const onAddDataTrack = () => {
  let currLength = dataTrackItems.value.length;

  // limit max number of tracks
  if (currLength < store.state.comparativeSpecies.length + 1)
  {
    dataTrackItems.value.push({ species: null });
  }
  else {
    // todo: Error Handling
    logger.error("Item Limit Reached");
  }
};

function removeDataTrackItem(index: number)
{
  dataTrackItems.value.splice(index, 1);
}

function prepopulateConfigOptions()
{
  let loadedSpecies = [];
  try
  {
    let loadedBackbone = store.state.species;
    if (loadedBackbone == null) {
      logger.warn(`Cannot prepopulate data track config options when loaded backbone is null`);
      return;
    }
    
    loadedBackbone.label = loadedBackbone.name + ": " + loadedBackbone.activeMap.name;
    loadedSpecies.push(loadedBackbone);
    store.state.comparativeSpecies.forEach((entry) => {
      entry.label = entry.name + ": " + entry.activeMap.name;
      loadedSpecies.push(entry);
    });
    speciesOptions.value = loadedSpecies;
  }
  catch (err: any)
  {
    logger.error('An error occurred while loading available species');
    logger.error(err);
  }

  // try
  // {
  //   // to filter only for currently loaded species
  //   speciesOptions.value = await (await SpeciesApi.getSpecies()).filter((item) => {
  //     return (loadedSpecies.includes(item.name));
  //   });
  //   // speciesOptions.value = await (await SpeciesApi.getSpecies())
  // }
  // catch (err: any)
  // {
  //   logger.error('An error occurred while looking up the available species');
  // }

  if (speciesOptions.value.length === 0 || store.state.species == null)
  {
    return;
  }
}

</script>

<style lang="scss">
.content-container {
  // background-color: rgb(217, 225, 225);
  height: 95%;
}
.modal-controls-container {
  padding: 2rem 1rem 2rem 1rem;
  height: 5%;
}
.track-item-container {
  display: grid;
  padding-left: 1.5em;
  margin-top: 1em;

    .track-item {
    // width: fit-content;
    margin-top: 1em;
    display: flex;
    justify-content: flex-start;
  }
}
      </style>
