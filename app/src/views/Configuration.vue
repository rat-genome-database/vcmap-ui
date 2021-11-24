<template>
  <div class="grid">
    <div class="col-12 text-center">
      <h2>Backbone Configuration</h2>
    </div>
    <div class="col-12">
      <div class="grid">
        <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1">
          <h4>Backbone Species</h4>
          <Dropdown 
            v-model="selectedSpecies" 
            :options="speciesOptions" 
            :loading="isLoadingSpecies"
            @change="updateStoreSpecies"
            optionLabel="name" 
            placeholder="Backbone Species" />
        </div>
      </div>
      <div class="grid">
        <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1">
          <h4>Assembly Map</h4>
          <Dropdown 
            class="configuration-input" 
            @change="updateStoreMap"
            v-model="selectedMap"
            :disabled="!mapOptions.length"
            :loading="isLoadingMap"
            :options="mapOptions"
            optionLabel="name"
            />
        </div>
      </div>
      <div class="grid">
        <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1">
          <h4>Chromosome</h4>
          <Dropdown 
            class="configuration-input"
            @change="updateStoreChromosomeNum" 
            v-model="selectedChromosomeNum"
            :disabled = "!chromosomeNumOptions.length"
            :options="chromosomeNumOptions"
            />
        </div>
      </div>
      <div class="grid">
        <div class="lg:col-2 lg:col-offset-3 md:col-4 md:col-offset-1 sm:col-5 sm:col-offset-1">
          <h4>Start Position</h4>
          <InputNumber
            label="Start Position"
            class="configuration-input"
            showButtons
            @input="updateStoreStartPosition" 
            v-model="startPosition"
            :disabled="!chromosomeInfo"
            suffix="bp"
            :max="(maxPosition != null) ? maxPosition - 1 : 1"
            :min="0"
          />
        </div>
        <div class="lg:col-2 md:col-4 md:col-offset-1 sm:col-5 sm:col-offset-1">
          <h4>Stop Position</h4>
          <InputNumber
            label="Stop Position"
            class="configuration-input" 
            showButtons
            @input="updateStoreStopPosition"
            v-model="stopPosition"
            :disabled="!chromosomeInfo"
            suffix="bp"
            :max="maxPosition"
            :min="1"
          />
        </div>
      </div>
      <div class="col-12 text-center">
        <h2>Comparative Species</h2>
      </div>
      <div class="grid">
        <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1">
          <Dropdown 
            label="Comparative Species 1"
            class="configuration-input" 
            @change="updateStoreComparativeSpeciesOne"
            v-model="comparativeSpeciesOne" 
            :loading="isLoadingSpecies"
            :options="speciesOptions"
            optionLabel="name" 
             />
        </div>
      </div>
      <div class="grid">
        <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1">
          <Dropdown 
            label="Comparative Species 2"
            class="configuration-input" 
            @change="updateStoreComparativeSpeciesTwo"
            v-model="comparativeSpeciesTwo" 
            :loading="isLoadingSpecies"
            :options="speciesOptions"
            optionLabel="name" 
             />
        </div>
      </div>
      <div class="grid">
        <div class="col-12 text-center">
          <Button @click="goToMainScreen" label="Load VCMap" icon="pi pi-play" class="p-button-lg" />
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
let selectedSpecies = ref<Species | null>(null);
let isLoadingSpecies = ref(false);

let mapOptions = ref<Map[]>([]);
let selectedMap = ref({});
let isLoadingMap = ref(false);

let chromosomeNumOptions = ref<Number[]>([]);
let selectedChromosomeNum = ref<Number | null>();
let chromosomeInfo = ref<Chromosome | null>();

let isLoadingChromosome = ref(false);

let startPosition = ref<Number | null>();
let stopPosition = ref<Number | null>();
let maxPosition = ref<number | null>();

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
      selectedChromosomeNum.value = null;
      chromosomeInfo.value = null;
      startPosition.value = null;
      stopPosition.value = null;
      maxPosition.value = null;

      SpeciesApi.getMaps(store.getters.getSpecies.typeKey).then(maps => {
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
      selectedChromosomeNum.value = null;
      chromosomeInfo.value = null;
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

      chromosomeInfo.value = null;
      startPosition.value = null;
      stopPosition.value = null;
      maxPosition.value = null;

      SpeciesApi.getChromosomeInfo(newVal, store.getters.getMap.key).then(chrInfo => {
        chromosomeInfo.value = chrInfo;
        updateStoreChromosome(chromosomeInfo.value);
        maxPosition.value = store.getters.getChromosome.seqLength;
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

// Methods
const goToMainScreen = () => {
  router.push('/main');
};

const updateStoreSpecies = (event: any) => {
  store.dispatch('setSpecies', event.value);
};

const updateStoreMap = (event: any) => {
  store.dispatch('setMap', event.value);
};

const updateStoreChromosomeNum = (event: any) => {
  store.dispatch('setChromosomeNum', event.value);
};

const updateStoreChromosome = (chromosome: Chromosome) => {
  store.dispatch('setChromosome', chromosome);
};

const updateStoreStartPosition = (event: any) => {
  store.dispatch('setStartPosition', event.value);
};

const updateStoreStopPosition = (event: any) => {
  store.dispatch('setStopPosition', event.value);
};

const updateStoreComparativeSpeciesOne = (event: any) => {
  store.dispatch('setComparativeSpeciesOne', event.value);
};

const updateStoreComparativeSpeciesTwo = (event: any) => {
  store.dispatch('setComparativeSpeciesTwo', event.value);
};
</script>

<style lang="scss" scoped>
.p-dropdown
{
  width: 100%;
}

.start-button
{
  margin-top: 1em;
}
</style>
