<template>
  <div class="row header">
    <div class="flex md12 center-aligned">
      <h4 class="display-5">Backbone Configuration</h4>
    </div>
  </div>
    <div class="row">
      <div class="flex md6 offset--md3">
        <div class="row">
          <div class="flex md12">
            <va-select 
              label="Backbone Species"
              class="configuration-input" 
              @update:modelValue="updateStoreSpecies"
              v-model="selectedSpecies" 
              :loading="isLoadingSpecies"
              :options="speciesOptions"
              :track-by="(species: Species) => species.typeKey"
              :text-by="(species: Species) => species.name"
              outline />
          </div>
        </div>
        <div class="row">
          <div class="flex md12">
            <va-select 
              label="Assembly Map"
              class="configuration-input" 
              @update:modelValue="updateStoreMap"
              v-model="selectedMap"
              :disabled="!mapOptions.length"
              :no-options-text="'Select a species to view assembly maps'" 
              :loading="isLoadingMap"
              :options="mapOptions"
              :track-by="(map: Map) => map.key"
              :text-by="(map: Map) => map.name + ': ' + map.description + ' (' + map?.notes + ')'"
              outline />
          </div>
        </div>
        <div class="row">
          <div class="flex md12">
            <va-select 
              label="Chromosome"
              class="configuration-input"
              @update:modelValue="updateStoreChromosomeNum" 
              v-model="selectedChromosomeNum"
              :disabled = "!chromosomeNumOptions.length"
              :options="chromosomeNumOptions"
              :track-by="(chromosomeNum: Number) => chromosomeNum"
              :text-by="(chromosomeNum: Number) => chromosomeNum"
              />
          </div>
        </div>
        <div class="row">
          <div class="flex md6">
            <va-input
              label="Start Position"
              type="Number"
              class="configuration-input"
              @update:modelValue="updateStoreStartPosition" 
              v-model="startPosition"
              :disabled="!chromosomeInfo"
              max="maxPosition - 1"
              min="0"
              outline
           />
          </div>
          <div class="flex md6">
            <va-input
              label="Stop Position"
              type="Number"
              class="configuration-input" 
              @update:modelValue="updateStoreStopPosition"
              v-model="stopPosition"
              :disabled="!chromosomeInfo"
              max="maxPosition"
              min="1"
              outline
            />
          </div>
        </div>
        <div class="row header">
          <div class="flex md12 center-aligned">
            <h4 class="display-5">Comparative Backbones</h4>
          </div>  
        </div>  
        <div class="row">
          <div class="flex md12">
            <va-select 
              label="Comparative Species 1"
              class="configuration-input" 
              @update:modelValue="updateStoreComparativeSpeciesOne"
              v-model="comparativeSpeciesOne" 
              :loading="isLoadingSpecies"
              :options="speciesOptions"
              :track-by="(species: Species) => species.typeKey"
              :text-by="(species: Species) => species.name"
              outline />
          </div>
        </div>
        <div class="row">
          <div class="flex md12">
            <va-select 
              label="Comparative Species 2"
              class="configuration-input" 
              @update:modelValue="updateStoreComparativeSpeciesTwo"
              v-model="comparativeSpeciesTwo" 
              :loading="isLoadingSpecies"
              :options="speciesOptions"
              :track-by="(species: Species) => species.typeKey"
              :text-by="(species: Species) => species.name"
              outline />
          </div>
        </div>
        <div class="row">
          <div class="flex md6 offset--md3 center-aligned start-button">
            <va-button @click="goToMainScreen">Load VCMap</va-button>
          </div>
        </div>
      </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import SpeciesApi from '@/api/SpeciesApi';
import Species from '@/models/Species';
import Map from '@/models/Map';
import Chromosome from '@/models/Chromosome';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const router = useRouter();
const store = useStore();


// Reactive Properties
let speciesOptions = ref<Species[]>([]);
let selectedSpecies = ref({});
let isLoadingSpecies = ref(false);

let mapOptions = ref<Map[]>([]);
let selectedMap = ref({});
let isLoadingMap = ref(false);

let chromosomeNumOptions = ref<Number[]>([]);
let selectedChromosomeNum = ref<Number>();
let chromosomeInfo = ref<Chromosome>();

let isLoadingChromosome = ref(false);

let startPosition = ref<Number>();
let stopPosition = ref<Number>();
let maxPosition = ref<Number>(0);

let comparativeSpeciesOne = ref<Species>();
let comparativeSpeciesTwo = ref<Species>();

// Lifecycle Hooks
onMounted(async () => {
  //resetStore();
  isLoadingSpecies.value = true;
  try
  {
    speciesOptions.value = await SpeciesApi.getSpecies();
  }
  catch (err)
  {
    console.error(err);
  }
  finally
  {
    isLoadingSpecies.value = false;
  }
  
  if (store.getters.getSpecies)
  {
    selectedSpecies.value = store.getters.getSpecies;
    isLoadingMap.value = true;

    try
    {
      let maps = await SpeciesApi.getMaps(store.getters.getSpecies.typeKey);
      mapOptions.value = maps; 
    }
    catch (err)
    {
      console.error(err);
    }
    finally
    {
      isLoadingMap.value = false;
    }
  }
  if (store.getters.getMap)
  {
    selectedMap.value = store.getters.getMap;
    isLoadingChromosome.value = true;

    try
    {
      let chromosomes = await SpeciesApi.getChromosomes(store.getters.getMap.key);
      chromosomeNumOptions.value = chromosomes;
    }
    catch (err)
    {
      console.error(err);
    }
    finally
    {
      isLoadingChromosome.value = false;
    }
  }

  if (store.getters.getChromosomeNum)
  {
    selectedChromosomeNum.value = store.getters.getChromosomeNum;
    isLoadingChromosome.value = true;

    try
    {
      let chrInfo = await SpeciesApi.getChromosomeInfo(store.getters.getChromosomeNum, store.getters.getMap.key);
      chromosomeInfo.value = chrInfo;
      updateStoreChromosome(chromosomeInfo.value);
    }
    catch (err)
    {
      console.error(err);
    }
    finally
    {
      isLoadingChromosome.value = false;
    }
  }

  if (store.getters.getChromosome)
  {
    maxPosition.value = store.getters.getChromosome.seqLength;
  }

  if (store.getters.getStartPosition)
  {
    startPosition.value = store.getters.getStartPosition;
  }

  if (store.getters.getStopPosition)
  {
    stopPosition.value = store.getters.getStopPosition;
  }

  if (store.getters.getComparativeSpeciesOne)
  {
    comparativeSpeciesOne.value = store.getters.getComparativeSpeciesOne;
  }

  if (store.getters.getComparativeSpeciesTwo)
  {
    comparativeSpeciesTwo.value = store.getters.getComparativeSpeciesTwo;
  }
});


watch(() => store.getters.getSpecies, (newVal, oldVal) => {
  if (newVal !== oldVal && newVal !== null)
  {
    isLoadingMap.value = true;

    try
    {
      store.dispatch('setMap', null);
      store.dispatch('setChromosomeNum', null);
      store.dispatch('setChromosome', null);
      store.dispatch('setStartPosition', null);
      store.dispatch('setStopPosition', null);

      mapOptions.value = [];
      selectedMap.value = {};
      chromosomeNumOptions.value = [];
      selectedChromosomeNum.value = {};
      chromosomeInfo.value = null;
      startPosition.value = null;
      stopPosition.value = null;
      maxPosition.value = null;

      SpeciesApi.getMaps(newVal.typeKey).then(maps => {
        mapOptions.value = maps;
        isLoadingMap.value = false;
      });
    }
    catch (err)
    {
      console.error(err);
    }
    finally
    {
      isLoadingMap.value = false;
    }
  }
});

watch(() => store.getters.getMap, (newVal, oldVal) => {
  if (newVal !== oldVal && newVal !== null)
  {
    isLoadingChromosome.value = true;
    try
    {
      store.dispatch('setChromosomeNum', null);
      store.dispatch('setChromosome', null);
      store.dispatch('setStartPosition', null);
      store.dispatch('setStopPosition', null);

      chromosomeNumOptions.value = [];
      selectedChromosomeNum.value = {};
      chromosomeInfo.value = {};
      startPosition.value = null;
      stopPosition.value = null;
      maxPosition.value = null;

      SpeciesApi.getChromosomes(store.getters.getMap.key).then(chrs => {
        chromosomeNumOptions.value = chrs;
      });
    }
    catch (err)
    {
      console.error(err);
    }
    finally
    {
      isLoadingChromosome.value = false;
    }
  }
});

watch(() => store.getters.getChromosomeNum, (newVal, oldVal) => {
  if (newVal !== oldVal && newVal !== null)
  {
    isLoadingChromosome.value = true;
    try
    {
      store.dispatch('setChromosome', null);
      store.dispatch('setStartPosition', null);
      store.dispatch('setStopPosition', null);

      chromosomeInfo.value = {};
      startPosition.value = null;
      stopPosition.value = null;
      maxPosition.value = null;

      SpeciesApi.getChromosomeInfo(newVal, store.getters.getMap.key).then(chrInfo => {
        chromosomeInfo.value = chrInfo;
        updateStoreChromosome(chromosomeInfo.value);
      });
      maxPosition.value =  10
    }
    catch (err)
    {
      console.error(err);
    }
    finally
    {
      isLoadingChromosome.value = false;
    }
  }
});

// Methods
const goToMainScreen = () => {
  router.push('/main');
};

const updateStoreSpecies = (species: Species) => {
  store.dispatch('setSpecies', species);
};

const updateStoreMap = (map: Map) => {
  store.dispatch('setMap', map);
};

const updateStoreChromosomeNum = (chromosome: Number) => {
  store.dispatch('setChromosomeNum', chromosome);
};

const updateStoreChromosome = (chromosome: Chromosome) => {
  store.dispatch('setChromosome', chromosome);
};

const updateStoreStartPosition = (start: Number) => {
  store.dispatch('setStartPosition', start);
};

const updateStoreStopPosition = (stop: Number) => {
  store.dispatch('setStopPosition', stop);
};

const updateStoreComparativeSpeciesOne = (species: Species) => {
  store.dispatch('setComparativeSpeciesOne', species);
};

const updateStoreComparativeSpeciesTwo = (species: Species) => {
  store.dispatch('setComparativeSpeciesTwo', species);
};

/* function resetStore() {
  store.dispatch('setSpecies', null);
  store.dispatch('setMap', null);
  store.dispatch('setChromosomeNum', null);
  store.dispatch('setChromosome', null);
} */
</script>

<style lang="scss" scoped>
.configuration-input
{
  padding: 0.5em;
}

.start-button
{
  margin-top: 1em;
}
</style>
