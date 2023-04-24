<template>
  <Dialog 
    v-model:visible="isActive" 
    class="data-track-dialog"
    :draggable="false"
    :closable="false"
    :modal="true">
    <template #header>
      <div class="header-container">
        <div class="col-12 backbone-info">
          <div class="grid unpadded">
            <div class="col-5">Backbone:</div>
            <div class="col-7 bold">{{store.state.species?.name}}</div>
            <div class="col-5">Chromosome:</div>
            <div class="col-7 bold">chr{{store.state.chromosome?.chromosome}}</div>
            <div class="col-5">Assembly:</div>
            <div class="col-7 bold">{{store.state.species?.activeMap.name}}</div>
          </div>
        </div>
        <div>
          <table>
            <thead>
              <tr><th>Comparative Species</th><th>Assembly</th></tr>
            </thead>
            <tbody>
              <tr v-for="(species, index) in store.state.comparativeSpecies" :key="index">
                <td>{{ species.name }}</td>
                <td>{{ species.activeMap.name }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
    <div class="content-container">
      <Button label="Add Data Track" icon="pi pi-plus" class="p-button-secondary p-button-sm add-track-btn" @click="onAddDataTrack" />
      <!-- <Button label="Debug" icon="pi pi-circle" class="p-button-info p-button-sm add-track-btn" @click="onDebugClick" /> -->
      <div class="track-item-container">
        <div class="grid track-item" v-for="(item, index) in dataTrackItems" :key="index">
        <Dropdown 
          v-model="dataTrackItems[index].species"
          :options="speciesOptions"
          optionValue="activeMap"
          optionLabel="label"
          placeholder="Species"
        />
        <div class="lg:col-1 md:col-2 sm:col-2">
          <Button @click="removeDataTrackItem(index)" label="Remove" icon="pi pi-minus-circle" class="p-button-sm p-button-danger" />
        </div>
      </div>
      </div>
    </div>
    <div class="grid p-d-flex modal-controls-container">
        <div class="left-align-btn">
          <Button label="Cancel" class="p-button-danger" @click="close" />
        </div>
        <div>
          <Button label="Load Tracks" class="p-button-secondary" icon="pi pi-arrow-right" @click="onConfirmLoadDataTrack" />
        </div>
      </div>
  </Dialog>
</template>
  
<script setup lang="ts">
  import { computed, ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useStore } from 'vuex';
  import { key } from '@/store';
  import Species from '@/models/Species';
  import SpeciesApi from '@/api/SpeciesApi';
  // import SpeciesApi from '@/api/SpeciesApi';
  import SpeciesMap from '@/models/SpeciesMap';

/**
 * Can use v-model:show to do 2 way binding
 */
interface Props 
{
  header: string;
  message?: string;
  show: boolean;
  theme?: 'error' | 'normal';
  showBackButton?: boolean;
  onConfirmCallback?: () => void;
  onLoadSyntenyVariants: (mapKeys: number[] | null) => void;
  onCloseLoadDataTrackModal: () => void;
}

interface Emits
{
  // eslint-disable-next-line
  (eventName: 'update:show', value: boolean): void
}

interface DataTrackItem
{
  species: SpeciesMap;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const router = useRouter();
const store = useStore(key);

// refs
const dataTrackItems = ref<DataTrackItem[]>([]);
const speciesOptions = ref<Species[]>([]);

// // Dropdown selection options:
// const sourceOptions = [{name: 'API', key: 0},{name: 'File Upload', key: 1}];
// // data type options:
// const dataTypeOptions = [{name: 'QTL', key: 0},{name: 'Variants', key: 1}]

onMounted(prepopulateConfigOptions);

const isActive = computed({
  get() {
    return props.show;
  },
  set(value: boolean) {
    emit('update:show', value);
  }
});

// todo: temp - remove along with UI button later
const onDebugClick = () => {
  console.log(dataTrackItems.value);

  dataTrackItems.value.forEach((item) => {
    console.log(item.species?.key === store.state.chromosome.mapKey);
  });
}

const onConfirmLoadDataTrack = () => {
  const selectedMapKeys: number[] = [];
  dataTrackItems.value.forEach((item) => {
    if (item.species) {
      selectedMapKeys.push(item.species.key);
    }
  });

  if (selectedMapKeys.length > 0) {
    props.onCloseLoadDataTrackModal();
    props.onLoadSyntenyVariants(selectedMapKeys);
    dataTrackItems.value.length = 0;
  }
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
    console.log("Item Limit Reached")
  }
}

const close = () => {
  dataTrackItems.value.length = 0;
  props.onCloseLoadDataTrackModal();
};

// const goToConfiguration = () => {
//   close();
//   router.push('/');
// };

const onConfirm = () => {
  close();
  if (props.onConfirmCallback)
  {
    props.onConfirmCallback();
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
    loadedBackbone.label = loadedBackbone.name + ": " + loadedBackbone.activeMap.name;
    loadedSpecies.push(loadedBackbone)
    store.state.comparativeSpecies.forEach((entry) => {
      entry.label = entry.name + ": " + entry.activeMap.name;
      loadedSpecies.push(entry);
    });
    speciesOptions.value = loadedSpecies;
  }
  catch (err: any)
  {
    console.log('An error occurred while loading available species');
    console.log(err);
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
  //   console.log('An error occurred while looking up the available species');
  // }

  if (speciesOptions.value.length === 0 || store.state.species == null)
  {
    return;
  }
}

</script>

<style lang="scss">
  .data-track-dialog
  {
      width: 70vw;
      height: 60vw;

      .header-container {
          border-bottom: 2px grey solid;
          width: 100%;
          display: flex;
          padding-bottom: 1em;
          align-items: center;
          justify-content: space-between;

          table, th, td {
            border: 1px solid grey;
            border-spacing: 0;
          }
      }

      .p-dialog-content {
          height: 100%;

          .content-container {
            // background-color: rgb(217, 225, 225);
            height: 95%;
            padding-top: 1.5em;

            .add-track-btn {
              float: right;
            }
          }
      }
      .p-dialog-header {
        padding-bottom: 0em;
      }
      .backbone-info 
      {
        width: 50%;

        .col-5 {
            text-align: end;
        }
      }
      .grid {
          justify-content: space-between;
      }
      .modal-controls-container {
        padding: 0 1rem 2rem 1rem;
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
      
  }
</style>
