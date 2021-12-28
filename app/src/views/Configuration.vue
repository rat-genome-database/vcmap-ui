<template>
  <div class="configuration-header">
    <img alt="VCMap Logo" class="logo" src="../assets/images/vcmap_logo_v2.jpg">
    <h3 class="header">VCMap</h3><span class="version-label">v{{VERSION}}</span>
  </div>
  <div>
    <TabView v-model:activeIndex="active">
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
                  @change="updateStoreSpecies"
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
            <div class="col-12 text-center">
              <Button @click="addTempComparativeSpecies" label="Add Species" icon="pi pi-plus-circle" class="p-button" style="margin-right: .5em"/>
            </div>
            <div class="grid" v-for="species, index in comparativeSpecies" :key="species">
              <div class="lg:col-4 lg:col-offset-3 md:col-6 md:col-offset-2 sm:col-8 sm:col-offset-1">
                <Dropdown 
                  label="Comparative Species 2"
                  class="configuration-input" 
                  v-model="comparativeSpecies[index]" 
                  :loading="isLoadingSpecies"
                  :options="speciesOptions"
                  optionLabel="name" 
                  />
              </div>
              <div class="col-1 text-center">
                <Button @click="removeTempComparativeSpecies(index)" label="Remove" icon="pi pi-minus-circle" class="p-button-sm " />
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
                  @change="updateStoreSpecies"
                  optionLabel="name" 
                  placeholder="Backbone Species" />
              </div>
            </div>
            <div class="grid">
              <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1 p-fluid">
                <h4>Gene Symbol</h4>
                <div v-if="isLoadingGene == true">
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
            <div class="col-12 text-center">
              <Button @click="addTempComparativeSpecies" label="Add Species" icon="pi pi-plus-circle" class="p-button" style="margin-right: .5em"/>
            </div>
            <div class="grid" v-for="species, index in comparativeSpecies" :key="species">
              <div class="lg:col-4 lg:col-offset-3 md:col-6 md:col-offset-2 sm:col-8 sm:col-offset-1">
                <Dropdown 
                  label="Comparative Species 2"
                  class="configuration-input" 
                  v-model="comparativeSpecies[index]" 
                  :loading="isLoadingSpecies"
                  :options="speciesOptions"
                  optionLabel="name" 
                  />
              </div>
              <div class="col-1 text-center">
                <Button @click="removeTempComparativeSpecies(index)" label="Remove" icon="pi pi-minus-circle" class="p-button-sm " />
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

const router = useRouter();
const store = useStore();


// Reactive Properties
let speciesOptions = ref<Species[]>([]);
let selectedSpecies = ref<Species | null>(null);
let isLoadingSpecies = ref(false);

/* let mapOptions = ref<Map[]>([]);
let selectedMap = ref({});
let isLoadingMap = ref(false); */

let geneSuggestions = ref<Gene[]>([]);
let selectedGene = ref<Gene | null>(null);
let isLoadingGene = ref(false);

let chromosomeOptions = ref<Chromosome[]>([]);
let selectedChromosome = ref<Chromosome | null>();
let isLoadingChromosome = ref(false);

let startPosition = ref<Number | null>();
let stopPosition = ref<Number | null>();
let maxPosition = ref<number | null>();

let comparativeSpecies = ref<Species[] | Number[]>([]);



let active = ref(0);

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
    
    isLoadingChromosome.value = true;
    try
    {
      chromosomeOptions.value = await SpeciesApi.getChromosomes(store.getters.getSpecies.defaultMapKey);
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

  if (store.getters.getGene)
  {
    selectedGene.value = store.getters.getGene;
    let chrInfo = await SpeciesApi.getChromosomeInfo(store.getters.getGene.chromosome, store.getters.getSpecies.defaultMapKey);
    store.dispatch('setChromosome', chrInfo);
    selectedChromosome.value = store.getters.getChromosome;
  }

  if (store.getters.getChromosome)
  {
    selectedChromosome.value = store.getters.getChromosome;
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

  if (store.getters.getComparativeSpecies)
  {
    comparativeSpecies.value = store.getters.getComparativeSpecies;
  }
  
});

watch(() => store.getters.getSpecies, (newVal, oldVal) => {
  if (newVal !== oldVal && newVal !== null)
  {
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

      if (active.value == 0)
      {
        selectedSpecies.value = store.getters.getSpecies;
        SpeciesApi.getChromosomes(store.getters.getSpecies.defaultMapKey).then(chromosomes => {
          chromosomeOptions.value = chromosomes;
          isLoadingChromosome.value = false;
        });
      }
    }
    catch (err)
    {
      console.error(err);
    }
  }
});

watch(() => store.getters.getGene, (newVal, oldVal) => {
  if (newVal !== oldVal && newVal !== null)
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

      SpeciesApi.getChromosomeInfo(newVal.chromosome, store.getters.getSpecies.defaultMapKey).then(chrInfo => {
        store.dispatch('setChromosome', chrInfo);
        selectedChromosome.value = store.getters.getChromosome;
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

watch(() => store.getters.getChromosome, (newVal, oldVal) => {
  if (newVal !== oldVal && newVal !== null)
  {
    try
    {
      store.dispatch('setStartPosition', null);
      store.dispatch('setStopPosition', null);

      startPosition.value = null;
      stopPosition.value = null;
      maxPosition.value = null;

      selectedChromosome.value = store.getters.getChromosome;
      maxPosition.value = store.getters.getChromosome.seqLength;    
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
  for (let index = 0; index < comparativeSpecies.value.length; index++)
  {
    if (typeof comparativeSpecies.value[index] === 'number')
    {
      comparativeSpecies.value.splice(index, 1);
      index--;
    }
  }

  store.commit('comparativeSpecies', comparativeSpecies.value);
  router.push('/main');
};

const updateStoreSpecies = (event: any) => {
  store.dispatch('setSpecies', event.value);
};

/* const updateStoreMap = (event: any) => {
  store.dispatch('setMap', event.value);
}; */

const updateStoreChromosome = (event: any) => {
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


async function searchGene(event: any)
{
  isLoadingGene.value = true;
  let matches = await SpeciesApi.getGenesBySymbol(store.getters.getSpecies.defaultMapKey, event.query);
  geneSuggestions.value = matches;
  isLoadingGene.value = false;
}

function addTempComparativeSpecies()
{
  let currLength = comparativeSpecies.value.length;
  if (currLength < 5)
  {
    comparativeSpecies.value.push(currLength + 1);
  }
}

function removeTempComparativeSpecies(index: number)
{
  comparativeSpecies.value.splice(index, 1);
}


/* function resetStore() {
  store.dispatch('setSpecies', null);
  store.dispatch('setMap', null);
  store.dispatch('setChromosomeNum', null);
  store.dispatch('setChromosome', null);
} */
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
