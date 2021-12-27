<template>
  <div class="configuration-header">
    <img alt="VCMap Logo" class="logo" src="../assets/images/vcmap_logo_v2.jpg">
    <h3 class="header">VCMap</h3><span class="version-label">v{{VERSION}}</span>
  </div>
  <div>
    <TabView v-model:activeIndex="activeTab">
      <TabPanel header="Load by Position" >
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
                  @change="onSpeciesChange"
                  optionLabel="name" 
                  placeholder="Backbone Species" />
              </div>
            </div>
            
            <div class="grid">
              <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1">
                <h4>Chromosome</h4>
                <Dropdown 
                  class="configuration-input"
                  @change="updateStoreChromosome" 
                  v-model="selectedChromosome"
                  :disabled = "!chromosomeOptions.length"
                  :options="chromosomeOptions"
                  :loading="isLoadingChromosome"
                  optionLabel="chromosome"
                  />
              </div>
            </div>
            <div class="grid">
              <div class="lg:col-2 lg:col-offset-3 md:col-4 md:col-offset-1 sm:col-5 sm:col-offset-1">
                <h4>Start Position</h4>
                <InputNumber
                  class="configuration-input"
                  showButtons
                  @input="updateStoreStartPosition" 
                  v-model="startPosition"
                  :disabled="!selectedChromosome"
                  suffix="bp"
                  :step="500"
                  :max="(maxPosition != null) ? maxPosition - 1 : 1"
                  :min="1"
                />
              </div>
              <div class="lg:col-3 md:col-5 md:col-offset-1 sm:col-6 sm:col-offset-1">
                <h4 v-if="maxPosition">Stop Position {{ '(' + maxPosition + ' max)'}}</h4>
                <h4 v-else>Stop Position</h4>
                <InputNumber
                  class="configuration-input" 
                  showButtons
                  @input="updateStoreStopPosition"
                  v-model="stopPosition"
                  :disabled="!selectedChromosome"
                  suffix="bp"
                  :step="500"
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
            
          </div>
        </div>
      </TabPanel>

      <TabPanel header="Load by Gene">
        <div class="grid">
          <div class="col-12 text-center">
            <h2>Backbone Configuration</h2>
          </div>
          <div class="col-12">
            <div class="grid">
              <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1 ">
                <h4>Backbone Species</h4>
                <Dropdown 
                  v-model="selectedSpecies" 
                  :options="speciesOptions" 
                  :loading="isLoadingSpecies"
                  @change="onSpeciesChange"
                  optionLabel="name" 
                  placeholder="Backbone Species" />
              </div>
            </div>
            <div class="grid">
              <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1 p-fluid">
                <h4>Gene Symbol</h4>
                <div v-if="isLoadingGene">
                  <ProgressSpinner style="width:50px;height:50px"/>
                </div>
                <AutoComplete
                  class="configuration-input"
                  v-model="selectedGene"
                  :suggestions="geneSuggestions"
                  :disabled="!selectedSpecies"
                  @complete="searchGene($event)"
                  @item-select="updateStoreGene"
                  field="symbol"
                  :minLength="3"
                />
              </div>
            </div>
            <div class="grid">
              <div class="lg:col-3 lg:col-offset-3 md:col-4 md:col-offset-1 sm:col-5 sm:col-offset-1">
                <h4 v-if="selectedGene">Upstream Length {{ '(Gene Start: ' + selectedGene.start + ')' }}</h4>
                <h4 v-else>Upstream Length</h4>
                <InputNumber
                  class="configuration-input"
                  showButtons
                  @input="updateStoreStartUpstream" 
                  v-model="startPosition"
                  :disabled="!selectedChromosome"
                  required
                  suffix="bp"
                  :step="500"
                  :max="(maxPosition != null) ? maxPosition - 1 : 1"
                  :min="1"
                />
              </div>
              <div class="lg:col-3 md:col-3 md:col-offset-1 sm:col-5 sm:col-offset-1">
                <h4 v-if="selectedGene">Downstream Length {{ '(Gene Stop: ' + selectedGene.stop + ')' }}</h4>
                <h4 v-else>Downstream Length</h4>
                <InputNumber
                  class="configuration-input" 
                  showButtons
                  @input="updateStoreStopDownstream"
                  v-model="stopPosition"
                  :disabled="!selectedChromosome"
                  required
                  suffix="bp"
                  :step="500"
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
          </div>
        </div>
      </TabPanel>
    </TabView>
    <div class="grid">
      <div class="col-12 text-center">
        <Button @click="goToMainScreen" label="Load VCMap" icon="pi pi-play" class="p-button-lg" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import SpeciesApi from '@/api/SpeciesApi';
import Species from '@/models/Species';
import Gene from '@/models/Gene';
import Chromosome from '@/models/Chromosome';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { VERSION } from '@/version';
import { AxiosError } from 'axios';

const TABS = {
  POSITION: 0,
  GENE: 1
};

const router = useRouter();
const store = useStore();

let speciesOptions = ref<Species[]>([]);
let selectedSpecies = ref<Species | null>(null);
let isLoadingSpecies = ref(false);

let geneSuggestions = ref<Gene[]>([]);
let selectedGene = ref<Gene | null>(null);
let isLoadingGene = ref(false);

let chromosomeOptions = ref<Chromosome[]>([]);
let selectedChromosome = ref<Chromosome | null>();
let isLoadingChromosome = ref(false);

let startPosition = ref<Number | null>();
let stopPosition = ref<Number | null>();
let maxPosition = ref<number | null>();

let comparativeSpeciesOne = ref<Species>();
let comparativeSpeciesTwo = ref<Species>();

let activeTab = ref(TABS.POSITION);

onMounted(prepopulateConfigOptions);
watch(() => store.getters.getGene, onGeneChange);
watch(() => store.getters.getChromosome, resetChromosomeStartAndStop);


// Methods
const goToMainScreen = () => {
  router.push('/main');
}

const updateStoreChromosome = (event: any) => {
  console.log('update chromosome called')
  store.dispatch('setChromosome', event.value);
};

const updateStoreStartPosition = (event: any) => {
  store.dispatch('setStartPosition', event.value);
};

const updateStoreStopPosition = (event: any) => {
  store.dispatch('setStopPosition', event.value);
};

const updateStoreStartUpstream = (event: any) => {
  let start = parseInt(selectedGene.value.start) - parseInt(event.value);
  start <= 0 ? start = 1 : start;
  store.dispatch('setStartPosition', start);
};

const updateStoreStopDownstream = (event: any) => {
  let stop = parseInt(selectedGene.value.stop) + parseInt(event.value);
  stop > maxPosition.value ? stop = maxPosition.value : stop;
  store.dispatch('setStopPosition', stop);
};

const updateStoreGene = (event: any) => {
  store.dispatch('setGene', event.value);
};

const updateStoreComparativeSpeciesOne = (event: any) => {
  store.dispatch('setComparativeSpeciesOne', event.value);
};

const updateStoreComparativeSpeciesTwo = (event: any) => {
  store.dispatch('setComparativeSpeciesTwo', event.value);
};

async function searchGene(event: any)
{
  isLoadingGene.value = true;
  try
  {
    const matches = await SpeciesApi.getGenesBySymbol(store.getters.getSpecies.defaultMapKey, event.query);
    geneSuggestions.value = matches;
  }
  catch (err: any)
  {
    onNetworkError(err);
  }
  finally
  {
    isLoadingGene.value = false;
  }
}

async function onSpeciesChange(changeEvent: any)
{
  store.dispatch('setSpecies', changeEvent.value);

  isLoadingChromosome.value = true;
  try
  {
    store.dispatch('setGene', null);
    store.dispatch('setChromosome', null);
    store.dispatch('setStartPosition', null);
    store.dispatch('setStopPosition', null);

    chromosomeOptions.value = [];
    selectedChromosome.value = null;
    startPosition.value = null;
    stopPosition.value = null;
    maxPosition.value = null;

    if (activeTab.value === TABS.POSITION)
    {
      selectedSpecies.value = store.getters.getSpecies;
      const chromosomes = await SpeciesApi.getChromosomes(store.getters.getSpecies.defaultMapKey);
      chromosomeOptions.value = chromosomes;
    }
  }
  catch (err: any)
  {
    onNetworkError(err);
  }
  finally
  {
    isLoadingChromosome.value = false;
  }
}

async function onGeneChange(gene: Gene)
{
  isLoadingChromosome.value = true;
  try
  {
    store.dispatch('setChromosome', null);
    store.dispatch('setStartPosition', null);
    store.dispatch('setStopPosition', null);

    startPosition.value = null;
    stopPosition.value = null;
    maxPosition.value = null;

    selectedGene.value = store.getters.getGene;

    const chrInfo = await SpeciesApi.getChromosomeInfo(gene.chromosome, store.getters.getSpecies.defaultMapKey);
    store.dispatch('setChromosome', chrInfo);
    selectedChromosome.value = store.getters.getChromosome; 
  }
  catch (err: any)
  {
    onNetworkError(err);
  }
  finally
  {
    isLoadingChromosome.value = false;
  }
}

function resetChromosomeStartAndStop()
{
  store.dispatch('setStartPosition', null);
  store.dispatch('setStopPosition', null);

  startPosition.value = null;
  stopPosition.value = null;
  selectedChromosome.value = store.getters.getChromosome;
  maxPosition.value = store.getters.getChromosome?.seqLength; 
}

async function prepopulateConfigOptions()
{
  console.log('mounted');
  isLoadingSpecies.value = true;
  try
  {
    speciesOptions.value = await SpeciesApi.getSpecies();
  }
  catch (err: any)
  {
    onNetworkError(err);
  }
  finally
  {
    isLoadingSpecies.value = false;
  }
  
  if (store.getters.getSpecies)
  {
    selectedSpecies.value = store.getters.getSpecies;
    
    isLoadingChromosome.value = true;
    try
    {
      chromosomeOptions.value = await SpeciesApi.getChromosomes(store.getters.getSpecies.defaultMapKey);
    }
    catch (err: any)
    {
     onNetworkError(err);
    }
    finally
    {
      isLoadingChromosome.value = false;
    }
  }

  selectedGene.value = store.getters.getGene;
  if (store.getters.getGene && !store.getters.getChromosome)
  {
    // If chromosome not present in the store, set it based on the gene
    let chrInfo = await SpeciesApi.getChromosomeInfo(store.getters.getGene.chromosome, store.getters.getSpecies.defaultMapKey);
    store.dispatch('setChromosome', chrInfo);
    selectedChromosome.value = store.getters.getChromosome;
  }
  else
  {
    // Chromosome data exists on the store
    selectedChromosome.value = store.getters.getChromosome;
    maxPosition.value = store.getters.getChromosome?.seqLength;
    startPosition.value = store.getters.getStartPosition ?? 0;
    stopPosition.value = store.getters.getStopPosition ?? 0;
  }
  
  // Pre-populate previously selected comparative species
  comparativeSpeciesOne.value = store.getters.getComparativeSpeciesOne;
  comparativeSpeciesTwo.value = store.getters.getComparativeSpeciesTwo;
}

function onNetworkError(err: AxiosError)
{
  console.error(err.response?.data);
}
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

.configuration-header
{
  display: inline-flex;
  align-items: center;
  .header
  {
    margin-left: 2rem;
  }
}
</style>
