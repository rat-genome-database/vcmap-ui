<template>
  <div>
    <TabView :activeIndex="activeIndex">
      <TabPanel header="Load by Position">
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
                  :step="50"
                  :max="(maxPosition != null) ? maxPosition - 1 : 1"
                  :min="0"
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
                  :step="50"
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
                  @change="updateStoreSpecies"
                  optionLabel="name" 
                  placeholder="Backbone Species" />
              </div>
            </div>
            <div class="grid">
              <div class="lg:col-6 lg:col-offset-3 md:col-8 md:col-offset-2 sm:col-10 sm:col-offset-1 p-fluid">
                <h4>Gene Symbol</h4>
                <AutoComplete
                  class="configuration-input"
                  v-model="selectedGene"
                  :suggestions="geneSuggestions"
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
                  label="Start Position"
                  class="configuration-input"
                  showButtons
                  @input="updateStoreStartUpstream" 
                  v-model="startPosition"
                  :disabled="!selectedChromosome"
                  suffix="bp"
                  :step="50"
                  :max="(maxPosition != null) ? maxPosition - 1 : 1"
                  :min="0"
                />
              </div>
              <div class="lg:col-3 md:col-4 md:col-offset-1 sm:col-5 sm:col-offset-1">
                <h4 v-if="selectedGene">Downstream Length {{ '(Gene Stop: ' + selectedGene.stop + ')' }}</h4>
                <h4 v-else>Downstream Length</h4>
                <InputNumber
                  label="Stop Position"
                  class="configuration-input" 
                  showButtons
                  @input="updateStoreStopDownstream"
                  v-model="stopPosition"
                  :disabled="!selectedChromosome"
                  suffix="bp"
                  :step="50"
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
import Map from '@/models/Map';
import Gene from '@/models/Gene';
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

let geneOptions = ref<Gene[]>([]);
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

let activeIndex = ref(0);

// Lifecycle Hooks
onMounted(async () => {
  //resetStore();
  isLoadingSpecies.value = true;
  try
  {
    speciesOptions.value = await SpeciesApi.getSpecies();
    console.log(activeIndex)
    if (activeIndex == 1)
    {
      geneOptions.value = await SpeciesApi.getGenes(store.getters.getSpecies.defaultMapKey);
    }
    
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

      selectedSpecies.value = store.getters.getSpecies;
      SpeciesApi.getChromosomes(store.getters.getSpecies.defaultMapKey).then(chromosomes => {
        chromosomeOptions.value = chromosomes;
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
  router.push('/main');
};

const updateStoreSpecies = (event: any) => {
  store.dispatch('setSpecies', event.value);
};

const updateStoreMap = (event: any) => {
  store.dispatch('setMap', event.value);
};

const updateStoreChromosome = (event: any) => {
  store.dispatch('setChromosome', event.value);
  console.log('CHR', event.value);
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

function searchGene(event)
{
  let matches = geneOptions.value.filter(gene => {
    return gene.symbol.toLowerCase().indexOf(event.query.toLowerCase()) > -1;
  });
  geneSuggestions.value = matches;
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
</style>
